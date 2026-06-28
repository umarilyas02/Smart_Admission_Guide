import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/serverAuth';

export async function PATCH(req) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return unauthorizedResponse();

  await query(
    'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
    [userId]
  );

  return NextResponse.json({ message: 'All marked as read' });
}

export const runtime = 'nodejs';
