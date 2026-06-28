import { NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { requireAdminUser } from '@/lib/serverAuth';

export async function GET(req) {
  try {
    const { user, response } = requireAdminUser(req);
    if (response) return response;

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'relevant' | 'irrelevant' | null

    let sql = `
      SELECT cl.id, cl.query, cl.response, cl.relevant, cl.created_at,
             u.name AS user_name, u.email AS user_email
      FROM chat_logs cl
      LEFT JOIN users u ON u.id = cl.user_id
    `;
    const params = [];

    if (filter === 'relevant') {
      sql += ' WHERE cl.relevant = TRUE';
    } else if (filter === 'irrelevant') {
      sql += ' WHERE cl.relevant = FALSE';
    }

    sql += ' ORDER BY cl.created_at DESC LIMIT 200';

    const rows = await queryMany(sql, params);
    return NextResponse.json({ logs: rows });
  } catch (err) {
    console.error('GET /api/chatbot/logs error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
