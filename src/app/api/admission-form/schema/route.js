import { NextResponse } from 'next/server';
import { admissionFormSections, documentChecklist } from '@/lib/admission-form-schema';

export async function GET() {
  return NextResponse.json({ sections: admissionFormSections, documentChecklist });
}

export const runtime = 'nodejs';
