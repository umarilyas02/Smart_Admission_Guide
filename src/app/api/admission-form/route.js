import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne, queryMany } from '@/lib/db';

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

  try {
    const user = await queryOne('SELECT id, name, email FROM users WHERE id=$1', [userId]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const student = await queryOne('SELECT * FROM students WHERE user_id=$1', [userId]);

    const baseProfile = student
      ? { ...student, name: user.name, email: user.email }
      : { name: user.name, email: user.email, phone: null, academic_level: null, matric_marks: null, application_form: null };

    // Which documents has this student already generated?
    let generatedDocuments = [];
    if (student) {
      const docs = await queryMany(
        `SELECT DISTINCT type FROM documents WHERE student_id = $1
         AND type IN ('motivation-letter', 'recommendation-request', 'admission-form')`,
        [student.id]
      );
      generatedDocuments = docs.map((d) => d.type);
    }

    return NextResponse.json({
      student: baseProfile,
      savedForm: baseProfile.application_form || null,
      generatedDocuments,
    });
  } catch (error) {
    console.error('GET /api/admission-form error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(req) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.json();
    const { fullName, phone, academicLevel, gpaOrMarks } = formData;

    if (fullName?.trim()) {
      await query('UPDATE users SET name=$1, updated_at=NOW() WHERE id=$2', [fullName.trim(), userId]);
    }

    // Upsert student row — saves profile fields AND full form JSON
    await query(
      `INSERT INTO students (user_id, phone, academic_level, matric_marks, application_form, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         phone            = COALESCE($2, students.phone),
         academic_level   = COALESCE($3, students.academic_level),
         matric_marks     = COALESCE($4, students.matric_marks),
         application_form = $5,
         updated_at       = NOW()`,
      [
        userId,
        phone?.trim() || null,
        academicLevel || null,
        gpaOrMarks ? parseFloat(gpaOrMarks) : null,
        JSON.stringify(formData),
      ]
    );

    return NextResponse.json({ message: 'Form saved successfully', success: true });
  } catch (error) {
    console.error('POST /api/admission-form error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save form' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
