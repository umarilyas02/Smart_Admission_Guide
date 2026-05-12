#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set. Add it to .env.local or set the env var and retry.');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
  try {
    await client.connect();
    const schemaPath = path.resolve(__dirname, '..', 'src', 'lib', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('schema.sql not found at', schemaPath);
      process.exit(1);
    }
    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Applying schema from', schemaPath);
    await client.query(sql);
    console.log('Schema applied successfully');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error applying schema:', err.message || err);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
})();
