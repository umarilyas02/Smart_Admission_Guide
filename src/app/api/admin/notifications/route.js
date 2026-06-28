import { NextResponse } from 'next/server';
import { queryMany, query } from '@/lib/db';
import { requireAdminUser } from '@/lib/serverAuth';

export async function GET(req) {
  const { response } = requireAdminUser(req);
  if (response) return response;

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
  const { response } = requireAdminUser(req);
  if (response) return response;

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
  const { response } = requireAdminUser(req);
  if (response) return response;

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
export const dynamic = 'force-dynamic';
