import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { query, queryMany, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// Rate limiting: Max 10 conversations per user per hour
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function checkRateLimit(userId) {
  if (!userId) return { allowed: true }; // Anonymous users bypass for now

  try {
    // Get count of messages from this user in the last hour
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

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - messageCount,
    };
  } catch (err) {
    console.error('Rate limit check failed:', err.message);
    // Allow request if check fails (fail-open)
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

// Fetch all project data from DB to build the context block
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

function buildSystemPrompt(dbContext, academicLevel) {
  const base = `You are SAG AI — the intelligent assistant for Smart Admission Guide (SAG), a platform helping Pakistani students with university admissions.`;

  const levelNote = academicLevel && ELIGIBLE_PROGRAMS[academicLevel]
    ? `\n\nSTUDENT CONTEXT: This student completed ${academicLevel.toUpperCase().replace(/_/g, " ")}. When suggesting programs or departments, ONLY recommend programs they are eligible for: ${ELIGIBLE_PROGRAMS[academicLevel]}. Do NOT suggest programs outside this list.`
    : "";

  if (!dbContext) {
    return `${base}${levelNote}

No university data is available in the database yet. Politely inform the user that admission data is still being loaded into the system and ask them to check back soon. Do not answer from general knowledge.`;
  }

  return `${base}${levelNote}

YOUR KNOWLEDGE IS STRICTLY LIMITED TO THE DATA BELOW. Do not use any outside knowledge.

${dbContext}

=== RULES ===
- Answer ONLY using the university, program, event, and scholarship data provided above.
- If the user asks about a university or program NOT listed above, say it is not in our database yet.
- If specific data (merit %, fee, deadline) is missing from the data, say it's not available in our system right now.
- Do not guess, fabricate, or supplement with general knowledge.
- Be concise, warm, and student-friendly. Use bullet points for lists.
- If the question is unrelated to admissions (coding, jokes, general trivia, anything outside university/admission guidance), respond with exactly: "Please ask questions relevant to the Admission Guide." — nothing more.`;
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

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    // Resolve optional user identity from bearer token
    let userId = null;
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (token) {
      const decoded = verifyToken(token);
      if (decoded?.userId) userId = decoded.userId;
    }

    // Check rate limit: Max 10 conversations per user per hour
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
    const userText = lastUserMsg?.content || '';
    const relevant = isAdmissionRelated(userText);

    // Fetch student's academic level for level-aware recommendations
    let academicLevel = null;
    if (userId) {
      try {
        const studentRow = await queryOne(
          `SELECT academic_level FROM students WHERE user_id = $1`,
          [userId]
        );
        academicLevel = studentRow?.academic_level || null;
      } catch { /* non-fatal */ }
    }

    // Build DB context and system prompt
    const dbContext = await buildProjectContext();
    const systemPrompt = buildSystemPrompt(dbContext, academicLevel);

    const claudeMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const assistantText = response.content[0]?.text || 'Sorry, I could not process that.';

    // Persist to chat_logs
    try {
      await ensureTable();
      await query(
        `INSERT INTO chat_logs (user_id, query, response, relevant) VALUES ($1, $2, $3, $4)`,
        [userId, userText, assistantText, relevant]
      );
    } catch (dbErr) {
      console.error('chat_logs insert error (non-fatal):', dbErr.message);
    }

    // Get updated rate limit info
    const updatedRateLimit = await checkRateLimit(userId);

    return NextResponse.json({
      message: assistantText,
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
