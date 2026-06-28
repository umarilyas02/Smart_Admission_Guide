import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireAdminUser } from '@/lib/serverAuth';

export async function PATCH(req, { params }) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, location, type, website, fee_structure_url, description, ranking } = body;

    if (name !== undefined && !name?.trim()) {
      return NextResponse.json({ error: 'University name cannot be empty' }, { status: 400 });
    }

    const updated = await queryOne(
      `UPDATE universities
       SET name              = $1,
           location          = $2,
           type              = $3,
           website           = $4,
           fee_structure_url = $5,
           description       = $6,
           ranking           = $7,
           updated_at        = NOW()
       WHERE id = $8
       RETURNING id, name, location, type, website, fee_structure_url, description, ranking`,
      [
        name.trim(),
        location?.trim() || null,
        type?.trim() || null,
        website?.trim() || null,
        fee_structure_url?.trim() || null,
        description?.trim() || null,
        ranking ? parseInt(ranking) : null,
        id,
      ]
    );

    if (!updated) return NextResponse.json({ error: 'University not found' }, { status: 404 });
    return NextResponse.json({ university: updated });
  } catch (err) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'A university with this name already exists' }, { status: 409 });
    }
    console.error('PATCH /api/admin/universities/[id] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const { id } = await params;
    await query('DELETE FROM universities WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/universities/[id] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
