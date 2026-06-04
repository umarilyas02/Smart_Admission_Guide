import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryOne } from '@/lib/db';

const ADMIN_EMAIL = 'smartadmissionguide@gmail.com';

export async function GET(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  const decoded = verifyToken(token);

  if (!decoded || decoded.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [students, universities, programs, chatbotQueries] = await Promise.all([
      queryOne('SELECT COUNT(*) FROM students', []),
      queryOne('SELECT COUNT(*) FROM universities', []),
      queryOne('SELECT COUNT(*) FROM programs', []),
      queryOne('SELECT COUNT(*) FROM chat_logs', []),
    ]);

    return NextResponse.json({
      students: parseInt(students?.count ?? 0),
      universities: parseInt(universities?.count ?? 0),
      programs: parseInt(programs?.count ?? 0),
      chatbotQueries: parseInt(chatbotQueries?.count ?? 0),
    });
  } catch (err) {
    console.error('GET /api/admin/stats error', err);
    return NextResponse.json({ students: 0, universities: 0, programs: 0, chatbotQueries: 0 });
  }
}

export const runtime = 'nodejs';
