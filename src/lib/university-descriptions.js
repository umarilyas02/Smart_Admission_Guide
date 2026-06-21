import Anthropic from '@anthropic-ai/sdk';

export const CANONICAL_DESCRIPTIONS = [
  {
    match: 'comsats',
    description:
      'COMSATS University Islamabad (CUI) is a public sector university established in 2000. It is widely recognized in Pakistan for strong programs in computing, engineering, science, and business, along with a growing research and innovation culture.',
  },
  {
    match: 'fast',
    description:
      'FAST National University of Computer and Emerging Sciences (FAST-NUCES) is one of Pakistan’s leading universities for computing and technology education. It is especially known for rigorous academics in Computer Science, Software Engineering, Engineering, and Business.',
  },
  {
    match: 'lums',
    description:
      'Lahore University of Management Sciences (LUMS) is one of Pakistan’s most prestigious private universities. It is known for academic excellence across business, economics, law, social sciences, and computing, with a strong focus on leadership and research.',
  },
  {
    match: 'itu',
    description:
      'Information Technology University (ITU) Punjab is a specialized public university in Lahore focused on technology, innovation, and entrepreneurship. It offers modern programs in computing, engineering, data, and management with an emphasis on research-driven learning.',
  },
  {
    match: 'uet lahore',
    description:
      'University of Engineering and Technology (UET) Lahore is one of Pakistan’s oldest and most respected engineering universities. It is well known for producing strong graduates in engineering, technology, and applied sciences.',
  },
  {
    match: 'punjab university',
    description:
      'University of the Punjab (PU) is one of Pakistan’s oldest and largest public universities. Based in Lahore, it offers a broad range of programs across sciences, arts, business, law, social sciences, and professional disciplines.',
  },
  {
    match: 'university of the punjab',
    description:
      'University of the Punjab (PU) is one of Pakistan’s oldest and largest public universities. Based in Lahore, it offers a broad range of programs across sciences, arts, business, law, social sciences, and professional disciplines.',
  },
  {
    match: 'ucp',
    description:
      'University of Central Punjab (UCP) is a major private university in Lahore known for modern academic facilities and a wide program portfolio. It offers undergraduate education across business, computing, engineering, health sciences, media, and social sciences.',
  },
  {
    match: 'umt',
    description:
      'University of Management and Technology (UMT) is a private university known for industry-oriented education and a broad academic offering. Its programs span business, computing, engineering, social sciences, design, and health-related disciplines.',
  },
  {
    match: 'uskt',
    description:
      'University of Sialkot (USKT) is a private university serving students from Sialkot and surrounding regions. It offers undergraduate programs across business, computing, sciences, humanities, design, and allied health fields.',
  },
  {
    match: 'gc women university sialkot',
    description:
      'Government College Women University Sialkot (GCWUS) is a public university dedicated to women’s higher education in Sialkot. It offers academic opportunities across natural sciences, arts, social sciences, management, and related fields.',
  },
];

export function isRawUniversityDescription(desc) {
  if (!desc || desc.length < 40) return true;
  if (/\|/.test(desc)) return true;
  if (/\b(menu|home page|sign in|login|copyright|all rights reserved|admissions open|click here|read more|latest news|fee structure|search programs)\b/i.test(desc)) {
    return true;
  }
  return false;
}

export function getCanonicalUniversityDescription(name) {
  const lower = String(name || '').toLowerCase();
  const match = CANONICAL_DESCRIPTIONS.find((item) => lower.includes(item.match));
  return match?.description || '';
}

function summarizePrograms(programs = []) {
  const clean = [...new Set(programs.map((p) => String(p).trim()).filter(Boolean))];
  return clean.slice(0, 5);
}

function buildTemplateDescription({ name, location, programs }) {
  const topPrograms = summarizePrograms(programs);
  const programText = topPrograms.length
    ? ` It offers undergraduate programs such as ${topPrograms.join(', ')}${programs.length > topPrograms.length ? ', and other related disciplines' : ''}.`
    : ' It offers undergraduate programs across multiple academic disciplines.';
  const locationText = location ? ` based in ${location}` : '';
  return `${name} is a university${locationText} featured on Smart Admission Guide.${programText}`;
}

async function generateDescriptionWithClaude({ name, location, programs, details }) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return '';

  const anthropic = new Anthropic({ apiKey });
  const prompt = `Write a concise university overview for students.

University: ${name}
Location: ${location || 'Unknown'}
Programs: ${(programs || []).slice(0, 10).join(', ') || 'Not available'}
Raw scraped text: ${(details || '').slice(0, 1200)}

Rules:
- Write exactly 2 sentences.
- Keep it under 70 words.
- Sound factual and polished.
- Focus on what the university offers academically.
- Ignore navigation text, menus, fee links, admissions banners, and website clutter.
- Do not invent rankings or facts that are not supported by the input unless they are obvious from the university name itself.
- Output only the final description.`;

  try {
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 160,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content?.[0]?.text?.trim() || '';
  } catch (error) {
    console.error('Claude university description generation failed:', error);
    return '';
  }
}

export async function resolveUniversityDescription({
  name,
  location,
  programs = [],
  details = '',
  currentDescription = '',
}) {
  if (!isRawUniversityDescription(currentDescription)) {
    return currentDescription.trim();
  }

  const canonical = getCanonicalUniversityDescription(name);
  if (canonical) return canonical;

  const aiDescription = await generateDescriptionWithClaude({ name, location, programs, details });
  if (aiDescription && !isRawUniversityDescription(aiDescription)) {
    return aiDescription;
  }

  return buildTemplateDescription({ name, location, programs });
}
