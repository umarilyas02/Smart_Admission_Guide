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
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function ensureUniversitiesUniqueIndex() {
  try {
    // Create a unique index on name if it doesn't exist. If duplicates exist this will fail.
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS ux_universities_name ON universities(name)`);
  } catch (err) {
    // If creating the unique index fails (e.g., due to duplicates), log and continue.
    console.warn('Could not create unique index on universities.name:', err.message || err);
  }
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d)) return null;
  return d.toISOString().split('T')[0];
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

export async function POST(req) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : body.data || [];

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No university data provided' }, { status: 400 });
    }

    await ensureEventsTable();
    await ensureUniversitiesUniqueIndex();

    const inserted = [];

    for (const it of items) {
      const validation = validateItem(it);
      if (!validation.valid) {
        console.warn('Skipping item due to validation errors', validation.errors, it);
        continue;
      }

      const name = (it.university_name || it.name || '').trim();

      // Upsert university by name (requires unique constraint on universities.name)
      const upsertSql = `INSERT INTO universities(name, description, website, created_at)
        VALUES($1,$2,$3,NOW())
        ON CONFLICT (name) DO UPDATE SET
          description = COALESCE(EXCLUDED.description, universities.description),
          website = COALESCE(EXCLUDED.website, universities.website),
          updated_at = NOW()
        RETURNING id`;

      const res = await query(upsertSql, [name, it.details || null, it.website || null]);
      const universityId = res.rows[0].id;

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
        // Optionally update status/details if changed
        await query(
          `UPDATE university_events SET status = COALESCE($1, status), details = COALESCE($2, details) WHERE id = $3`,
          [it.status || null, it.details || null, existingEvent.id]
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

    const results = [];
    for (const u of universities) {
      const events = await queryMany(
        `SELECT id, event_type, start_date, end_date, status, details, created_at
         FROM university_events WHERE university_id=$1 ORDER BY start_date NULLS LAST`,
        [u.id]
      );

      const programs = await queryMany('SELECT id, name FROM programs WHERE university_id=$1 ORDER BY name', [u.id]);

      results.push({ ...u, events, programs });
    }

    return NextResponse.json({ universities: results });
  } catch (err) {
    console.error('GET /api/universities error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
