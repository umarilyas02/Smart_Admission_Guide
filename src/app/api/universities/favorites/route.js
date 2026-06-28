import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/serverAuth';

export async function GET(request) {
  const { user, response } = requireAuthenticatedUser(request);
  if (response) return response;

  try {
    const { rows } = await pool.query(
      'SELECT university_id FROM user_university_favorites WHERE user_id = $1',
      [user.userId]
    );
    return NextResponse.json({ favorites: rows.map((r) => r.university_id) });
  } catch (err) {
    console.error('GET /api/universities/favorites error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
