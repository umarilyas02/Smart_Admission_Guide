import { NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const program = (searchParams.get('program') || '').trim();

    if (!program) {
      return NextResponse.json({ error: 'program query param is required' }, { status: 400 });
    }

    const rows = await queryMany(
      `SELECT u.id, u.name, u.location, u.website, u.description,
              p.id AS program_id, p.name AS program_name, p.duration, p.fee, p.eligibility
       FROM programs p
       JOIN universities u ON u.id = p.university_id
       WHERE p.name ILIKE $1
       ORDER BY u.name`,
      [`%${program}%`]
    );

    // Group programs under each university
    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: row.id,
          name: row.name,
          location: row.location,
          website: row.website,
          description: row.description,
          programs: [],
        });
      }
      map.get(row.id).programs.push({
        id: row.program_id,
        name: row.program_name,
        duration: row.duration,
        fee: row.fee,
        eligibility: row.eligibility,
      });
    }

    return NextResponse.json({ universities: Array.from(map.values()) });
  } catch (err) {
    console.error('GET /api/universities/search error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
