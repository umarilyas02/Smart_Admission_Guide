import { NextResponse } from 'next/server';
import { queryOne, queryMany } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    // Next.js 15+ makes route params async — must be awaited before use.
    const { id } = await params;

    const university = await queryOne(
      `SELECT id, name, location, website, fee_structure_url, description
       FROM universities
       WHERE id = $1`,
      [id]
    );

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 });
    }

    const programs = await queryMany(
      `SELECT id, name, fee, duration, eligibility
       FROM programs
       WHERE university_id = $1
       ORDER BY name`,
      [id]
    );

    const events = await queryMany(
      `SELECT id, event_type, start_date, end_date, status, details
       FROM university_events
       WHERE university_id = $1
       ORDER BY start_date NULLS LAST`,
      [id]
    );

    return NextResponse.json({ university: { ...university, programs, events } });
  } catch (err) {
    console.error('GET /api/universities/[id]/programs error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
