import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { query, queryOne } from '@/lib/db';
import { validateAdmissionForm } from '@/lib/admission-form-validation';
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/serverAuth';
import {
  generateAdmissionFormPDF,
  generateMotivationLetterPDF,
  generateRecommendationRequestPDF,
} from '@/lib/pdf-generator';

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

function pct(obtained, total) {
  if (!obtained || !total) return null;
  return ((parseFloat(obtained) / parseFloat(total)) * 100).toFixed(1) + '%';
}

async function buildMotivationLetterWithClaude(f) {
  const details = [
    f.fullName        && `Student Name: ${f.fullName}`,
    f.program1        && `Target Program: ${f.program1}`,
    f.university1     && `Target University: ${f.university1}`,
    f.interBoard      && `Intermediate Board: ${f.interBoard}`,
    (f.interObtained && f.interTotal) && `Intermediate Marks: ${f.interObtained}/${f.interTotal} (${pct(f.interObtained, f.interTotal)})`,
    f.matricObtained  && `Matric Marks: ${f.matricObtained}/${f.matricTotal} (${pct(f.matricObtained, f.matricTotal)})`,
    f.entryTestName   && `Entry Test: ${f.entryTestName}${f.entryTestScore ? ' — ' + f.entryTestScore : ''}`,
    f.interGroup      && `Academic Group: ${f.interGroup}`,
    f.achievements    && `Achievements: ${f.achievements}`,
    f.motivation      && `Student's own motivation: ${f.motivation}`,
    f.careerGoals     && `Career Goals: ${f.careerGoals}`,
    f.extraInfo       && `Additional Info: ${f.extraInfo}`,
  ].filter(Boolean).join('\n');

  const prompt = `You are helping a Pakistani student write a compelling Statement of Purpose / Motivation Letter for university admission.

Based on the student's details below, write a professional and authentic motivation letter body in 3–4 focused paragraphs.

Rules:
- Use formal Pakistani English
- Be specific — reference the student's actual marks, program, university, and goals
- Do NOT use generic filler sentences like "I have always been passionate about..."
- Do NOT include salutation (Dear...) or signature — only the body paragraphs
- Keep it under 350 words
- Sound genuine, not like a template

Student Details:
${details}

Write only the letter body paragraphs:`;

  const response = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0]?.text?.trim() || '';
}

export async function POST(req) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { formData, documentType = 'admission-form', recommenderInfo } = body;
    if (documentType === 'motivation-letter' || documentType === 'recommendation-request') {
      return NextResponse.json(
        { error: 'This document type is no longer required for admissions in this system.' },
        { status: 400 }
      );
    }

    if (!formData) {
      return NextResponse.json({ error: 'Form data is required' }, { status: 400 });
    }

    let student = await queryOne(
      'SELECT id, application_form FROM students WHERE user_id = $1',
      [userId]
    );

    // Merge saved form (base) with current client data (freshest on top)
    const mergedFormData = {
      ...(student?.application_form || {}),
      ...formData,
    };
    const validation = validateAdmissionForm(mergedFormData);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0] || 'Please fix the highlighted fields first.';
      return NextResponse.json(
        { error: firstError, errors: validation.errors },
        { status: 400 }
      );
    }
    if (!student) {
      await query(
        `INSERT INTO students (user_id, created_at, updated_at)
         VALUES ($1, NOW(), NOW()) ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );

      student = await queryOne(
        'SELECT id, application_form FROM students WHERE user_id = $1',
        [userId]
      );
    }

    // ── One-time limit for motivation-letter ──
    if (documentType === 'motivation-letter') {
      const existing = await queryOne(
        `SELECT id FROM documents WHERE student_id = $1 AND type = 'motivation-letter'`,
        [student.id]
      );
      if (existing) {
        return NextResponse.json(
          { error: 'You have already generated your motivation letter. Each student can only generate it once.' },
          { status: 409 }
        );
      }
    }

    let pdfBuffer;

    switch (documentType) {
      case 'admission-form': {
        pdfBuffer = await generateAdmissionFormPDF(mergedFormData);
        break;
      }

      case 'motivation-letter': {
        // Generate AI-enhanced letter body with Claude Haiku
        const aiLetterBody = await buildMotivationLetterWithClaude(mergedFormData);
        pdfBuffer = await generateMotivationLetterPDF(mergedFormData, aiLetterBody);
        break;
      }

      case 'recommendation-request': {
        if (!recommenderInfo?.name) {
          return NextResponse.json(
            { error: 'Recommender name is required' },
            { status: 400 }
          );
        }
        pdfBuffer = await generateRecommendationRequestPDF(mergedFormData, recommenderInfo);
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    // Log generated document
    const fileName = `${documentType}-${Date.now()}.pdf`;
    await query(
      `INSERT INTO documents (student_id, type, file_name, file_size, uploaded_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [student.id, documentType, fileName, pdfBuffer.length]
    );

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate document' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
