import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';

function getUserId(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export async function GET(req) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await queryOne('SELECT id, name, email FROM users WHERE id=$1', [userId]);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const student = await queryOne('SELECT * FROM students WHERE user_id=$1', [userId]);

  return NextResponse.json({ user, student: student || null });
}

export async function PUT(req) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, phone, academic_level, matric_marks, intermediate_marks, test_type, test_score, interests } = body;

  if (name?.trim()) {
    await query('UPDATE users SET name=$1, updated_at=NOW() WHERE id=$2', [name.trim(), userId]);
  }

  await query(
    `INSERT INTO students (user_id, phone, academic_level, matric_marks, intermediate_marks, test_type, test_score, interests, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       phone = $2,
       academic_level = $3,
       matric_marks = $4,
       intermediate_marks = $5,
       test_type = $6,
       test_score = $7,
       interests = $8,
       updated_at = NOW()`,
    [
      userId,
      phone || null,
      academic_level || null,
      matric_marks ? parseFloat(matric_marks) : null,
      intermediate_marks ? parseFloat(intermediate_marks) : null,
      test_type || null,
      test_score ? parseFloat(test_score) : null,
      interests || null,
    ]
  );

  return NextResponse.json({ message: 'Profile updated successfully' });
}

export const runtime = 'nodejs';
