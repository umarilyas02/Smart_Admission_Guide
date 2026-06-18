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

// Make sure the columns the scraper now sends exist on already-deployed
// databases (the original universities table predates fee_structure_url).
async function ensureUniversityColumns() {
  await query(
    'ALTER TABLE universities ADD COLUMN IF NOT EXISTS fee_structure_url VARCHAR(500)'
  );
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
  if (it.location && typeof it.location !== 'string') errors.push('invalid location');
  if (it.fee_structure_url && typeof it.fee_structure_url !== 'string') {
    errors.push('invalid fee_structure_url');
  }
  // programs_offered can be empty but if present must be a string OR an array of strings
  if (
    it.programs_offered &&
    typeof it.programs_offered !== 'string' &&
    !Array.isArray(it.programs_offered)
  ) {
    errors.push('invalid programs_offered');
  }
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

// Patterns that indicate a postgraduate / non-bachelor program
const POSTGRAD_RE = /^(ms\b|m\.s\b|msc\b|m\.sc\b|ma\b|m\.a\b|mphil\b|m\.phil\b|phd\b|ph\.d\b|dphil\b|mba\b|med\b|m\.ed\b|pgd\b|pg\b|post.?grad)/i;
const POSTGRAD_WORDS_RE = /\b(master[s']?|masters|doctoral|doctorate|doctor of|mphil|m\.phil)\b/i;
const DIPLOMA_RE = /^(diploma|certificate|short course|associate degree|post.?graduate diploma)/i;

function isBachelorsOnly(name) {
  const n = name.trim();
  if (POSTGRAD_RE.test(n)) return false;
  if (POSTGRAD_WORDS_RE.test(n)) return false;
  if (DIPLOMA_RE.test(n)) return false;
  return true;
}

// Accept programs as an array (preferred) or a comma/semicolon-separated string
// (legacy). Returns a deduped list of clean Bachelor's-only program names.
function normalizePrograms(raw) {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : String(raw).split(/,|;/);
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const p = String(item).replace(/\s+/g, ' ').trim();
    if (!p || p.toLowerCase() === 'program list unavailable') continue;
    if (!isBachelorsOnly(p)) continue;
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
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
    await ensureUniversityColumns();

    if (replace) {
      await clearUniversityData();
    }

    const inserted = [];
    const skipped = [];
    let totalProgramsInserted = 0;
    let itemIndex = 0;

    for (const it of items) {
      itemIndex++;
      const validation = validateItem(it);
      if (!validation.valid) {
        const university = (it.university_name || it.name || 'Unknown').trim();
        const skipReason = `Validation errors: ${validation.errors.join(', ')}`;
        skipped.push({ university, errors: validation.errors });
        console.warn(`[${itemIndex}] ❌ SKIP: ${university} - ${skipReason}`);
        continue;
      }

      const name = (it.university_name || it.name || '').trim();
      const location = (it.location || '').trim() || null;
      const feeStructureUrl = (it.fee_structure_url || '').trim() || null;
      let universityId = await findUniversityIdByName(name);
      let action = 'created';
      let fieldChanges = null;

      if (universityId) {
        // Fetch current values so we can report exactly what changed
        const current = await queryOne(
          'SELECT description, website, location, fee_structure_url FROM universities WHERE id = $1',
          [universityId]
        );
        const incoming = {
          description: it.details || null,
          website: it.website || null,
          location,
          fee_structure_url: feeStructureUrl,
        };
        fieldChanges = {};
        for (const [field, newVal] of Object.entries(incoming)) {
          const oldVal = current ? (current[field] ?? null) : null;
          if (newVal === null) {
            fieldChanges[field] = { skipped: true, reason: 'scraper sent no value' };
          } else if (newVal === oldVal) {
            fieldChanges[field] = { changed: false, value: newVal };
          } else {
            fieldChanges[field] = { changed: true, from: oldVal, to: newVal };
          }
        }

        await query(
          `UPDATE universities
           SET description = COALESCE($2, description),
               website = COALESCE($3, website),
               location = COALESCE($4, location),
               fee_structure_url = COALESCE($5, fee_structure_url),
               updated_at = NOW()
           WHERE id = $1`,
          [universityId, it.details || null, it.website || null, location, feeStructureUrl]
        );
        action = 'updated';
      } else {
        const res = await query(
          `INSERT INTO universities(name, description, website, location, fee_structure_url, created_at)
           VALUES($1,$2,$3,$4,$5,NOW())
           RETURNING id`,
          [name, it.details || null, it.website || null, location, feeStructureUrl]
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

      const programs = normalizePrograms(it.programs_offered || it.programs);
      const programsInserted = [];
      let programsSkippedCount = 0;

      if (programs.length > 0) {
        const existingRows = await queryMany(
          'SELECT lower(name) AS name FROM programs WHERE university_id=$1',
          [universityId]
        );
        const existing = new Set(existingRows.map((r) => r.name));
        const toInsert = programs.filter((p) => !existing.has(p.toLowerCase()));
        programsSkippedCount = programs.length - toInsert.length;

        const CHUNK = 100;
        for (let i = 0; i < toInsert.length; i += CHUNK) {
          const chunk = toInsert.slice(i, i + CHUNK);
          const values = [];
          const params = [];
          chunk.forEach((p, j) => {
            values.push(`($${j * 2 + 1}, $${j * 2 + 2}, NOW())`);
            params.push(universityId, p);
          });
          await query(
            `INSERT INTO programs (university_id, name, created_at) VALUES ${values.join(', ')}`,
            params
          );
          programsInserted.push(...chunk);
        }
      }

      // Count every program now attached to this university (new + pre-existing).
      const programTotalRow = await queryOne(
        'SELECT COUNT(*)::int AS count FROM programs WHERE university_id=$1',
        [universityId]
      );
      const programsTotal = programTotalRow ? programTotalRow.count : programsInserted.length;
      totalProgramsInserted += programsInserted.length;

      const startDate = parseDate(it.start_date || it.start || '');
      const endDate = parseDate(it.end_date || it.end || '');
      console.log(
        `[${itemIndex}] ✅ SAVE: ${name} (${action}) - Events: ${startDate} to ${endDate}, ` +
        `Programs: +${programsInserted.length} added / ${programsSkippedCount} unchanged / ${programsTotal} total`
      );

      inserted.push({
        universityId,
        name,
        action,
        field_changes: fieldChanges,
        programs_inserted: programsInserted.length,
        programs_inserted_names: programsInserted,
        programs_skipped: programsSkippedCount,
        programs_total: programsTotal,
      });
    }

    console.log(
      `\n📊 Summary: ${inserted.length} saved, ${skipped.length} skipped out of ${items.length} total ` +
      `(${totalProgramsInserted} new programs)`
    );

    return NextResponse.json({
      inserted_count: inserted.length,
      inserted,
      skipped_count: skipped.length,
      skipped,
      summary: {
        total: items.length,
        saved: inserted.length,
        skipped: skipped.length,
        programs_inserted: totalProgramsInserted,
      }
    }, { status: 201 });
  } catch (err) {
    console.error('POST /api/universities error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const universities = await queryMany(
      `SELECT u.id, u.name, u.location, u.website, u.fee_structure_url, u.description, u.created_at
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
      `SELECT id, university_id, name, fee, duration, eligibility
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
