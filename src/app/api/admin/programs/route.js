import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryMany } from '@/lib/db';

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
      `SELECT p.id, p.name, p.field, p.duration, p.fee, p.merit_percentage,
              p.description, p.eligibility, p.university_id,
              u.name AS university
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

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const { university_id, name, field, duration, fee, merit_percentage, description, eligibility } = body;

    if (!university_id || !name?.trim()) {
      return NextResponse.json({ error: 'University and program name are required' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO programs (university_id, name, field, duration, fee, merit_percentage, description, eligibility, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, university_id, name, field, duration, fee, merit_percentage, description, eligibility`,
      [
        parseInt(university_id),
        name.trim(),
        field?.trim() || null,
        duration?.trim() || null,
        fee ? parseFloat(fee) : null,
        merit_percentage ? parseFloat(merit_percentage) : null,
        description?.trim() || null,
        eligibility?.trim() || null,
      ]
    );

    return NextResponse.json({ program: res.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/programs error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
