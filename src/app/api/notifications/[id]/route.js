import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

function getUserId(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
  return verifyToken(token)?.userId || null;
}

export async function PATCH(req, { params }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Next.js 15+ makes route params async — must be awaited before use.
  const { id } = await params;
  await query(
    'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  return NextResponse.json({ message: 'Marked as read' });
}

export async function DELETE(req, { params }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  return NextResponse.json({ message: 'Deleted' });
}

export const runtime = 'nodejs';
