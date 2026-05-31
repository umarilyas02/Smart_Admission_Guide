import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryMany } from '@/lib/db';

function getUserId(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
  return verifyToken(token)?.userId || null;
}

export async function GET(req) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notifications = await queryMany(
    `SELECT id, title, message, type, read, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return NextResponse.json({ notifications });
}

export const runtime = 'nodejs';
