import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { query, queryMany, queryOne } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/serverAuth';

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

async function checkRateLimit(userId) {
  if (!userId) return { allowed: true };

  try {
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const result = await queryOne(
      `SELECT COUNT(*) as count FROM chat_logs
       WHERE user_id = $1 AND created_at > $2`,
      [userId, oneHourAgo]
    );

    const messageCount = result?.count || 0;
    if (messageCount >= RATE_LIMIT_MAX) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + RATE_LIMIT_WINDOW_MS),
      };
    }

    return { allowed: true, remaining: RATE_LIMIT_MAX - messageCount };
  } catch (err) {
    console.error('Rate limit check failed:', err.message);
    return { allowed: true };
  }
}

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS chat_logs (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      query TEXT NOT NULL,
      response TEXT,
      relevant BOOLEAN,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function buildProjectContext() {
  try {
    const universities = await queryMany(
      `SELECT u.id, u.name, u.location, u.website, u.description
       FROM universities u ORDER BY u.name`,
      []
    );

    if (!universities.length) return null;

    const lines = ['=== SMART ADMISSION GUIDE — LIVE DATABASE ===\n'];

    for (const u of universities) {
      lines.push(`## ${u.name}${u.location ? ` (${u.location})` : ''}`);
      if (u.description) lines.push(`About: ${u.description}`);
      if (u.website) lines.push(`Website: ${u.website}`);

      const programs = await queryMany(
        `SELECT name, field, duration, fee, merit_percentage, eligibility
         FROM programs WHERE university_id = $1 ORDER BY name`,
        [u.id]
      );
      if (programs.length) {
        lines.push('Programs:');
        for (const p of programs) {
          let pLine = `  - ${p.name}`;
          if (p.field) pLine += ` [${p.field}]`;
          if (p.duration) pLine += `, ${p.duration}`;
          if (p.merit_percentage) pLine += `, Merit: ${p.merit_percentage}%`;
          if (p.fee) pLine += `, Fee: PKR ${p.fee}`;
          if (p.eligibility) pLine += `, Eligibility: ${p.eligibility}`;
          lines.push(pLine);
        }
      }

      const events = await queryMany(
        `SELECT event_type, start_date, end_date, status, details
         FROM university_events WHERE university_id = $1 ORDER BY start_date NULLS LAST`,
        [u.id]
      );
      if (events.length) {
        lines.push('Admission Events:');
        for (const e of events) {
          let eLine = `  - ${e.event_type || 'Admission'}`;
          if (e.start_date) eLine += `, Opens: ${e.start_date.toISOString?.().split('T')[0] ?? e.start_date}`;
          if (e.end_date) eLine += `, Closes: ${e.end_date.toISOString?.().split('T')[0] ?? e.end_date}`;
          if (e.status) eLine += ` [${e.status}]`;
          if (e.details) eLine += ` — ${e.details}`;
          lines.push(eLine);
        }
      }

      const scholarships = await queryMany(
        `SELECT name, amount, deadline, eligibility, description
         FROM scholarships WHERE university_id = $1 ORDER BY deadline NULLS LAST`,
        [u.id]
      );
      if (scholarships.length) {
        lines.push('Scholarships:');
        for (const s of scholarships) {
          let sLine = `  - ${s.name}`;
          if (s.amount) sLine += `, PKR ${s.amount}`;
          if (s.deadline) sLine += `, Deadline: ${s.deadline.toISOString?.().split('T')[0] ?? s.deadline}`;
          if (s.eligibility) sLine += ` — ${s.eligibility}`;
          lines.push(sLine);
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  } catch (err) {
    console.error('buildProjectContext error (non-fatal):', err.message);
    return null;
  }
}

const ELIGIBLE_PROGRAMS = {
  fa:              "Mass Communication, Journalism, Law (LLB), Psychology, Economics, Sociology, Social Work, Education, Political Science, English Literature, Fine Arts, International Relations, Islamic Studies, Public Administration, Linguistics, History",
  fsc_medical:     "Medicine (MBBS), Pharmacy, Dentistry, Physiotherapy, Nursing, Biotechnology, Microbiology, Biomedical Sciences, Veterinary Medicine, Public Health, Nutrition & Dietetics",
  fsc_engineering: "Civil Engineering, Mechanical Engineering, Electrical Engineering, Chemical Engineering, Aerospace Engineering, Architecture, Environmental Engineering, Mechatronics Engineering",
  ics:             "Computer Science, Software Engineering, Data Science, Artificial Intelligence, Cybersecurity, Information Technology, Electrical Engineering, Mechatronics Engineering, Mathematics",
  icom:            "Business Administration (BBA/MBA), Accounting & Finance, Economics, Commerce, Banking & Finance, Marketing, Human Resource Management, Supply Chain Management, Public Administration",
};

function buildProfileNote(student) {
  if (!student) return "";

  const academicLevel = student.academic_level;
  const facts = [];

  if (academicLevel && ELIGIBLE_PROGRAMS[academicLevel]) {
    facts.push(`Completed academic level: ${academicLevel.toUpperCase().replace(/_/g, " ")}`);
  }
  if (student.interests) facts.push(`Stated interests/goals: ${student.interests}`);
  if (student.matric_marks) facts.push(`Matric marks: ${student.matric_marks}%`);
  if (student.intermediate_marks) facts.push(`Intermediate marks: ${student.intermediate_marks}%`);
  if (student.has_entry_test && student.test_type) {
    facts.push(`Entry test: ${student.test_type.toUpperCase()}${student.test_score ? `, score ${student.test_score}` : ""}`);
  }

  if (!facts.length) return "";

  const eligibilityNote = academicLevel && ELIGIBLE_PROGRAMS[academicLevel]
    ? ` When suggesting programs or departments, ONLY recommend programs they are eligible for: ${ELIGIBLE_PROGRAMS[academicLevel]}. Do NOT suggest programs outside this list.`
    : "";

  return `\n\nSTUDENT PROFILE (already on file — DO NOT ask the student to re-confirm any of this, use it directly):\n${facts.map((f) => `- ${f}`).join("\n")}\n${eligibilityNote}\nOnly ask the student for details that are NOT listed above (e.g. location preference, budget, university type) if you need them to narrow down a recommendation.`;
}

function buildSystemPrompt(dbContext, student) {
  const base = `You are SAG AI — the intelligent assistant for Smart Admission Guide (SAG), a platform helping Pakistani students ONLY with Pakistani university admissions.`;

  const levelNote = buildProfileNote(student);

  if (!dbContext) {
    return `${base}${levelNote}

No university data is available in the database yet. Politely inform the user that admission data is still being loaded into the system and ask them to check back soon. Do not answer from general knowledge.`;
  }

  return `${base}${levelNote}

YOUR KNOWLEDGE IS STRICTLY LIMITED TO THE DATA BELOW. ZERO outside knowledge allowed.

${dbContext}

=== CRITICAL RULES ===
- SCOPE: ONLY answer about Pakistani universities, programs, admissions, fees, scholarships, and deadlines listed above.
- DATA SOURCE: Answer ONLY using the database information provided above. Nothing else.
- PAKISTAN ONLY: If a user asks about international/foreign universities, say "SAG AI only covers Pakistani universities."
- BLOCKED TOPICS: Do NOT answer questions about coding, programming, homework help, general knowledge, jokes, sports, or anything unrelated to Pakistani admissions.
- MISSING DATA: If specific data is missing, say "This information is not available in our system right now."
- NO FABRICATION: Never guess, invent, or supplement with general knowledge.
- NO CODE: Never provide code, programming help, or technical solutions of any kind.
- FORMAT: Be concise, warm, and student-friendly. Use bullet points for lists.
- OFF-TOPIC: For any unrelated question, respond with EXACTLY: "Please ask questions relevant to the Admission Guide." — nothing else.`;
}

const BLOCKED_KEYWORDS = [
  'code', 'javascript', 'python', 'java', 'c++', 'html', 'css', 'sql',
  'algorithm', 'debug', 'function', 'variable', 'syntax', 'compile',
  'programming', 'coding', 'developer', 'backend', 'frontend', 'api',
  'database', 'server', 'react', 'node', 'git', 'github', 'docker',
  'joke', 'funny', 'sports', 'movie', 'game', 'recipe', 'cooking',
  'weather', 'health', 'doctor', 'medicine', 'diet', 'fitness',
  'politics', 'news', 'entertainment', 'music', 'story', 'poem',
  'how to hack', 'how to cheat', 'answers to', 'solve this', 'do my homework',
];

function isBlockedQuestion(text) {
  const lower = text.toLowerCase();
  return BLOCKED_KEYWORDS.some((kw) => lower.includes(kw));
}

function isAdmissionRelated(text) {
  const keywords = [
    'university', 'admission', 'merit', 'test', 'ecat', 'nust', 'fast',
    'lums', 'iba', 'comsats', 'giki', 'uet', 'scholarship', 'program', 'degree',
    'bs', 'bba', 'fee', 'hostel', 'apply', 'application', 'eligibility',
    'marks', 'percentage', 'score', 'entry', 'enroll', 'campus', 'department',
    'study', 'course', 'career', 'pakistan', 'hec', 'engineering',
    'computer', 'software', 'business', 'arts', 'science', 'education', 'sag',
  ];
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

// Fetch additional context from DuckDuckGo Instant Answer API (free, no key required)
async function fetchWebContext(userQuery) {
  try {
    const searchQ = encodeURIComponent(`${userQuery} Pakistan university admissions`);
    const url = `https://api.duckduckgo.com/?q=${searchQ}&format=json&no_html=1&skip_disambig=1&t=sag`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SmartAdmissionGuide/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();

    const parts = [];
    if (data.AbstractText) parts.push(`Overview: ${data.AbstractText}`);
    if (data.Answer) parts.push(`Quick Answer: ${data.Answer}`);
    const topics = (data.RelatedTopics || [])
      .filter((t) => t.Text && !t.Topics)
      .slice(0, 5)
      .map((t) => `• ${t.Text}`);
    if (topics.length) parts.push(`Related Information:\n${topics.join('\n')}`);

    return parts.length ? parts.join('\n\n') : null;
  } catch {
    return null;
  }
}

// System prompt for the web-based response (uses general knowledge + any DDG context)
function buildWebSystemPrompt(webContext, student) {
  const levelNote = buildProfileNote(student);

  const webSection = webContext
    ? `\n\n=== WEB SEARCH RESULTS ===\n${webContext}\n=== END ===\n\nIncorporate the above web results where relevant in your answer.`
    : '';

  return `You are SAG AI — an expert assistant for Pakistani university admissions ONLY.${levelNote}${webSection}

CRITICAL GUIDELINES:
- SCOPE: ONLY answer about Pakistani universities, admissions, programs, fees, scholarships, deadlines, and HEC regulations.
- EXPERTISE: Use knowledge of Pakistani universities, HEC regulations, admission processes, merit criteria, programs, and fee structures.
- WEB RESULTS: If web results are provided above, incorporate relevant details from them for context only.
- VERIFICATION: Make clear that students should verify the latest figures directly with universities or via HEC.
- NO CODE: Never provide programming help, code suggestions, or technical solutions.
- FORMAT: Be concise, warm, and student-friendly. Use bullet points for lists.
- OFF-TOPIC: For completely unrelated questions (coding, jokes, sports, etc.), respond with: "Please ask questions relevant to the Admission Guide." — nothing else.`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required. Please log in to use the chatbot.' }, { status: 401 });
    }

    const userId = user.userId;

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Maximum 10 messages per hour.',
          remaining: 0,
          resetTime: rateLimitCheck.resetTime,
        },
        { status: 429 }
      );
    }

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    const userText = String(lastUserMsg?.content || '').trim();
    if (!userText) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (userText.length > 500) {
      return NextResponse.json({ error: 'Message must be at most 500 characters' }, { status: 400 });
    }

    // Block code/off-topic questions immediately
    if (isBlockedQuestion(userText)) {
      return NextResponse.json({
        dbResponse: 'Please ask questions relevant to the Admission Guide.',
        webResponse: null,
        relevant: false,
        rateLimit: {
          remaining: (await checkRateLimit(userId)).remaining,
          limit: RATE_LIMIT_MAX,
          window: '1 hour',
        },
      });
    }

    const relevant = isAdmissionRelated(userText);

    // Fetch student's saved profile so the assistant doesn't re-ask for known info
    let student = null;
    if (userId) {
      try {
        student = await queryOne(
          `SELECT academic_level, interests, matric_marks, intermediate_marks, has_entry_test, test_type, test_score
           FROM students WHERE user_id = $1`,
          [userId]
        );
      } catch { /* non-fatal */ }
    }

    const claudeMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

    // Run DB context fetch + web search in parallel
    const [dbContext, webContext] = await Promise.all([
      buildProjectContext(),
      relevant ? fetchWebContext(userText) : Promise.resolve(null),
    ]);

    const dbSystemPrompt = buildSystemPrompt(dbContext, student);
    const webSystemPrompt = buildWebSystemPrompt(webContext, student);

    // Run both Claude calls in parallel — DB-only and web/general-knowledge
    const [dbResult, webResult] = await Promise.allSettled([
      client.messages.create({
        model,
        max_tokens: 1024,
        system: dbSystemPrompt,
        messages: claudeMessages,
      }),
      relevant
        ? client.messages.create({
            model,
            max_tokens: 1024,
            system: webSystemPrompt,
            messages: claudeMessages,
          })
        : Promise.resolve(null),
    ]);

    const dbResponse =
      dbResult.status === 'fulfilled'
        ? dbResult.value?.content[0]?.text || 'Sorry, I could not process that.'
        : 'Our database is temporarily unavailable.';

    const webResponse =
      relevant && webResult.status === 'fulfilled' && webResult.value
        ? webResult.value.content[0]?.text || null
        : null;

    // Persist DB response to chat_logs
    try {
      await ensureTable();
      await query(
        `INSERT INTO chat_logs (user_id, query, response, relevant) VALUES ($1, $2, $3, $4)`,
        [userId, userText, dbResponse, relevant]
      );
    } catch (dbErr) {
      console.error('chat_logs insert error (non-fatal):', dbErr.message);
    }

    const updatedRateLimit = await checkRateLimit(userId);

    return NextResponse.json({
      dbResponse,
      webResponse,
      relevant,
      rateLimit: {
        remaining: updatedRateLimit.remaining,
        limit: RATE_LIMIT_MAX,
        window: '1 hour',
      },
    });
  } catch (err) {
    console.error('POST /api/chatbot error:', err);
    return NextResponse.json({ error: 'SAG AI is unavailable right now.' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
