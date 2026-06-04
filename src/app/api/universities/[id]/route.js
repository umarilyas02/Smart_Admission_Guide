import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await query('DELETE FROM universities WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/universities/[id] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
