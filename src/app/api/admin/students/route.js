import { NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { requireAdminUser } from '@/lib/serverAuth';

export async function GET(req) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const students = await queryMany(
      `SELECT s.id, u.name, u.email, u.is_blocked,
              s.academic_level, s.phone, s.matric_marks, s.intermediate_marks,
              s.test_score, s.test_type, s.interests, s.created_at
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
export const dynamic = 'force-dynamic';
