import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminUser } from '@/lib/serverAuth';

export async function PUT(req, { params }) {
  const { response } = requireAdminUser(req);
  if (response) return response;
  const { id } = await params;
  const { is_blocked } = await req.json();

  try {
    await query(
      `UPDATE users SET is_blocked = $1 WHERE id = (SELECT user_id FROM students WHERE id = $2)`,
      [is_blocked, id]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/admin/students/[id] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { response } = requireAdminUser(req);
  if (response) return response;
  const { id } = await params;

  try {
    await query(
      `DELETE FROM users WHERE id = (SELECT user_id FROM students WHERE id = $1)`,
      [id]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/students/[id] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
