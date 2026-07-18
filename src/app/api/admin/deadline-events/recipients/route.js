import { NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { requireAdminUser } from '@/lib/serverAuth';

export async function POST(req) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const { eventIds } = await req.json();
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ error: 'eventIds is required' }, { status: 400 });
    }
    const ids = eventIds.map((id) => parseInt(id, 10)).filter((id) => Number.isInteger(id));
    if (ids.length === 0) {
      return NextResponse.json({ error: 'eventIds is required' }, { status: 400 });
    }

    const users = await queryMany(
      `SELECT DISTINCT us.id, us.name, us.email
       FROM university_events e
       JOIN user_university_favorites f ON f.university_id = e.university_id
       JOIN users us ON us.id = f.user_id
       WHERE e.id = ANY($1::int[])
       ORDER BY us.email ASC`,
      [ids]
    );

    return NextResponse.json({ users });
  } catch (err) {
    console.error('POST /api/admin/deadline-events/recipients error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
