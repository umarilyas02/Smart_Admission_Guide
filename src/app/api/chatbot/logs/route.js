import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { queryMany, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

const ADMIN_EMAIL = 'smartadmissionguide@gmail.com';

export async function GET(req) {
  try {
    // Get token from cookies or Authorization header
    let token = null;

    try {
      const cookieStore = await cookies();
      token = cookieStore.get('auth_token')?.value;
    } catch (err) {
      console.error('Error reading cookies:', err);
    }

    if (!token) {
      const authHeader = req.headers.get('authorization') || '';
      token = authHeader.replace('Bearer ', '').trim();
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify user is admin
    const user = await queryOne('SELECT email FROM users WHERE id=$1', [decoded.userId]);
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

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
