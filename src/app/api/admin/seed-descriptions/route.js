import { NextResponse } from 'next/server';
import { query, queryMany } from '@/lib/db';

// Canonical descriptions for known Pakistani universities.
// Matched case-insensitively against the name column.
const DESCRIPTIONS = [
  {
    match: 'comsats',
    description:
      'COMSATS University Islamabad (CUI) is a public sector university established in 2000. Ranked among the top universities in Pakistan, it offers programs in Computing, Engineering, Sciences, and Business. CUI has campuses across eight cities and is recognized for strong research output and industry collaborations.',
  },
  {
    match: 'fast',
    description:
      'FAST National University of Computer and Emerging Sciences (FAST-NUCES) is a leading private university in Pakistan, specializing in Computer Science, Software Engineering, Electrical Engineering, and Business. Founded in 2000 and recognized by HEC as a top-tier institution, FAST is renowned for its rigorous academics and producing Pakistan\'s top IT graduates.',
  },
  {
    match: 'nust',
    description:
      'National University of Sciences & Technology (NUST) is Pakistan\'s premier public research university, established in 1991. Consistently ranked #1 in Pakistan and among the top 400 universities globally, NUST offers world-class programs in Engineering, Sciences, IT, Medicine, and Management across multiple specialized schools.',
  },
  {
    match: 'lums',
    description:
      'Lahore University of Management Sciences (LUMS) is one of Pakistan\'s most prestigious private universities, founded in 1985. Known for excellence in Business, Economics, Law, Computer Science, and Social Sciences, LUMS consistently ranks among the top universities in South Asia and attracts students from across Pakistan and internationally.',
  },
  {
    match: 'uet lahore',
    description:
      'University of Engineering and Technology (UET) Lahore is one of Pakistan\'s oldest and most prestigious public engineering universities, founded in 1921. It offers programs in Civil, Electrical, Mechanical, Chemical, and Computer Engineering. UET graduates are highly sought after in both national and international engineering sectors.',
  },
  {
    match: 'university of the punjab',
    description:
      'University of the Punjab (PU) is the oldest and largest public university in Pakistan, established in 1882 in Lahore. It offers over 150 programs across Arts, Sciences, Commerce, Law, Information Technology, and Social Sciences. PU is a major center of higher education and research, serving thousands of students annually.',
  },
  {
    match: 'bahria',
    description:
      'Bahria University is a public sector university established by the Pakistan Navy in 2000. With campuses in Islamabad, Lahore, and Karachi, it offers programs in Engineering, Computer Science, Management Sciences, and Earth & Environmental Sciences. Known for its discipline, strong industry linkages, and practical learning environment.',
  },
  {
    match: 'air university',
    description:
      'Air University is a public sector university established under the Pakistan Air Force in 2002. Located in Islamabad, it offers undergraduate and postgraduate programs in Avionics, Electrical Engineering, Computer Science, Business Administration, and Humanities. It is recognized for its technical excellence and research focus.',
  },
  {
    match: 'aga khan',
    description:
      'Aga Khan University (AKU) is a private research university founded in 1983, with campuses in Karachi and internationally. Widely regarded as Pakistan\'s top medical and nursing institution, AKU also offers programs in Education, Media and Communications, and Examination. Its hospital and medical college are consistently ranked among the best in Asia.',
  },
  {
    match: 'ned university',
    description:
      'NED University of Engineering and Technology is one of the oldest and most reputed public engineering universities in Pakistan, established in 1922 in Karachi. It offers programs in Civil, Mechanical, Electrical, Chemical, and Computer Engineering. NED graduates are renowned for their technical expertise and are employed globally.',
  },
  {
    match: 'gik',
    description:
      'GIK Institute of Engineering Sciences and Technology (GIKI) is a public sector university located in Topi, KPK, established in 1993. Widely considered one of Pakistan\'s top engineering institutions, GIK offers programs in Electrical, Mechanical, Computer Systems, and Industrial Engineering. It is known for its residential campus, strong alumni network, and research culture.',
  },
  {
    match: 'itu',
    description:
      'Information Technology University (ITU) Punjab is a specialized public university established in 2012 by the Government of Punjab. Located in Lahore, ITU focuses on IT, Computer Science, Electrical Engineering, and Management. It emphasizes innovation, entrepreneurship, and technology-driven education with a strong research culture.',
  },
  {
    match: 'szabist',
    description:
      'Shaheed Zulfikar Ali Bhutto Institute of Science and Technology (SZABIST) is a leading private university in Pakistan, established in 1995. With campuses in Karachi, Islamabad, Larkana, Hyderabad, and Dubai, SZABIST offers programs in Computing, Management, Media Sciences, Engineering, and Law, and is recognized for high academic standards and graduate employability.',
  },
  {
    match: 'iqra',
    description:
      'Iqra University is a well-established private university in Pakistan with campuses in Karachi and Islamabad, founded in 1998. It offers programs in Business Administration, Computer Science, Accounting & Finance, and Media Studies. Known for its industry-oriented approach, Iqra produces graduates well-prepared for Pakistan\'s corporate sector.',
  },
  {
    match: 'superior',
    description:
      'Superior University is one of the largest private universities in Lahore, offering programs in Business Administration, Computer Science, Engineering, Education, and Law. Known for its vast campus, affordable education, and industry linkages, Superior University serves thousands of students from across Punjab.',
  },
  {
    match: 'ucp',
    description:
      'University of Central Punjab (UCP) is a leading private university in Lahore, established in 2002. It offers programs in Business, Computer Science, Engineering, Law, Pharmacy, and Health Sciences. UCP is known for its modern facilities, entrepreneurship programs, and strong academic quality endorsed by HEC.',
  },
  {
    match: 'uol',
    description:
      'University of Lahore (UOL) is one of Pakistan\'s largest private universities, established in 1999. With multiple campuses and a wide range of programs in Medical Sciences, Engineering, Management, Arts & Social Sciences, and IT, UOL is known for its diverse student community and extensive healthcare education.',
  },
  {
    match: 'riphah',
    description:
      'Riphah International University is a private university established in 2002, with campuses across Islamabad, Lahore, Faisalabad, and other cities. It offers programs in Medical & Health Sciences, Engineering, Computer Science, Business, and Islamic Studies. Riphah is known for integrating Islamic values into modern education.',
  },
  {
    match: 'nu',
    description:
      'National University of Modern Languages (NUML) is a public sector university established in 1969, primarily in Islamabad. Renowned for language studies, NUML offers programs in English, Arabic, Chinese, French, German, and other languages alongside Business Administration and IT. It has campuses across Pakistan.',
  },
];

export async function GET() {
  try {
    const universities = await queryMany(
      'SELECT id, name, description FROM universities ORDER BY name',
      []
    );

    const results = [];

    for (const uni of universities) {
      const nameLower = uni.name.toLowerCase();
      const match = DESCRIPTIONS.find((d) => nameLower.includes(d.match));

      if (!match) {
        results.push({ name: uni.name, status: 'no_match_skipped' });
        continue;
      }

      // Skip if description is already clean (not a raw scrape dump).
      // Heuristic: raw scrapes contain "menu", "Home", "Admissions" in nav-text style.
      const isRaw =
        !uni.description ||
        /\b(menu|Home|Admissions|Research|Library|News)\b/.test(uni.description) ||
        uni.description.length < 30;

      if (!isRaw) {
        results.push({ name: uni.name, status: 'already_clean_skipped' });
        continue;
      }

      await query(
        'UPDATE universities SET description = $1, updated_at = NOW() WHERE id = $2',
        [match.description, uni.id]
      );
      results.push({ name: uni.name, status: 'updated', description: match.description });
    }

    const updated = results.filter((r) => r.status === 'updated').length;
    const skipped = results.length - updated;

    return NextResponse.json({
      message: `Done. ${updated} updated, ${skipped} skipped.`,
      results,
    });
  } catch (err) {
    console.error('GET /api/admin/seed-descriptions error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const runtime = 'nodejs';
