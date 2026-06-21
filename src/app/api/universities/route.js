import { NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { syncUniversityData } from '@/lib/university-sync';

export async function POST(req) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : body.data || [];
    const replace = Boolean(body?.replace);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No university data provided' }, { status: 400 });
    }

    const result = await syncUniversityData(items, { replace });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('POST /api/universities error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const universities = await queryMany(
      `SELECT u.id, u.name, u.location, u.website, u.fee_structure_url, u.description, u.created_at
       FROM universities u
       ORDER BY u.name`,
      []
    );

    if (universities.length === 0) {
      return NextResponse.json({ universities: [] });
    }

    const ids = universities.map((u) => u.id);
    const events = await queryMany(
      `SELECT id, university_id, event_type, start_date, end_date, status, details, created_at, updated_at
       FROM university_events
       WHERE university_id = ANY($1)
       ORDER BY start_date NULLS LAST`,
      [ids]
    );

    const programs = await queryMany(
      `SELECT id, university_id, name, fee, duration, eligibility
       FROM programs
       WHERE university_id = ANY($1)
       ORDER BY name`,
      [ids]
    );

    const eventsByUni = new Map();
    for (const e of events) {
      if (!eventsByUni.has(e.university_id)) eventsByUni.set(e.university_id, []);
      eventsByUni.get(e.university_id).push(e);
    }

    const programsByUni = new Map();
    for (const p of programs) {
      if (!programsByUni.has(p.university_id)) programsByUni.set(p.university_id, []);
      programsByUni.get(p.university_id).push(p);
    }

    const results = universities.map((u) => ({
      ...u,
      events: eventsByUni.get(u.id) || [],
      programs: programsByUni.get(u.id) || [],
    }));

    return NextResponse.json({ universities: results });
  } catch (err) {
    console.error('GET /api/universities error', err);
    return NextResponse.json(
      { error: 'Server error', detail: err.message, code: err.code },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
