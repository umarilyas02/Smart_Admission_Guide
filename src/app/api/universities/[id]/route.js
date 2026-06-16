import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { description, name, location, website } = body;

    const updated = await queryOne(
      `UPDATE universities
       SET description = COALESCE($1, description),
           name        = COALESCE($2, name),
           location    = COALESCE($3, location),
           website     = COALESCE($4, website),
           updated_at  = NOW()
       WHERE id = $5
       RETURNING id, name, description, location, website`,
      [description ?? null, name ?? null, location ?? null, website ?? null, id]
    );

    if (!updated) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 });
    }
    return NextResponse.json({ university: updated });
  } catch (err) {
    console.error('PATCH /api/universities/[id] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await query('DELETE FROM universities WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/universities/[id] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
