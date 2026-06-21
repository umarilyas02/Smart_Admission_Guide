const VALID_MONTHS = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

const FULL_MONTHS = {
  January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
  May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
  September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec',
};

const MON = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
const FULL = 'January|February|March|April|May|June|July|August|September|October|November|December';

const PATTERNS = {
  monDay: new RegExp(`(${MON})\\s+(\\d{1,2})(?=[^0-9a-zA-Z]|$)`, 'g'),
  ordFull: new RegExp(`(\\d{1,2})(?:st|nd|rd|th)\\s+(${FULL})\\b`, 'g'),
  dayMon: new RegExp(`(?<!\\d)(\\d{1,2})\\s+(${MON})\\b`, 'g'),
  dayFull: new RegExp(`(?<!\\d)(\\d{1,2})\\s+(${FULL})\\b`, 'g'),
  fullDay: new RegExp(`(?<!st )(?<!nd )(?<!rd )(?<!th )(${FULL})\\s+(\\d{1,2})(?=[^0-9a-zA-Z]|$)`, 'g'),
};

const DEG_FULL = /\b(Bachelor[s]?)\s+of\s+([A-Za-z][A-Za-z\s&,]{1,50}?)(?:\s*\(([^)]{2,60})\))?(?=\s+(?:Bachelor|BS\b|BBA\b|\d)|[,\n]|\Z)/gi;
const DEG_ABBREV = /\b(BS|BBA|ADP|DPT|MBBS|B\.Sc\.?|B\.Ed\.?|LL\.B\.?|LLB|Pharm\.?-?D\.?|BA|BFA|BArch|BEng)(?:\s*\((?:Hons?\.?|Honours|Engg?\.?)\))?(?:\s*\(([^)]{3,70})\)|\s+([A-Z][A-Za-z][A-Za-z\s&/-]{1,70}))?/gi;
const PROG_SPLIT = /\b(?:BS|BBA|ADP|DPT|Bachelor|MS|M\.?Phil|MPhil|MBA|PhD|Doctor(?:ate)?|Master(?:s)?|Morning|Evening|Afternoon|Self.Supporting|Regular|Replica|Weekend|\d+\s*[Yy]ears?)/i;
const TRAILING_CUTOFF = /\b(?:Faculty\s+of|Department\s+of|Institute\s+of|School\s+of|College\s+of|Centre\s+for|Sub\s+department\s+under|Degree\s+Program\s+Name|Program\s+Name|Undergraduate|Postgraduate|Graduate|Fee\s+Structure|Per\s+Credit\s+Hour\s+Fee|One\s+Time\s+Fee|Admission\s+Fee|Registration\s+Fee|Tuition\s+Fee|Semester\s+\d+|Search\s+Programs|All\s+Programs|Latest\s+News|View\s+Programs|Campus\s+Location|Students\s+Admissions|Knowledge\s+Unit|Years?\b|Year\s+Degree\s+Programs?|Programmes?|Programs?)\b/i;
const NOISY_PROGRAM = /(?:Degree\s+Program\s+Name|Fee\s+Structure|Per\s+Credit\s+Hour\s+Fee|Admission\s+Fee|Registration\s+Fee|Tuition\s+Fee|Search\s+Programs|Latest\s+News|Campus\s+Location|Students\s+Admissions|Qualified\s+List|Scholar|Download|Read\s+More)/i;
const POSTGRAD_PREFIX = /^(?:MS|M\.S\.?|MPhil|M\.Phil\.?|PhD|Ph\.D\.?|MBA|Executive\s+MBA|EMBA|Master(?:s)?\b|Doctor(?:ate)?\b)/i;
const UNDERGRAD_STANDALONE = /^(?:BS|BBA|ADP|DPT|MBBS|B\.Sc\.?|B\.Ed\.?|LL\.B\.?|LLB|Pharm\.?-?D\.?|BA|BFA|BArch|BEng|Bachelor\b)/i;
const KNOWN_CITIES = ['Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Faisalabad', 'Sialkot', 'Multan', 'Peshawar', 'Quetta', 'Chiniot', 'Gujranwala', 'Sargodha', 'Bahawalpur', 'Abbottabad', 'Hyderabad', 'Sukkur', 'Jhelum', 'Taxila', 'Wah', 'Mardan', 'Swat', 'Gujrat', 'Sahiwal'];
const CITY_RE = new RegExp(`\\b(${KNOWN_CITIES.join('|')})\\b`, 'i');
const FEE_URL_RE = /https?:\/\/[^\s"'<>]*fee[^\s"'<>]*/i;
const OPEN_KW = /admission[s]?\s+open|application[s]?\s+open|online\s+admission[s]?\s+open|commencement\s+of\s+admissions?|admission[s]?\s+start|admission[s]?\s+begin|application\s+submission/gi;
const CLOSE_KW = /application[s]?\s+deadline|admission[s]?\s+deadline|online\s+admission\s+deadline|last\s+date|deadline\s+to\s+submit|completion\s+of\s+admission/gi;

function isValidDate(month, day) {
  const n = Number(day);
  return VALID_MONTHS[month] && n >= 1 && n <= 31;
}

function cleanProgram(program) {
  let value = String(program || '').replace(/\s+/g, ' ').trim();
  value = value.replace(/^(?:Graduate|Undergraduate)\s+/i, '');
  value = value.split(TRAILING_CUTOFF)[0];
  value = value.replace(/\(\s*\d+(?:\.\d+)?\s*(?:Years?|Yrs?)\s*\)/gi, '');
  value = value.replace(/\s*\(\s*(?:Morning|Afternoon|Evening|Self[- ]Supporting|Regular|Replica|Weekend)\s*\)/gi, '');
  value = value.replace(/\b(?:Morning|Afternoon|Evening|Self[- ]Supporting|Regular|Replica|Weekend)\b/gi, '');
  value = value.replace(/\b(?:Post|Post-)\b.*$/i, '');
  value = value.replace(/\b\d+(?:\.\d+)?\s*(?:Years?|Yrs?)\b.*$/i, '');
  value = value.replace(/\s+\d+\s*(?:Years?|Yrs?)\b.*$/i, '');
  value = value.replace(/\s+[A-Z]$/g, '');
  value = value.replace(/[()]/g, '');
  value = value.replace(/\s*[-–:|]+\s*$/g, '');
  value = value.replace(/\s{2,}/g, ' ');
  return value.trim().replace(/^[ ,;/-]+|[ ,;/-]+$/g, '');
}

function isValidProgram(program) {
  if (!program || program.length < 3 || program.length > 120) return false;
  if (NOISY_PROGRAM.test(program)) return false;
  if (POSTGRAD_PREFIX.test(program)) return false;
  if (!UNDERGRAD_STANDALONE.test(program)) return false;
  if (/^(?:BS|BA|ADP|B\.Sc\.?|B\.Ed\.?)\s+\d/i.test(program)) return false;
  if (/^(?:BS|BA|ADP|B\.Sc\.?|B\.Ed\.?|Bachelor)$/i.test(program)) return false;
  if (/\d\.?$/.test(program)) return false;
  if (/[(/&:-]$/.test(program)) return false;
  return true;
}

function extractProgramsFromContent(content) {
  const text = String(content || '').replace(/&[a-z#\d]+;/gi, ' ').replace(/\s+/g, ' ');
  const found = new Set();

  for (const match of text.matchAll(DEG_FULL)) {
    const program = cleanProgram(match[0]);
    if (isValidProgram(program)) found.add(program);
  }

  for (const match of text.matchAll(DEG_ABBREV)) {
    const abbrev = match[1];
    const suffix = cleanProgram(match[0].slice(abbrev.length).split(PROG_SPLIT)[0]).trim();
    const full = `${abbrev}${suffix ? ` ${suffix}` : ''}`.trim();
    if (isValidProgram(full)) found.add(full);
  }

  return [...found].sort();
}

function extractLocationFromContent(name, content) {
  const textName = String(name || '');
  const paren = textName.match(/\(([^)]*)\)/);
  if (paren) {
    const city = paren[1].match(CITY_RE);
    if (city) return city[1];
  }
  const fromName = textName.match(CITY_RE);
  if (fromName) return fromName[1];
  const fromContent = String(content || '').match(CITY_RE);
  return fromContent ? fromContent[1] : '';
}

function extractFeeUrlFromContent(content) {
  const match = String(content || '').match(FEE_URL_RE);
  return match ? match[0] : '';
}

function collectMatches(regex, text, mapper) {
  const out = [];
  for (const match of text.matchAll(regex)) {
    const mapped = mapper(match);
    if (mapped) out.push(mapped);
  }
  return out;
}

function extractAllDateHits(content) {
  const text = String(content || '');
  const raw = [
    ...collectMatches(PATTERNS.monDay, text, (m) => isValidDate(m[1], m[2]) ? [m.index, VALID_MONTHS[m[1]], Number(m[2]), `${m[1]} ${m[2]}`] : null),
    ...collectMatches(PATTERNS.ordFull, text, (m) => {
      const ab = FULL_MONTHS[m[2]];
      return ab && isValidDate(ab, m[1]) ? [m.index, VALID_MONTHS[ab], Number(m[1]), `${ab} ${m[1]}`] : null;
    }),
    ...collectMatches(PATTERNS.dayMon, text, (m) => isValidDate(m[2], m[1]) ? [m.index, VALID_MONTHS[m[2]], Number(m[1]), `${m[2]} ${m[1]}`] : null),
    ...collectMatches(PATTERNS.dayFull, text, (m) => {
      const ab = FULL_MONTHS[m[2]];
      return ab && isValidDate(ab, m[1]) ? [m.index, VALID_MONTHS[ab], Number(m[1]), `${ab} ${m[1]}`] : null;
    }),
    ...collectMatches(PATTERNS.fullDay, text, (m) => {
      const ab = FULL_MONTHS[m[1]];
      return ab && isValidDate(ab, m[2]) ? [m.index, VALID_MONTHS[ab], Number(m[2]), `${ab} ${m[2]}`] : null;
    }),
  ];

  const seen = new Map();
  raw.sort((a, b) => a[0] - b[0]).forEach(([pos, monthNum, dayNum, dateStr]) => {
    const key = `${monthNum}-${dayNum}`;
    if (!seen.has(key)) seen.set(key, [pos, dateStr]);
  });
  return seen;
}

function pickAdmissionWindow(seen, content) {
  if (!seen.size) return ['', ''];
  const byPos = [...seen.values()].sort((a, b) => a[0] - b[0]);
  const dateKey = (dateStr) => {
    const [month, day] = dateStr.split(' ');
    return [VALID_MONTHS[month], Number(day)];
  };
  const nearest = (kwPos, maxDist = 150) => {
    let best = null;
    let bestDist = maxDist + 1;
    for (const [pos, dateStr] of byPos) {
      const dist = Math.abs(pos - kwPos);
      if (dist < bestDist) {
        bestDist = dist;
        best = dateStr;
      }
    }
    return bestDist <= maxDist ? best : null;
  };

  let start = null;
  for (const match of String(content || '').matchAll(OPEN_KW)) {
    const candidate = nearest(match.index);
    if (candidate) {
      start = candidate;
      break;
    }
  }

  const chron = [...seen.entries()].sort((a, b) => {
    const [am, ad] = a[0].split('-').map(Number);
    const [bm, bd] = b[0].split('-').map(Number);
    return am - bm || ad - bd;
  }).map(([, [, dateStr]]) => dateStr);

  if (!start) start = chron[0];

  const endCandidates = new Set();
  for (const match of String(content || '').matchAll(CLOSE_KW)) {
    const candidate = nearest(match.index);
    if (!candidate || candidate === start) continue;
    const [cm, cd] = dateKey(candidate);
    const [sm, sd] = dateKey(start);
    if (cm > sm || (cm === sm && cd > sd)) endCandidates.add(candidate);
  }

  let end = null;
  if (endCandidates.size) {
    end = [...endCandidates].sort((a, b) => {
      const [am, ad] = dateKey(a);
      const [bm, bd] = dateKey(b);
      return am - bm || ad - bd;
    }).pop();
  }

  if (!end && chron.length >= 2) {
    const second = chron[1];
    const [sm, sd] = dateKey(start);
    const [em, ed] = dateKey(second);
    const gap = (em - sm) * 30 + (ed - sd);
    if (gap <= 6) {
      for (let i = chron.length - 1; i >= 0; i -= 1) {
        const [cm, cd] = dateKey(chron[i]);
        if (cm > sm || (cm === sm && cd > sd)) {
          end = chron[i];
          break;
        }
      }
    } else {
      end = second;
    }
  }

  return [start || '', end || ''];
}

export function cleanUniversityRows(rawData) {
  const results = Array.isArray(rawData?.results) ? rawData.results : [];
  const cleaned = [];
  const logs = [];
  const summary = {
    total_items: results.length,
    saved: 0,
    undeclared: 0,
    programs_extracted: 0,
    locations_found: 0,
    fee_links_found: 0,
  };

  results.forEach((row, index) => {
    const content = String(row?.content || '');
    const university = row?.university || 'Unknown';
    const category = row?.category || 'Uncategorized';
    const [startStr, endStr] = pickAdmissionWindow(extractAllDateHits(content), content);
    const startDate = startStr ? `${startStr}, 2026` : '';
    const endDate = endStr ? `${endStr}, 2026` : '';
    const programs = extractProgramsFromContent(content);
    const location = String(row?.location || '').trim() || extractLocationFromContent(university, content);
    const feeStructureUrl = String(row?.fee_structure_url || '').trim() || extractFeeUrlFromContent(content);
    const status = startDate ? 'Upcoming' : 'Not Declared';
    const details = `${content.slice(0, 150).replace(/\n/g, ' ').trim()}...`;

    cleaned.push({
      university_name: university,
      event_type: category,
      start_date: startDate,
      end_date: endDate,
      programs_offered: programs,
      location,
      fee_structure_url: feeStructureUrl,
      status,
      details,
    });

    summary.saved += 1;
    summary.programs_extracted += programs.length;
    if (!startDate) summary.undeclared += 1;
    if (location) summary.locations_found += 1;
    if (feeStructureUrl) summary.fee_links_found += 1;

    const dateLabel = startDate ? `${startDate} -> ${endDate || 'TBD'}` : 'dates not declared yet';
    logs.push(`[${index + 1}] Saved ${university} (${dateLabel}) - ${programs.length} programs, ${location || 'no location'}, ${feeStructureUrl ? 'fee link found' : 'no fee link'}`);
  });

  return {
    project: 'Smart Admission Guide',
    pipeline_stage: 'Cleaned and Normalized',
    data: cleaned,
    logs,
    summary,
  };
}
