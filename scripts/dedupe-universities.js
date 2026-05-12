#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set. Add it to .env.local or set the env var and retry.');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
  await client.connect();
  try {
    await client.query('BEGIN');

    // Find duplicate university names
    const dupRes = await client.query(`
      SELECT name, array_agg(id ORDER BY id) AS ids, min(id) AS keep_id
      FROM universities
      GROUP BY name
      HAVING COUNT(*) > 1
    `);

    if (dupRes.rows.length === 0) {
      console.log('No duplicate university names found.');
    } else {
      console.log('Found duplicate university groups:', dupRes.rows.length);
      for (const row of dupRes.rows) {
        const name = row.name;
        const ids = row.ids; // array
        const keepId = row.keep_id;
        const removeIds = ids.filter(id => id !== keepId);
        console.log(`Merging duplicates for '${name}': keep ${keepId}, remove ${removeIds.join(',')}`);

        // Update referencing tables to point to keepId
        await client.query(`UPDATE programs SET university_id = $1 WHERE university_id = ANY($2::int[])`, [keepId, removeIds]);
        await client.query(`UPDATE scholarships SET university_id = $1 WHERE university_id = ANY($2::int[])`, [keepId, removeIds]);
        await client.query(`UPDATE university_events SET university_id = $1 WHERE university_id = ANY($2::int[])`, [keepId, removeIds]);

        // Delete duplicate university rows
        await client.query(`DELETE FROM universities WHERE id = ANY($1::int[])`, [removeIds]);
      }

      console.log('Duplicates merged and removed.');
    }

    // Try to create unique index (if still possible)
    try {
      await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS ux_universities_name ON universities(name)`);
      console.log('Unique index ux_universities_name created (or already exists).');
    } catch (err) {
      console.warn('Failed to create unique index:', err.message || err);
    }

    await client.query('COMMIT');
    console.log('Done.');
  } catch (err) {
    console.error('Error during dedupe, rolling back:', err.message || err);
    try { await client.query('ROLLBACK'); } catch (e) {}
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();