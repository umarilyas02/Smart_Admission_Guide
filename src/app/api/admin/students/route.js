import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryMany } from '@/lib/db';

const ADMIN_EMAIL = 'smartadmissionguide@gmail.com';

function isAdmin(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
  const decoded = verifyToken(token);
  return decoded?.email === ADMIN_EMAIL;
}

export async function GET(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const students = await queryMany(
      `SELECT s.id, u.name, u.email, s.academic_level, s.created_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       ORDER BY s.id`,
      []
    );
    return NextResponse.json({ students });
  } catch (err) {
    console.error('GET /api/admin/students error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
