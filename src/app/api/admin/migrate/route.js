import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  const migrations = [
    `ALTER TABLE universities ADD COLUMN IF NOT EXISTS fee_structure_url VARCHAR(500)`,
    `ALTER TABLE students ADD COLUMN IF NOT EXISTS test_type VARCHAR(50)`,
    `ALTER TABLE students ADD COLUMN IF NOT EXISTS matric_type VARCHAR(50)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE`,
    `CREATE TABLE IF NOT EXISTS user_university_favorites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, university_id)
    )`,
    `CREATE TABLE IF NOT EXISTS favorite_reminder_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
      event_id INTEGER NOT NULL REFERENCES university_events(id) ON DELETE CASCADE,
      sent_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_fav_user ON user_university_favorites(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_reminder_log_lookup ON favorite_reminder_log(user_id, event_id)`,
  ];

  const results = [];
  for (const sql of migrations) {
    try {
      await query(sql, []);
      results.push({ sql, status: 'ok' });
    } catch (err) {
      results.push({ sql, status: 'error', message: err.message });
    }
  }

  return NextResponse.json({ results });
}

export const runtime = 'nodejs';
