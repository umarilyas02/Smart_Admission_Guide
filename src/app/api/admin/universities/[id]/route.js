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
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
