import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { generateSyncReportPDF } from '@/lib/pdf-generator';

const ADMIN_EMAIL = 'smartadmissionguide@gmail.com';

function isAdmin(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
  const decoded = verifyToken(token);
  return decoded?.email === ADMIN_EMAIL;
}

export async function POST(req) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const report = body?.report;
    if (!report) {
      return NextResponse.json({ error: 'Report payload is required' }, { status: 400 });
    }

    const pdfBuffer = await generateSyncReportPDF(report);
    const fileName = `sync-report-${Date.now()}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error('POST /api/admin/sync-report error', error);
    return NextResponse.json({ error: error.message || 'Failed to generate report PDF' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
