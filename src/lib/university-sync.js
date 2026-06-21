import { query, queryOne, queryMany } from '@/lib/db';
import { resolveUniversityDescription, isRawUniversityDescription } from '@/lib/university-descriptions';

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

async function ensureUniversityColumns() {
  await query(
    'ALTER TABLE universities ADD COLUMN IF NOT EXISTS fee_structure_url VARCHAR(500)'
  );
}

function parseDate(str) {
  if (!str) return null;
  const value = String(str).trim();
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

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
  if (
    it.programs_offered &&
    typeof it.programs_offered !== 'string' &&
    !Array.isArray(it.programs_offered)
  ) {
    errors.push('invalid programs_offered');
  }
  const s = it.start_date || it.start || '';
  const e = it.end_date || it.end || '';
  if (s && !parseDate(s)) errors.push('invalid start_date');
  if (e && !parseDate(e)) errors.push('invalid end_date');
  return { valid: errors.length === 0, errors };
}

async function clearUniversityData() {
  await query('DELETE FROM universities');
}

async function findUniversityIdByName(name) {
  const existing = await queryOne(
    'SELECT id FROM universities WHERE lower(name) = lower($1) ORDER BY id ASC LIMIT 1',
    [name]
  );
  return existing ? existing.id : null;
}

const POSTGRAD_RE = /^(ms\b|m\.s\b|msc\b|m\.sc\b|ma\b|m\.a\b|mphil\b|m\.phil\b|phd\b|ph\.d\b|dphil\b|mba\b|med\b|m\.ed\b|pgd\b|pg\b|post.?grad)/i;
const POSTGRAD_WORDS_RE = /\b(master[s']?|masters|doctoral|doctorate|doctor of|mphil|m\.phil)\b/i;
const DIPLOMA_RE = /^(diploma|certificate|short course|associate degree|post.?graduate diploma)/i;
const PROGRAM_NOISE_RE = /\b(degree program name|program name|fee structure|per credit hour fee|one time fee|admission fee|registration fee|tuition fee|search programs|all programs|campus location|latest news|students admissions|knowledge unit|sub department under)\b/i;
const TRAILING_NOISE_RE = /\b(faculty of|department of|institute of|school of|college of|centre for|sub department under|undergraduate|postgraduate|graduate|fee structure|per credit hour fee|one time fee|admission fee|registration fee|tuition fee|semester \d+|search programs|all programs|knowledge unit|years?|programmes?|programs?)\b/i;

function sanitizeProgramName(name) {
  const compact = String(name).replace(/\s+/g, ' ').trim();
  if (!compact) return '';
  return compact
    .split(TRAILING_NOISE_RE)[0]
    .replace(/\(\s*\d+(?:\.\d+)?\s*(?:Years?|Yrs?)\s*\)/gi, '')
    .replace(/\b(?:Post|Post-)\b.*$/i, '')
    .replace(/\b\d+(?:\.\d+)?\s*(?:Years?|Yrs?)\b.*$/i, '')
    .replace(/\s+[A-Z]$/g, '')
    .replace(/[()]/g, '')
    .trim()
    .replace(/[,:;|/-]+$/g, '')
    .trim();
}

function isBachelorsOnly(name) {
  const n = sanitizeProgramName(name);
  if (!n) return false;
  if (POSTGRAD_RE.test(n)) return false;
  if (POSTGRAD_WORDS_RE.test(n)) return false;
  if (DIPLOMA_RE.test(n)) return false;
  if (PROGRAM_NOISE_RE.test(n)) return false;
  if (/^(bs|ba|adp|b\.sc\.?|b\.ed\.?)\s+\d/i.test(n)) return false;
  if (/^(bs|ba|adp|b\.sc\.?|b\.ed\.?|bachelor)$/i.test(n)) return false;
  if (/\d\.?$/.test(n)) return false;
  if (/[(/&:-]$/.test(n)) return false;
  return true;
}

function normalizePrograms(raw) {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : String(raw).split(/,|;/);
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const p = sanitizeProgramName(item);
    if (!p || p.toLowerCase() === 'program list unavailable') continue;
    if (!isBachelorsOnly(p)) continue;
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

async function cleanupExistingPrograms(universityId) {
  const rows = await queryMany(
    'SELECT id, name FROM programs WHERE university_id = $1 ORDER BY id ASC',
    [universityId]
  );

  const deletedNames = [];
  const renamed = [];

  for (const row of rows) {
    const cleaned = sanitizeProgramName(row.name);
    if (!cleaned || !isBachelorsOnly(cleaned)) {
      await query('DELETE FROM programs WHERE id = $1', [row.id]);
      deletedNames.push(row.name);
      continue;
    }

    if (cleaned !== row.name) {
      await query('UPDATE programs SET name = $1 WHERE id = $2', [cleaned, row.id]);
      renamed.push({ from: row.name, to: cleaned });
    }
  }

  const dedupe = await query(
    `DELETE FROM programs p
     USING programs dup
     WHERE p.university_id = dup.university_id
       AND lower(p.name) = lower(dup.name)
       AND p.id > dup.id
       AND p.university_id = $1`,
    [universityId]
  );

  return {
    deleted_count: deletedNames.length,
    deleted_names: deletedNames,
    renamed_count: renamed.length,
    renamed,
    duplicates_removed: dedupe.rowCount ?? 0,
  };
}

export async function syncUniversityData(items, { replace = false } = {}) {
  if (!items || items.length === 0) {
    return {
      inserted_count: 0,
      inserted: [],
      skipped_count: 0,
      skipped: [],
      summary: {
        total: 0,
        saved: 0,
        skipped: 0,
        universities_created: 0,
        universities_updated: 0,
        descriptions_generated: 0,
        events_created: 0,
        events_updated: 0,
        programs_inserted: 0,
        programs_skipped: 0,
        programs_deleted: 0,
        programs_renamed: 0,
        program_duplicates_removed: 0,
      },
      logs: [],
    };
  }

  await ensureEventsTable();
  await ensureUniversityColumns();
  if (replace) await clearUniversityData();

  const inserted = [];
  const skipped = [];
  const logs = [];
  let universitiesCreated = 0;
  let universitiesUpdated = 0;
  let descriptionsGenerated = 0;
  let eventsCreated = 0;
  let eventsUpdated = 0;
  let totalProgramsInserted = 0;
  let totalProgramsSkipped = 0;
  let totalProgramsDeleted = 0;
  let totalProgramsRenamed = 0;
  let totalProgramDuplicatesRemoved = 0;
  let itemIndex = 0;

  for (const it of items) {
    itemIndex++;
    const validation = validateItem(it);
    if (!validation.valid) {
      const university = (it.university_name || it.name || 'Unknown').trim();
      skipped.push({ university, errors: validation.errors });
      logs.push(`[${itemIndex}] Skipped ${university}: ${validation.errors.join(', ')}`);
      console.warn(`[${itemIndex}] SKIP ${university}: ${validation.errors.join(', ')}`);
      continue;
    }

    const name = (it.university_name || it.name || '').trim();
    const location = (it.location || '').trim() || null;
    const feeStructureUrl = (it.fee_structure_url || '').trim() || null;
    const incomingPrograms = normalizePrograms(it.programs_offered || it.programs);
    let universityId = await findUniversityIdByName(name);
    let action = 'created';
    let fieldChanges = null;
    let description = '';

    if (universityId) {
      const current = await queryOne(
        'SELECT description, website, location, fee_structure_url FROM universities WHERE id = $1',
        [universityId]
      );
      description = await resolveUniversityDescription({
        name,
        location: location || current?.location || '',
        programs: incomingPrograms,
        details: it.details || '',
        currentDescription: current?.description || '',
      });
      const incoming = {
        description,
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
        [universityId, description || null, it.website || null, location, feeStructureUrl]
      );
      if (description && isRawUniversityDescription(current?.description || '')) {
        descriptionsGenerated++;
      }
      action = 'updated';
      universitiesUpdated++;
    } else {
      description = await resolveUniversityDescription({
        name,
        location,
        programs: incomingPrograms,
        details: it.details || '',
        currentDescription: '',
      });
      const res = await query(
        `INSERT INTO universities(name, description, website, location, fee_structure_url, created_at)
         VALUES($1,$2,$3,$4,$5,NOW())
         RETURNING id`,
        [name, description || null, it.website || null, location, feeStructureUrl]
      );
      universityId = res.rows[0].id;
      if (description) descriptionsGenerated++;
      universitiesCreated++;
    }

    const cleanup = await cleanupExistingPrograms(universityId);
    totalProgramsDeleted += cleanup.deleted_count;
    totalProgramsRenamed += cleanup.renamed_count;
    totalProgramDuplicatesRemoved += cleanup.duplicates_removed;

    const start = parseDate(it.start_date || it.start || '');
    const end = parseDate(it.end_date || it.end || '');
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
      eventsCreated++;
    } else {
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
      eventsUpdated++;
    }

    const programs = incomingPrograms;
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

    const programTotalRow = await queryOne(
      'SELECT COUNT(*)::int AS count FROM programs WHERE university_id=$1',
      [universityId]
    );
    const programsTotal = programTotalRow ? programTotalRow.count : programsInserted.length;
    totalProgramsInserted += programsInserted.length;
    totalProgramsSkipped += programsSkippedCount;

    const summaryLine =
      `[${itemIndex}] ${name}: ${action} university, ` +
      `${existingEvent ? 'updated' : 'created'} event, ` +
      `${description ? 'description ready, ' : ''}` +
      `+${programsInserted.length} added, ${programsSkippedCount} unchanged, ` +
      `${cleanup.renamed_count} renamed, ${cleanup.deleted_count} removed, ` +
      `${cleanup.duplicates_removed} deduped`;
    logs.push(summaryLine);

    inserted.push({
      universityId,
      name,
      action,
      field_changes: fieldChanges,
      description_generated: Boolean(description),
      event_action: existingEvent ? 'updated' : 'created',
      programs_inserted: programsInserted.length,
      programs_inserted_names: programsInserted,
      programs_skipped: programsSkippedCount,
      programs_total: programsTotal,
      programs_deleted: cleanup.deleted_count,
      programs_deleted_names: cleanup.deleted_names,
      programs_renamed: cleanup.renamed_count,
      program_renames: cleanup.renamed,
      program_duplicates_removed: cleanup.duplicates_removed,
    });
  }

  return {
    inserted_count: inserted.length,
    inserted,
    skipped_count: skipped.length,
    skipped,
    logs,
      summary: {
      total: items.length,
      saved: inserted.length,
      skipped: skipped.length,
      universities_created: universitiesCreated,
      universities_updated: universitiesUpdated,
      descriptions_generated: descriptionsGenerated,
      events_created: eventsCreated,
      events_updated: eventsUpdated,
      programs_inserted: totalProgramsInserted,
      programs_skipped: totalProgramsSkipped,
      programs_deleted: totalProgramsDeleted,
      programs_renamed: totalProgramsRenamed,
      program_duplicates_removed: totalProgramDuplicatesRemoved,
    },
  };
}
