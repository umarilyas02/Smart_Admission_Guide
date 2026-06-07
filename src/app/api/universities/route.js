import { NextResponse } from 'next/server';
import { query, queryOne, queryMany } from '@/lib/db';

async function ensureEventsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS university_events (
      id SERIAL PRIMARY KEY,
      university_id INT NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
      event_type VARCHAR(255),
      start_date DATE,
      end_date DATE,
      status VARCHAR(100),
      details TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

function parseDate(str) {
  if (!str) return null;
  const value = String(str).trim();

  // Keep date-only values stable by avoiding timezone conversion.
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validateItem(it) {
  const errors = [];
  const name = (it.university_name || it.name || '').trim();
  if (!name) errors.push('missing university name');
  if (it.event_type && typeof it.event_type !== 'string') errors.push('invalid event_type');
  if (it.status && typeof it.status !== 'string') errors.push('invalid status');
  // programs_offered can be empty but if present must be a string
  if (it.programs_offered && typeof it.programs_offered !== 'string') errors.push('invalid programs_offered');
  // validate dates
  const s = it.start_date || it.start || '';
  const e = it.end_date || it.end || '';
  if (s && !parseDate(s)) errors.push('invalid start_date');
  if (e && !parseDate(e)) errors.push('invalid end_date');
  return { valid: errors.length === 0, errors };
}

async function clearUniversityData() {
  // Removing universities cascades to programs, scholarships, events, admissions, etc.
  await query('DELETE FROM universities');
}

async function findUniversityIdByName(name) {
  const existing = await queryOne(
    'SELECT id FROM universities WHERE lower(name) = lower($1) ORDER BY id ASC LIMIT 1',
    [name]
  );
  return existing ? existing.id : null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : body.data || [];
    const replace = Boolean(body?.replace);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No university data provided' }, { status: 400 });
    }

    await ensureEventsTable();

    if (replace) {
      await clearUniversityData();
    }

    const inserted = [];

    for (const it of items) {
      const validation = validateItem(it);
      if (!validation.valid) {
        console.warn('Skipping item due to validation errors', validation.errors, it);
        continue;
      }

      const name = (it.university_name || it.name || '').trim();
      let universityId = await findUniversityIdByName(name);

      if (universityId) {
        await query(
          `UPDATE universities
           SET description = COALESCE($2, description),
               website = COALESCE($3, website),
               updated_at = NOW()
           WHERE id = $1`,
          [universityId, it.details || null, it.website || null]
        );
      } else {
        const res = await query(
          `INSERT INTO universities(name, description, website, created_at)
           VALUES($1,$2,$3,NOW())
           RETURNING id`,
          [name, it.details || null, it.website || null]
        );
        universityId = res.rows[0].id;
      }

      const start = parseDate(it.start_date || it.start || '');
      const end = parseDate(it.end_date || it.end || '');

      // Deduplicate events: don't insert identical event_type + dates
      const existingEvent = await queryOne(
        `SELECT id FROM university_events WHERE university_id=$1 AND event_type=$2 AND COALESCE(start_date::text,'')=$3 AND COALESCE(end_date::text,'')=$4 LIMIT 1`,
        [universityId, it.event_type || 'admission', start || '', end || '']
      );

      if (!existingEvent) {
        await query(
          `INSERT INTO university_events (university_id, event_type, start_date, end_date, status, details)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [universityId, it.event_type || 'admission', start, end, it.status || null, it.details || null]
        );
      } else {
        // Refresh the existing event so the latest scrape time is visible in the table.
        await query(
          `UPDATE university_events
           SET status = COALESCE($1, status),
               details = COALESCE($2, details),
               start_date = COALESCE($3, start_date),
               end_date = COALESCE($4, end_date),
               updated_at = NOW()
           WHERE id = $5`,
          [it.status || null, it.details || null, start, end, existingEvent.id]
        );
      }

      const programsRaw = it.programs_offered || it.programs || '';
      if (programsRaw) {
        const programs = programsRaw.split(/,|;/).map(p => p.trim()).filter(Boolean);
        // dedupe program names by normalizing
        const seen = new Set();
        for (const raw of programs) {
          const p = raw.replace(/\s+/g, ' ').trim();
          const key = p.toLowerCase();
          if (!p || seen.has(key)) continue;
          seen.add(key);
          const exists = await queryOne('SELECT id FROM programs WHERE university_id=$1 AND lower(name)=lower($2)', [universityId, p]);
          if (!exists) {
            await query('INSERT INTO programs (university_id, name, created_at) VALUES ($1,$2,NOW())', [universityId, p]);
          }
        }
      }

      inserted.push({ universityId, name });
    }

    return NextResponse.json({ inserted_count: inserted.length, inserted }, { status: 201 });
  } catch (err) {
    console.error('POST /api/universities error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const universities = await queryMany(
      `SELECT u.id, u.name, u.location, u.website, u.description, u.created_at
       FROM universities u
       ORDER BY u.name`,
      []
    );

    if (universities.length === 0) {
      return NextResponse.json({ universities: [] });
    }

    const ids = universities.map((u) => u.id);

    // Fetch events and programs for every university in two bulk queries
    // instead of two queries per university (avoids an N+1 round-trip storm
    // that is slow and failure-prone across regions).
    const events = await queryMany(
      `SELECT id, university_id, event_type, start_date, end_date, status, details, created_at, updated_at
       FROM university_events
       WHERE university_id = ANY($1)
       ORDER BY start_date NULLS LAST`,
      [ids]
    );

    const programs = await queryMany(
      `SELECT id, university_id, name
       FROM programs
       WHERE university_id = ANY($1)
       ORDER BY name`,
      [ids]
    );

    const eventsByUni = new Map();
    for (const e of events) {
      if (!eventsByUni.has(e.university_id)) eventsByUni.set(e.university_id, []);
      eventsByUni.get(e.university_id).push(e);
    }

    const programsByUni = new Map();
    for (const p of programs) {
      if (!programsByUni.has(p.university_id)) programsByUni.set(p.university_id, []);
      programsByUni.get(p.university_id).push(p);
    }

    const results = universities.map((u) => ({
      ...u,
      events: eventsByUni.get(u.id) || [],
      programs: programsByUni.get(u.id) || [],
    }));

    return NextResponse.json({ universities: results });
  } catch (err) {
    console.error('GET /api/universities error', err);
    return NextResponse.json(
      { error: 'Server error', detail: err.message, code: err.code },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
