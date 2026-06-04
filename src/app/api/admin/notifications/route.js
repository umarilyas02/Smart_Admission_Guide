import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryMany, query } from '@/lib/db';

const ADMIN_EMAIL = 'smartadmissionguide@gmail.com';

function isAdmin(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
  const decoded = verifyToken(token);
  return decoded?.email === ADMIN_EMAIL;
}

export async function GET(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const notifications = await queryMany(
      `SELECT n.id, n.title, n.message, n.type, n.read, n.created_at,
              u.name AS user_name, u.email AS user_email
       FROM notifications n
       JOIN users u ON n.user_id = u.id
       ORDER BY n.created_at DESC
       LIMIT 200`,
      []
    );
    return NextResponse.json({ notifications });
  } catch (err) {
    console.error('GET /api/admin/notifications error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { title, message, type } = await req.json();
    if (!title || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const users = await queryMany('SELECT id FROM users', []);
    for (const u of users) {
      await query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
        [u.id, title, message, type || 'info']
      );
    }
    return NextResponse.json({ sent: users.length }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/notifications error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id } = await req.json();
    await query('DELETE FROM notifications WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/notifications error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
