import { NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/serverAuth';

export async function GET(req) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return unauthorizedResponse();

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
