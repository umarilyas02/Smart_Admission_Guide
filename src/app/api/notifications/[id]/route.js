import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/serverAuth';

export async function PATCH(req, { params }) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return unauthorizedResponse();

  // Next.js 15+ makes route params async — must be awaited before use.
  const { id } = await params;
  await query(
    'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  return NextResponse.json({ message: 'Marked as read' });
}

export async function DELETE(req, { params }) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return unauthorizedResponse();

  const { id } = await params;
  await query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  return NextResponse.json({ message: 'Deleted' });
}

export const runtime = 'nodejs';
