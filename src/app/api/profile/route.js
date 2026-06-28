import { NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/serverAuth';
import { validate } from '@/lib/validators';

const INTEREST_MIN_WORDS = 20;
const INTEREST_MAX_WORDS = 50;
const INTEREST_CHIPS = {
  matric: ["Mathematics & Logic", "Science & Experiments", "Arts & Creativity", "Commerce & Business Basics", "Literature & Languages", "Social Studies", "Computer Basics", "Islamic Studies", "Sports & Physical Education"],
  fa: ["Literature & Creative Writing", "History & Civilization", "Urdu Language & Poetry", "English Literature", "Political Science", "Sociology & Social Work", "Psychology & Counseling", "Fine Arts & Visual Design", "Media & Journalism", "Philosophy & Ethics", "Education & Teaching", "Law & Civil Services", "Arabic Language & Islamic Studies", "Library & Information Sciences"],
  fsc_medical: ["Biology & Life Sciences", "Human Anatomy & Physiology", "Chemistry & Biochemistry", "Medicine & Healthcare", "Pharmacy & Drug Sciences", "Dentistry", "Microbiology & Genetics", "Public Health & Nutrition", "Nursing", "Veterinary Sciences", "Biomedical Research"],
  fsc_engineering: ["Mathematics & Applied Sciences", "Physics & Mechanics", "Civil Engineering", "Mechanical Engineering", "Electrical Engineering", "Chemical Engineering", "Architecture & Urban Planning", "Aerospace Engineering", "Environmental Engineering", "Structural Design", "Renewable Energy"],
  ics: ["Computer Science & Programming", "Artificial Intelligence & ML", "Software Development", "Cybersecurity & Networking", "Data Science & Analytics", "Web & App Development", "Database Management", "Cloud Computing", "Game Development", "Mathematics & Algorithms", "Electronics & Embedded Systems"],
  icom: ["Business Administration", "Economics & Finance", "Accounting & Audit", "Marketing & E-commerce", "Banking & Financial Services", "Human Resource Management", "Entrepreneurship & Startups", "Supply Chain & Logistics", "International Trade", "Statistics & Research Methods", "Public Administration"],
};
const TEST_TYPES = {
  mdcat: 200,
  nums: 200,
  ecat: 400,
  nts_nat: 100,
  gat: 100,
  other: 999,
};
const TESTS_FOR_LEVEL = {
  fsc_medical: ['mdcat', 'nums', 'other'],
  fsc_engineering: ['ecat', 'nts_nat', 'other'],
  ics: ['ecat', 'nts_nat', 'gat', 'other'],
  icom: ['nts_nat', 'gat', 'other'],
  fa: ['nts_nat', 'gat', 'other'],
};
const ACADEMIC_LEVELS = new Set(['fsc_medical', 'fsc_engineering', 'ics', 'icom', 'fa']);
const MATRIC_TYPES = new Set(['medical_science', 'computer_science', 'arts', 'commerce', 'engineering', 'general']);

function countWords(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function hasSelectedInterestChip(academicLevel, interests) {
  const chips = INTEREST_CHIPS[academicLevel] || [];
  const selected = String(interests || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return chips.some((chip) => selected.includes(chip.toLowerCase()));
}

function validateInterests(academicLevel, interests) {
  const value = String(interests || '').trim();
  if (!value) return 'Select at least one interest or write your career goals';
  if (value.length > 300) return 'Interests must be at most 300 characters';
  if (hasSelectedInterestChip(academicLevel, value)) return null;

  const words = countWords(value);
  if (words < INTEREST_MIN_WORDS) return `Write at least ${INTEREST_MIN_WORDS} words, or select an interest chip`;
  if (words > INTEREST_MAX_WORDS) return `Keep interests within ${INTEREST_MAX_WORDS} words`;
  return null;
}

function validateProfileInput(body) {
  const errors = [];
  const attemptedTest = body.has_entry_test === true || body.has_entry_test === 'yes';
  const noTest = body.has_entry_test === false || body.has_entry_test === 'no';

  const nameError = validate('name', body.name, { required: true });
  if (nameError) errors.push(`Full Name: ${nameError}`);

  const phoneError = validate('phone', body.phone, { required: true });
  if (phoneError) errors.push(`Phone Number: ${phoneError}`);

  if (!MATRIC_TYPES.has(body.matric_type)) errors.push('Matric Subject Stream: Select a valid option');
  if (!ACADEMIC_LEVELS.has(body.academic_level)) errors.push('Intermediate Stream: Select a valid option');

  const matricError = validate('percentage', body.matric_marks, { required: true, min: 33, max: 100 });
  if (matricError) errors.push(`Matric Marks: ${matricError}`);

  const interError = validate('percentage', body.intermediate_marks, { required: true, min: 33, max: 100 });
  if (interError) errors.push(`Intermediate Marks: ${interError}`);

  const interestError = validateInterests(body.academic_level, body.interests);
  if (interestError) errors.push(`Interests & Goals: ${interestError}`);

  if (!attemptedTest && !noTest) {
    errors.push('Entry Test Required?: This field is required');
  }

  if (attemptedTest) {
    const relevantTests = TESTS_FOR_LEVEL[body.academic_level] || Object.keys(TEST_TYPES);
    if (!Object.prototype.hasOwnProperty.call(TEST_TYPES, body.test_type) || !relevantTests.includes(body.test_type)) {
      errors.push('Test Type: Select a valid option');
    }

    const scoreError = validate('number', body.test_score, { required: true, min: 0, max: TEST_TYPES[body.test_type] ?? 999 });
    if (scoreError) errors.push(`Test Score: ${scoreError}`);

    const yearError = validate('year', body.test_year, { required: true, min: 1950 });
    if (yearError) errors.push(`Test Year: ${yearError}`);

    if (body.test_date && Number.isNaN(new Date(body.test_date).getTime())) {
      errors.push('Test Date: Enter a valid date');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    attemptedTest,
  };
}

export async function GET(req) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return unauthorizedResponse();

  try {
    const user = await queryOne('SELECT id, name, email FROM users WHERE id=$1', [userId]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const student = await queryOne('SELECT * FROM students WHERE user_id=$1', [userId]);

    let savedCount = 0;
    try {
      const savedRow = await queryOne('SELECT COUNT(*)::int AS count FROM user_university_favorites WHERE user_id=$1', [userId]);
      savedCount = savedRow?.count ?? 0;
    } catch {
      // table may not exist yet; non-critical
    }

    return NextResponse.json({ user, student: student || null, savedCount });
  } catch (error) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { name, phone, academic_level, matric_type, matric_marks, intermediate_marks, has_entry_test, test_type, test_score, test_year, test_date, interests } = body;
    const validation = validateProfileInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors[0], errors: validation.errors }, { status: 400 });
    }

    if (name?.trim()) {
      await query('UPDATE users SET name=$1, updated_at=NOW() WHERE id=$2', [name.trim(), userId]);
    }

    await query(
      `INSERT INTO students (user_id, phone, academic_level, matric_type, matric_marks, intermediate_marks, has_entry_test, test_type, test_score, test_year, test_date, interests, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         phone = $2,
         academic_level = $3,
         matric_type = $4,
         matric_marks = $5,
         intermediate_marks = $6,
         has_entry_test = $7,
         test_type = $8,
         test_score = $9,
         test_year = $10,
         test_date = $11,
         interests = $12,
         updated_at = NOW()`,
      [
        userId,
        phone || null,
        academic_level || null,
        matric_type || null,
        matric_marks ? parseFloat(matric_marks) : null,
        intermediate_marks ? parseFloat(intermediate_marks) : null,
        validation.attemptedTest,
        validation.attemptedTest ? test_type || null : null,
        validation.attemptedTest && test_score ? parseFloat(test_score) : null,
        validation.attemptedTest && test_year ? parseInt(test_year, 10) : null,
        validation.attemptedTest && test_date ? test_date : null,
        interests || null,
      ]
    );

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('PUT /api/profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile. Please try again.' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
