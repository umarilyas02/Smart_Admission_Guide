import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  const migrations = [
    `ALTER TABLE universities ADD COLUMN IF NOT EXISTS fee_structure_url VARCHAR(500)`,
    `ALTER TABLE students ADD COLUMN IF NOT EXISTS test_type VARCHAR(50)`,
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
