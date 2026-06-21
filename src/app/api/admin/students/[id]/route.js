import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

const ADMIN_EMAIL = 'smartadmissionguide@gmail.com';

function isAdmin(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
  const decoded = verifyToken(token);
  return decoded?.email === ADMIN_EMAIL;
}

export async function PUT(req, { params }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
