import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireAdminUser } from '@/lib/serverAuth';

export async function PATCH(req, { params }) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, type, subjects, duration, total_marks, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Test name cannot be empty' }, { status: 400 });
    }

    const subjectsArr = Array.isArray(subjects)
      ? subjects.map((s) => s.trim()).filter(Boolean)
      : String(subjects || '').split(',').map((s) => s.trim()).filter(Boolean);

    const updated = await queryOne(
      `UPDATE entry_tests
       SET name        = $1,
           type        = $2,
           subjects    = $3,
           duration    = $4,
           total_marks = $5,
           description = $6
       WHERE id = $7
       RETURNING id, name, type, subjects, duration, total_marks, description`,
      [
        name.trim(),
        type?.trim() || null,
        subjectsArr,
        duration?.trim() || null,
        total_marks ? parseInt(total_marks) : null,
        description?.trim() || null,
        id,
      ]
    );

    if (!updated) return NextResponse.json({ error: 'Entry test not found' }, { status: 404 });
    return NextResponse.json({ test: updated });
  } catch (err) {
    console.error('PATCH /api/admin/entry-tests/[id] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const { id } = await params;
    await query('DELETE FROM entry_tests WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/entry-tests/[id] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
