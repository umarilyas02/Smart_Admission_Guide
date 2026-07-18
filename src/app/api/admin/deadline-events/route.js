import { NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { requireAdminUser } from '@/lib/serverAuth';

export async function GET(req) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const days = Math.max(1, Math.min(parseInt(searchParams.get('days'), 10) || 90, 365));

    const events = await queryMany(
      `SELECT
         e.id, e.event_type, e.start_date, e.end_date, e.status, e.details,
         u.id AS university_id, u.name AS university_name,
         COUNT(DISTINCT f.user_id)::int AS favorited_users
       FROM university_events e
       JOIN universities u ON u.id = e.university_id
       LEFT JOIN user_university_favorites f ON f.university_id = u.id
       WHERE e.start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 || ' days')::INTERVAL
       GROUP BY e.id, e.event_type, e.start_date, e.end_date, e.status, e.details, u.id, u.name
       ORDER BY e.start_date ASC
       LIMIT 200`,
      [days]
    );

    return NextResponse.json({ events });
  } catch (err) {
    console.error('GET /api/admin/deadline-events error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
