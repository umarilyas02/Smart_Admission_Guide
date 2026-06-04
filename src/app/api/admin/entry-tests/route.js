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
    const tests = await queryMany(
      `SELECT id, name, type, subjects, duration FROM entry_tests ORDER BY id`,
      []
    );
    return NextResponse.json({ tests });
  } catch (err) {
    console.error('GET /api/admin/entry-tests error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
