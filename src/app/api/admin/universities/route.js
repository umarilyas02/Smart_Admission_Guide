import { NextResponse } from 'next/server';
import { query, queryMany } from '@/lib/db';
import { requireAdminUser } from '@/lib/serverAuth';

export async function GET(req) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const universities = await queryMany(
      `SELECT u.id, u.name, u.location, u.type, u.website, u.fee_structure_url,
              u.description, u.ranking, u.created_at,
              COUNT(p.id)::int AS program_count
       FROM universities u
       LEFT JOIN programs p ON p.university_id = u.id
       GROUP BY u.id
       ORDER BY u.name`,
      []
    );
    return NextResponse.json({ universities });
  } catch (err) {
    console.error('GET /api/admin/universities error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const body = await req.json();
    const { name, location, type, website, fee_structure_url, description, ranking } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'University name is required' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO universities (name, location, type, website, fee_structure_url, description, ranking, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, name, location, type, website, fee_structure_url, description, ranking, created_at`,
      [
        name.trim(),
        location?.trim() || null,
        type?.trim() || null,
        website?.trim() || null,
        fee_structure_url?.trim() || null,
        description?.trim() || null,
        ranking ? parseInt(ranking) : null,
      ]
    );

    return NextResponse.json({ university: res.rows[0] }, { status: 201 });
  } catch (err) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'A university with this name already exists' }, { status: 409 });
    }
    console.error('POST /api/admin/universities error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
