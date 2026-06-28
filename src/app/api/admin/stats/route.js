import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { requireAdminUser } from '@/lib/serverAuth';

export async function GET(req) {
  const { response } = requireAdminUser(req);
  if (response) return response;

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
export const dynamic = 'force-dynamic';
