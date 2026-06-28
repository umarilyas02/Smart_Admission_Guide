import { NextResponse } from 'next/server';
import { query, queryMany } from '@/lib/db';
import { requireAdminUser } from '@/lib/serverAuth';

export async function GET(req) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const tests = await queryMany(
      `SELECT id, name, type, subjects, duration, total_marks, description FROM entry_tests ORDER BY id`,
      []
    );
    return NextResponse.json({ tests });
  } catch (err) {
    console.error('GET /api/admin/entry-tests error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const body = await req.json();
    const { name, type, subjects, duration, total_marks, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Test name is required' }, { status: 400 });
    }

    const subjectsArr = Array.isArray(subjects)
      ? subjects.map((s) => s.trim()).filter(Boolean)
      : String(subjects || '').split(',').map((s) => s.trim()).filter(Boolean);

    const res = await query(
      `INSERT INTO entry_tests (name, type, subjects, duration, total_marks, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, type, subjects, duration, total_marks, description`,
      [
        name.trim(),
        type?.trim() || null,
        subjectsArr,
        duration?.trim() || null,
        total_marks ? parseInt(total_marks) : null,
        description?.trim() || null,
      ]
    );

    return NextResponse.json({ test: res.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/entry-tests error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
