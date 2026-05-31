import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

function getUserId(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
  return verifyToken(token)?.userId || null;
}

export async function PATCH(req) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await query(
    'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
    [userId]
  );

  return NextResponse.json({ message: 'All marked as read' });
}

export const runtime = 'nodejs';
