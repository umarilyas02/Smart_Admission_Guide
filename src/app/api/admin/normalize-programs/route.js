import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { verifyToken } from '@/lib/auth';
import { query, queryMany } from '@/lib/db';

const ADMIN_EMAIL = 'smartadmissionguide@gmail.com';

function isAdmin(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
  const decoded = verifyToken(token);
  return decoded?.email === ADMIN_EMAIL;
}

const claude = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

async function normalizeWithClaude(names) {
  const response = await claude.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are a Pakistani university program name normalizer. Given a list of scraped program names, return a JSON object mapping each input name to either:
- A normalized canonical Bachelor's degree name (string)
- null — if it is a Master's, MS, MPhil, PhD, MBA, Diploma, Certificate, PGD, or any non-Bachelor program

NORMALIZATION RULES:
1. Only keep 4-year Bachelor's degrees (BS, BE, BA, BBA, BCS, MBBS, LLB, PharmD, BEd, BFA, BArch, BEng)
2. Canonical format: use "BS <Field>" for most science/tech programs
3. Treat these as the same program (map all to the canonical form):
   - "BSCS", "BS(CS)", "BSc CS", "B.S Computer Science", "Bachelor of Computer Science", "Computer Science", "CS" → "BS Computer Science"
   - "BSSE", "BS Software Engg", "Software Engineering" → "BS Software Engineering"
   - "BSEE", "BS Electrical", "Electrical Engineering", "EE" → "BS Electrical Engineering"
   - "BSME", "BS Mechanical", "Mechanical Engineering" → "BS Mechanical Engineering"
   - "BSCE", "BS Civil", "Civil Engineering" → "BS Civil Engineering"
   - "BBA", "B.B.A", "Bachelor of Business Administration" → "BBA"
   - "MBA", "M.B.A" → null
   - "MS Computer Science", "MSc CS", "M.S CS" → null
   - "MPhil", "M.Phil", "PhD", "Ph.D" → null
   - "Diploma", "Certificate", "PGD" → null
4. If the program is ambiguous with no degree prefix (e.g. just "Physics"), treat it as BS (e.g. "BS Physics")
5. Return ONLY valid JSON. No markdown fences, no explanation.

Input programs:
${names.map((n) => `"${n}"`).join('\n')}

Required output (JSON object):`,
      },
    ],
  });

  const raw = response.content[0].text.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude returned unparseable response');
  return JSON.parse(match[0]);
}

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    // Fetch all distinct program names currently in the DB
    const rows = await queryMany('SELECT DISTINCT name FROM programs ORDER BY name', []);
    const allNames = rows.map((r) => r.name);

    if (allNames.length === 0) {
      return NextResponse.json({ success: true, message: 'No programs in database', deleted: 0, renamed: 0 });
    }

    // Call Claude in batches of 80 names
    const BATCH = 80;
    const mapping = {};
    for (let i = 0; i < allNames.length; i += BATCH) {
      const batch = allNames.slice(i, i + BATCH);
      const result = await normalizeWithClaude(batch);
      Object.assign(mapping, result);
    }

    // Split mapping into deletions and renames
    const toDelete = [];
    const toRename = []; // [oldName, newName]

    for (const [oldName, newName] of Object.entries(mapping)) {
      if (newName === null || newName === undefined) {
        toDelete.push(oldName);
      } else if (newName.trim() !== oldName.trim()) {
        toRename.push([oldName, newName.trim()]);
      }
    }

    let deleted = 0;
    let renamed = 0;

    // Delete Masters/non-bachelor programs
    if (toDelete.length > 0) {
      const res = await query('DELETE FROM programs WHERE name = ANY($1)', [toDelete]);
      deleted = res.rowCount ?? 0;
    }

    // Rename aliases to canonical names
    for (const [oldName, newName] of toRename) {
      const res = await query('UPDATE programs SET name = $1 WHERE name = $2', [newName, oldName]);
      renamed += res.rowCount ?? 0;
    }

    // Remove duplicates created by renaming (same university_id + name, keep lowest id)
    await query(
      `DELETE FROM programs p
       USING programs dup
       WHERE p.university_id = dup.university_id
         AND p.name = dup.name
         AND p.id > dup.id`,
      []
    );

    return NextResponse.json({
      success: true,
      total_processed: allNames.length,
      deleted,
      renamed,
    });
  } catch (err) {
    console.error('POST /api/admin/normalize-programs error', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
