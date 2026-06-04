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
    const programs = await queryMany(
      `SELECT p.id, p.name, u.name AS university, p.field, p.merit_percentage
       FROM programs p
       JOIN universities u ON p.university_id = u.id
       ORDER BY u.name, p.name`,
      []
    );
    return NextResponse.json({ programs });
  } catch (err) {
    console.error('GET /api/admin/programs error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
