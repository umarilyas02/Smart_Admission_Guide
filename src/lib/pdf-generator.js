import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

function toBuffer(fn) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = new PassThrough();
      doc.pipe(stream);
      fn(doc);
      doc.end();
      const chunks = [];
      stream.on('data', (c) => chunks.push(c));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    } catch (e) { reject(e); }
  });
}

function fmt(val) { return val?.toString().trim() || '—'; }

function pct(obtained, total) {
  if (!obtained || !total) return null;
  return ((parseFloat(obtained) / parseFloat(total)) * 100).toFixed(1) + '%';
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

/* ── shared helpers ── */
function pageHeader(doc, title) {
  doc.fontSize(16).font('Helvetica-Bold').text('UNDERGRADUATE ADMISSION APPLICATION', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('Smart Admission Guide — Practice Form', { align: 'center' });
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#2563EB').lineWidth(1.5).stroke();
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af').text(title);
  doc.fillColor('#000000');
  doc.moveDown(0.4);
}

function sectionHeading(doc, title) {
  doc.moveDown(0.6);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1d4ed8').text(title);
  doc.fillColor('#111827');
  doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor('#bfdbfe').lineWidth(0.8).stroke();
  doc.moveDown(0.4);
}

function row(doc, label, value) {
  const x = 50;
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#6b7280').text(label + ':', x, doc.y, { continued: false, width: 160 });
  doc.fontSize(9).font('Helvetica').fillColor('#111827').text(fmt(value), x + 165, doc.y - doc.currentLineHeight(), { width: 330 });
  doc.moveDown(0.35);
}

function twoCol(doc, pairs) {
  pairs.forEach(([l, v]) => row(doc, l, v));
}

/* ═══════════════════════════════════════════════════
   1. ADMISSION FORM
═══════════════════════════════════════════════════ */
export function generateAdmissionFormPDF(f) {
  return toBuffer((doc) => {
    pageHeader(doc, 'SECTION A — PERSONAL INFORMATION');

    twoCol(doc, [
      ['Full Name', f.fullName],
      ["Father's Name", f.fatherName],
      ['Date of Birth', fmtDate(f.dateOfBirth)],
      ['Gender', f.gender],
      ['CNIC / B-Form No.', f.cnic],
      ["Father's CNIC", f.fatherCnic],
      ['Domicile Province', f.domicile],
      ['Nationality', f.nationality],
      ['Religion', f.religion],
      ['Email', f.email],
      ['Mobile', f.phone],
      ['Permanent Address', f.address],
    ]);

    sectionHeading(doc, 'SECTION B — ACADEMIC BACKGROUND');

    doc.fontSize(9).font('Helvetica-Bold').text('Matriculation (SSC)');
    doc.moveDown(0.2);
    twoCol(doc, [
      ['Board', f.matricBoard],
      ['Passing Year', f.matricYear],
      ['Total Marks', f.matricTotal],
      ['Obtained Marks', f.matricObtained],
      ['Percentage', pct(f.matricObtained, f.matricTotal)],
    ]);

    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica-Bold').text('Intermediate (HSSC / FSc)');
    doc.moveDown(0.2);
    twoCol(doc, [
      ['Board', f.interBoard],
      ['Passing Year', f.interYear],
      ['Group / Major', f.interGroup],
      ['Total Marks', f.interTotal],
      ['Obtained Marks', f.interObtained],
      ['Percentage', pct(f.interObtained, f.interTotal)],
    ]);

    sectionHeading(doc, 'SECTION C — ENTRY TEST');
    twoCol(doc, [
      ['Test Name', f.entryTestName],
      ['Score / Percentile', f.entryTestScore],
      ['Test Year', f.entryTestYear],
    ]);

    sectionHeading(doc, 'SECTION D — PROGRAM PREFERENCES');
    twoCol(doc, [
      ['1st Choice University', f.university1],
      ['1st Choice Program', f.program1],
      ['2nd Choice University', f.university2],
      ['2nd Choice Program', f.program2],
      ['3rd Choice University', f.university3],
      ['3rd Choice Program', f.program3],
    ]);

    if (f.achievements || f.motivation || f.careerGoals) {
      sectionHeading(doc, 'SECTION E — ADDITIONAL INFORMATION');
      if (f.achievements) { row(doc, 'Achievements', f.achievements); }
      if (f.motivation)   { row(doc, 'Motivation',   f.motivation); }
      if (f.careerGoals)  { row(doc, 'Career Goals',  f.careerGoals); }
    }

    // Signature block
    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).font('Helvetica').fillColor('#6b7280')
      .text('I hereby declare that the information provided above is correct to the best of my knowledge.', { align: 'center' });
    doc.moveDown(1);
    doc.text('Signature: _______________________     Date: _______________', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(7).fillColor('#9ca3af').text(
      `Generated via Smart Admission Guide · Practice Form · ${new Date().toLocaleDateString('en-GB')}`,
      { align: 'center' }
    );
  });
}

/* ═══════════════════════════════════════════════════
   2. MOTIVATION LETTER  (aiBody = Claude-generated paragraphs)
═══════════════════════════════════════════════════ */
export function generateMotivationLetterPDF(f, aiBody = '') {
  return toBuffer((doc) => {
    pageHeader(doc, 'STATEMENT OF PURPOSE / MOTIVATION LETTER');

    // Sender block
    doc.fontSize(9).font('Helvetica').fillColor('#374151');
    if (f.fullName) doc.text(fmt(f.fullName));
    if (f.phone)    doc.text(fmt(f.phone));
    if (f.email)    doc.text(fmt(f.email));
    if (f.address)  doc.text(fmt(f.address));
    doc.moveDown(0.5);
    doc.text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }));
    doc.moveDown(0.8);

    doc.text('To the Admissions Committee,');
    if (f.university1) doc.text(fmt(f.university1));
    doc.moveDown(0.8);

    doc.fontSize(9).font('Helvetica-Bold').text(
      `Subject: Application for ${fmt(f.program1)} — ${fmt(f.university1)}`
    );
    doc.moveDown(0.6);

    doc.fontSize(9).font('Helvetica').fillColor('#111827');

    if (aiBody) {
      // Use Claude-generated body directly
      doc.text(aiBody, { align: 'justify' });
    } else {
      // Fallback (should not normally reach here)
      doc.text(
        `I am writing to express my sincere interest in the ${fmt(f.program1)} program at ${fmt(f.university1)}. ` +
        `Having completed my Intermediate studies${f.interBoard ? ` from ${fmt(f.interBoard)}` : ''}` +
        `${f.interObtained && f.interTotal ? ` with ${pct(f.interObtained, f.interTotal)} marks` : ''}, ` +
        `I believe I am well-prepared to take on the challenges of higher education at your esteemed institution.`,
        { align: 'justify' }
      );
    }

    doc.moveDown(1.5);
    doc.text('Yours sincerely,');
    doc.moveDown(1.5);
    doc.text(fmt(f.fullName));
    if (f.cnic) doc.text(`CNIC: ${fmt(f.cnic)}`);

    doc.moveDown(1);
    doc.fontSize(7).fillColor('#9ca3af').text(
      `Generated via Smart Admission Guide · Claude AI · ${new Date().toLocaleDateString('en-GB')}`,
      { align: 'center' }
    );
  });
}

/* ═══════════════════════════════════════════════════
   3. RECOMMENDATION REQUEST  (r = recommenderInfo)
═══════════════════════════════════════════════════ */
export function generateRecommendationRequestPDF(f, r = {}) {
  return toBuffer((doc) => {
    pageHeader(doc, 'REQUEST FOR LETTER OF RECOMMENDATION');

    // Student sender block
    doc.fontSize(9).font('Helvetica').fillColor('#374151');
    if (f.fullName) doc.text(fmt(f.fullName));
    if (f.phone)    doc.text(fmt(f.phone));
    if (f.email)    doc.text(fmt(f.email));
    doc.moveDown(0.5);
    doc.text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }));
    doc.moveDown(0.8);

    // Addressed to the recommender
    doc.text(r.name        ? fmt(r.name)        : 'Dear [Recommender\'s Name],');
    doc.text(r.designation ? fmt(r.designation) : '[Designation]');
    doc.text(r.department  ? fmt(r.department)  : '[Department / Institution]');
    doc.moveDown(0.8);

    const relationship = r.relationship ? `my ${fmt(r.relationship)}` : 'someone who has known me academically';
    doc.fontSize(9).font('Helvetica-Bold').text(
      `Subject: Request for a Letter of Recommendation — ${fmt(f.program1)}, ${fmt(f.university1)}`
    );
    doc.moveDown(0.6);

    doc.font('Helvetica').fillColor('#111827').fontSize(9);

    doc.text(
      `Respected ${r.name ? fmt(r.name) : 'Sir/Madam'},\n\n` +
      `I hope this letter finds you in the best of health. I am ${fmt(f.fullName)}, and I have had the privilege of being taught by you as ${relationship}. ` +
      `I am applying for the ${fmt(f.program1)} program at ${fmt(f.university1)} for the academic session 2025–26. ` +
      `I would be deeply honoured if you could write a letter of recommendation on my behalf.`,
      { align: 'justify' }
    );
    doc.moveDown(0.6);

    doc.text(
      `As ${relationship}, you have had the opportunity to observe my academic performance, commitment, and character first-hand. ` +
      `I believe your endorsement would significantly strengthen my application and give the admissions committee valuable insight into my potential.`,
      { align: 'justify' }
    );
    doc.moveDown(0.6);

    // Application details box
    sectionHeading(doc, 'Application Details');
    twoCol(doc, [
      ['1st Choice', `${fmt(f.program1)} — ${fmt(f.university1)}`],
      ['2nd Choice', f.program2 ? `${fmt(f.program2)} — ${fmt(f.university2)}` : null],
      ['3rd Choice', f.program3 ? `${fmt(f.program3)} — ${fmt(f.university3)}` : null],
      ['Entry Test', f.entryTestName ? `${fmt(f.entryTestName)}: ${fmt(f.entryTestScore)}` : null],
      ['Inter Marks', pct(f.interObtained, f.interTotal)],
      ['Submission Deadline', '[Please confirm deadline with university]'],
    ].filter(([, v]) => v));

    doc.moveDown(0.4);
    if (f.achievements) {
      doc.fontSize(9).font('Helvetica-Bold').text('My Achievements:');
      doc.font('Helvetica').text(fmt(f.achievements), { align: 'justify' });
      doc.moveDown(0.4);
    }

    doc.fontSize(9).font('Helvetica').text(
      `I would be happy to provide any additional information you may need. ` +
      `Please feel free to reach me at ${fmt(f.phone)}${f.email ? ` or ${fmt(f.email)}` : ''}.` +
      (r.email ? ` I can also send the submission link directly to ${fmt(r.email)} if preferred.` : ''),
      { align: 'justify' }
    );
    doc.moveDown(0.6);
    doc.text('Thank you sincerely for your time and continued support.');
    doc.moveDown(1.5);
    doc.text('Respectfully yours,');
    doc.moveDown(1.5);
    doc.text(fmt(f.fullName));
    if (f.cnic) doc.text(`CNIC: ${fmt(f.cnic)}`);
    if (f.phone) doc.text(`Mobile: ${fmt(f.phone)}`);
    if (f.email) doc.text(`Email: ${fmt(f.email)}`);

    doc.moveDown(1);
    doc.fontSize(7).fillColor('#9ca3af').text(
      `Generated via Smart Admission Guide · ${new Date().toLocaleDateString('en-GB')}`,
      { align: 'center' }
    );
  });
}

function ensureSpace(doc, needed = 80) {
  if (doc.y + needed > doc.page.height - 60) {
    doc.addPage();
  }
}

function smallStatBox(doc, x, y, width, label, value, color = '#2563eb') {
  const height = 48;
  doc.roundedRect(x, y, width, height, 8).fillAndStroke('#f8fafc', '#e5e7eb');
  doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(label, x + 10, y + 8, { width: width - 20 });
  doc.fillColor(color).fontSize(16).font('Helvetica-Bold').text(String(value ?? 0), x + 10, y + 22, { width: width - 20 });
  doc.fillColor('#111827');
}

export function generateSyncReportPDF(report = {}) {
  return toBuffer((doc) => {
    const completedAt = report.completedAt
      ? new Date(report.completedAt).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';
    const summary = report.summary || {};
    const inserted = report.inserted || [];
    const skipped = report.skipped || [];
    const logs = report.logs || [];
    const steps = report.steps || [];

    doc.fontSize(18).font('Helvetica-Bold').fillColor('#0f172a')
      .text('Smart Admission Guide', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#2563eb')
      .text('Scrape & Sync Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor('#64748b')
      .text(`Generated: ${completedAt}`, { align: 'center' });
    doc.moveDown(0.8);

    const cardY = doc.y;
    const gap = 10;
    const boxWidth = (495 - gap * 3) / 4;
    smallStatBox(doc, 50, cardY, boxWidth, 'Universities Created', summary.universities_created || 0, '#16a34a');
    smallStatBox(doc, 50 + boxWidth + gap, cardY, boxWidth, 'Universities Updated', summary.universities_updated || 0, '#2563eb');
    smallStatBox(doc, 50 + (boxWidth + gap) * 2, cardY, boxWidth, 'Programs Added', summary.programs_inserted || 0, '#16a34a');
    smallStatBox(
      doc,
      50 + (boxWidth + gap) * 3,
      cardY,
      boxWidth,
      'Programs Removed',
      (summary.programs_deleted || 0) + (summary.program_duplicates_removed || 0),
      '#dc2626'
    );
    doc.y = cardY + 62;

    sectionHeading(doc, 'Pipeline Status');
    if (steps.length) {
      steps.forEach((step) => {
        ensureSpace(doc, 32);
        const status = step.status === 'done' ? 'DONE' : step.status === 'failed' ? 'FAILED' : step.status === 'running' ? 'RUNNING' : 'PENDING';
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827')
          .text(`${step.label}: `, 50, doc.y, { continued: true });
        doc.fillColor(step.status === 'done' ? '#15803d' : step.status === 'failed' ? '#dc2626' : '#2563eb')
          .text(status, { continued: false });
        if (step.detail) {
          doc.fontSize(8).font('Helvetica').fillColor('#64748b')
            .text(step.detail, 70, doc.y + 2, { width: 470 });
        }
        doc.moveDown(0.5);
      });
    } else {
      doc.fontSize(9).font('Helvetica').fillColor('#111827').text('No pipeline steps recorded.');
    }

    sectionHeading(doc, 'Summary');
    twoCol(doc, [
      ['Total payloads', summary.total],
      ['Saved', summary.saved],
      ['Skipped', summary.skipped],
      ['Events Created', summary.events_created],
      ['Events Updated', summary.events_updated],
      ['Programs Unchanged', summary.programs_skipped],
      ['Programs Renamed', summary.programs_renamed],
      ['Duplicates Removed', summary.program_duplicates_removed],
    ]);

    sectionHeading(doc, 'Per-University Changes');
    if (inserted.length) {
      inserted.forEach((item) => {
        ensureSpace(doc, 90);
        doc.roundedRect(50, doc.y, 495, 64, 8).strokeColor('#e5e7eb').lineWidth(1).stroke();
        const top = doc.y + 8;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a')
          .text(item.name, 60, top, { width: 300 });
        doc.fontSize(8).font('Helvetica').fillColor('#64748b')
          .text(`University ${item.action} • Event ${item.event_action} • ${item.programs_total} total programs`, 60, top + 14, { width: 300 });
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#15803d')
          .text(`+${item.programs_inserted} added`, 370, top, { width: 70, align: 'right' });
        doc.fillColor('#475569').text(`${item.programs_skipped} unchanged`, 445, top, { width: 90, align: 'right' });
        doc.fillColor('#d97706').text(`${item.programs_renamed} renamed`, 370, top + 14, { width: 70, align: 'right' });
        doc.fillColor('#dc2626').text(`${item.programs_deleted + item.program_duplicates_removed} removed`, 445, top + 14, { width: 90, align: 'right' });

        const detailLines = [];
        if (item.programs_inserted_names?.length) detailLines.push(`Added: ${item.programs_inserted_names.slice(0, 4).join(', ')}`);
        if (item.program_renames?.length) detailLines.push(`Renamed: ${item.program_renames.slice(0, 2).map((entry) => `${entry.from} → ${entry.to}`).join(', ')}`);
        if (item.programs_deleted_names?.length) detailLines.push(`Removed: ${item.programs_deleted_names.slice(0, 2).join(', ')}`);
        if (detailLines.length) {
          doc.fontSize(7).font('Helvetica').fillColor('#334155')
            .text(detailLines.join('   '), 60, top + 32, { width: 470 });
        }
        doc.y += 72;
      });
    } else {
      doc.fontSize(9).font('Helvetica').fillColor('#111827').text('No universities were saved.');
    }

    if (skipped.length) {
      sectionHeading(doc, 'Skipped Items');
      skipped.forEach((item) => {
        ensureSpace(doc, 30);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#991b1b')
          .text(item.university || 'Unknown');
        doc.fontSize(8).font('Helvetica').fillColor('#64748b')
          .text((item.errors || []).join(', '), 65, doc.y + 2, { width: 470 });
        doc.moveDown(0.6);
      });
    }

    if (logs.length) {
      sectionHeading(doc, 'Execution Log');
      logs.forEach((line) => {
        ensureSpace(doc, 24);
        doc.fontSize(7.5).font('Helvetica').fillColor('#334155')
          .text(line, 50, doc.y, { width: 495 });
        doc.moveDown(0.35);
      });
    }

    if (report.output) {
      sectionHeading(doc, 'Cleaner Output');
      ensureSpace(doc, 60);
      doc.fontSize(7.5).font('Helvetica').fillColor('#334155')
        .text(String(report.output), 50, doc.y, { width: 495 });
    }

    doc.moveDown(1);
    doc.fontSize(7).font('Helvetica').fillColor('#94a3b8')
      .text('Generated via Smart Admission Guide · Admin Sync Report', { align: 'center' });
  });
}
