import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

const ADMIN_EMAIL = 'smartadmissionguide@gmail.com';

function isAdmin(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
  const decoded = verifyToken(token);
  return decoded?.email === ADMIN_EMAIL;
}

export async function PATCH(req, { params }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
