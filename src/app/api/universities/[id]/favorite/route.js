import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function getUser(request) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

// POST /api/universities/:id/favorite — toggle favorite
export async function POST(request, { params }) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const universityId = parseInt(id, 10);

  if (isNaN(universityId)) {
    return NextResponse.json({ error: 'Invalid university id' }, { status: 400 });
  }

  try {
    // Check if already favorited
    const { rows } = await pool.query(
      'SELECT id FROM user_university_favorites WHERE user_id = $1 AND university_id = $2',
      [user.userId, universityId]
    );

    if (rows.length > 0) {
      // Remove
      await pool.query(
        'DELETE FROM user_university_favorites WHERE user_id = $1 AND university_id = $2',
        [user.userId, universityId]
      );
      return NextResponse.json({ favorited: false });
    } else {
      // Add
      await pool.query(
        'INSERT INTO user_university_favorites (user_id, university_id) VALUES ($1, $2)',
        [user.userId, universityId]
      );
      return NextResponse.json({ favorited: true });
    }
  } catch (err) {
    console.error('POST /api/universities/[id]/favorite error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
