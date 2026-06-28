import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireAdminUser } from '@/lib/serverAuth';

export async function PATCH(req, { params }) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { university_id, name, field, duration, fee, merit_percentage, description, eligibility } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Program name cannot be empty' }, { status: 400 });
    }
    if (!university_id) {
      return NextResponse.json({ error: 'University is required' }, { status: 400 });
    }

    const updated = await queryOne(
      `UPDATE programs
       SET university_id    = $1,
           name             = $2,
           field            = $3,
           duration         = $4,
           fee              = $5,
           merit_percentage = $6,
           description      = $7,
           eligibility      = $8
       WHERE id = $9
       RETURNING id, university_id, name, field, duration, fee, merit_percentage, description, eligibility`,
      [
        parseInt(university_id),
        name.trim(),
        field?.trim() || null,
        duration?.trim() || null,
        fee !== '' && fee != null ? parseFloat(fee) : null,
        merit_percentage !== '' && merit_percentage != null ? parseFloat(merit_percentage) : null,
        description?.trim() || null,
        eligibility?.trim() || null,
        id,
      ]
    );

    if (!updated) return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    return NextResponse.json({ program: updated });
  } catch (err) {
    console.error('PATCH /api/admin/programs/[id] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const { id } = await params;
    await query('DELETE FROM programs WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/programs/[id] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
