import json
import re
import os
import sys
from datetime import datetime

try:
    import requests
except ImportError:
    print('Missing dependency: requests. Install with: pip install requests')
    sys.exit(1)

try:
    import anthropic
except ImportError:
    anthropic = None

# 1. Regex Pattern for Dates - only match valid month abbreviations
VALID_MONTHS = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
}

FULL_MONTHS = {
    'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr',
    'May': 'May', 'June': 'Jun', 'July': 'Jul', 'August': 'Aug',
    'September': 'Sep', 'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
}

_MON = r'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec'
_FULL = r'January|February|March|April|May|June|July|August|September|October|November|December'
# Pattern 1: "Mon DD" — day must be followed by non-alphanumeric to avoid "Jan 2026" → "Jan 20" and "Aug 1st"
pat_mon_day    = rf'({_MON})\s+(\d{{1,2}})(?=[^0-9a-zA-Z]|$)'
# Pattern 2: "DDth FullMonth" — e.g. "7th April", "23rd June"
pat_ord_full   = rf'(\d{{1,2}})(?:st|nd|rd|th)\s+({_FULL})\b'
# Pattern 3: "DD Mon" — e.g. "31 May", "24 Jul"
pat_day_mon    = rf'(?<!\d)(\d{{1,2}})\s+({_MON})\b'
# Pattern 4: "DD FullMonth" (no ordinal) — e.g. "14 June", "09 August"
pat_day_full   = rf'(?<!\d)(\d{{1,2}})\s+({_FULL})\b'
# Pattern 5: "FullMonth DD" — e.g. "June 05", "January 27"
# Negative lookbehinds prevent matching when month follows an ordinal ("7th April 2 ..." → "April" skipped)
pat_full_day   = rf'(?<!st )(?<!nd )(?<!rd )(?<!th )({_FULL})\s+(\d{{1,2}})(?=[^0-9a-zA-Z]|$)'

# 2. Program extraction — regex-based, no hardcoded list

# Full degree name — Bachelor only ("Bachelor of Science (CS)", "Bachelor of Engineering")
_DEG_FULL = re.compile(
    r'\b(Bachelor[s]?)\s+of\s+([A-Za-z][A-Za-z\s&,]{1,50}?)(?:\s*\(([^)]{2,60})\))?'
    r'(?=\s+(?:Bachelor|BS\b|BBA\b|\d)|[,\n]|\Z)',
    re.IGNORECASE
)
# Abbreviated form — Bachelor-level degrees only; Masters/PhD excluded
_DEG_ABBREV = re.compile(
    r'\b(BS|BBA|ADP|DPT|MBBS|B\.Sc\.?|B\.Ed\.?|LL\.B\.?|LLB|Pharm\.?-?D\.?|BA|BFA|BArch|BEng)'
    r'(?:\s*\((?:Hons?\.?|Honours|Engg?\.?)\))?'
    r'(?:\s*\(([^)]{3,70})\)|\s+([A-Z][A-Za-z][A-Za-z\s&/-]{1,70}))?',
    re.IGNORECASE
)
# Anything that marks the start of a new program or irrelevant section
_PROG_SPLIT = re.compile(
    r'\b(?:BS|BBA|ADP|DPT|Bachelor|'
    r'Morning|Evening|Afternoon|Self.Supporting|Regular|Replica|Weekend|'
    r'\d+\s*[Yy]ears?)',
    re.IGNORECASE
)


def _clean_prog(prog):
    prog = re.sub(
        r'\s*\(\s*(?:Morning|Afternoon|Evening|Self[- ]Supporting|Regular|Replica|Weekend)\s*\)',
        '', prog, flags=re.IGNORECASE
    )
    prog = re.sub(r'\s+\d+\s*(?:Years?|Yrs?)\b.*$', '', prog, flags=re.IGNORECASE)
    return prog.strip(' ,;/-')


def extract_programs_from_content(content):
    """Extract degree program names directly from raw content."""
    text = re.sub(r'&[a-z#\d]+;', ' ', content)
    text = re.sub(r'\s+', ' ', text)
    found = set()

    # Full names: "Bachelor of Science (Computer Science)", "Doctor of Philosophy (CS)"
    for m in _DEG_FULL.finditer(text):
        found.add(_clean_prog(m.group(0)))

    # Abbreviated: "BS Computer Science", "BS (CS)", "BA (Honours) English"
    for m in _DEG_ABBREV.finditer(text):
        abbrev = m.group(1)
        suffix = m.group(0)[len(abbrev):]           # everything after the abbreviation
        suffix = _PROG_SPLIT.split(suffix, 1)[0]    # cut at next degree keyword
        suffix = _clean_prog(suffix).strip()
        full = f"{abbrev} {suffix}".strip() if suffix else abbrev
        if len(full) >= 3:
            found.add(full)

    return sorted(p for p in found if 3 <= len(p) <= 120)


# 3. Location + fee-structure-link extraction
#
# The worker emits `location` and `fee_structure_url` directly (preferred).
# These fallbacks recover them from raw `content` when an older worker payload
# is replayed, so the pipeline degrades gracefully instead of dropping fields.

# Known campus cities — used to recover a location from the university name or
# free text when the worker didn't provide one.
_KNOWN_CITIES = [
    'Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Faisalabad', 'Sialkot',
    'Multan', 'Peshawar', 'Quetta', 'Chiniot', 'Gujranwala', 'Sargodha',
    'Bahawalpur', 'Abbottabad', 'Hyderabad', 'Sukkur', 'Jhelum', 'Taxila',
    'Wah', 'Mardan', 'Swat', 'Gujrat', 'Sahiwal',
]
_CITY_RE = re.compile(r'\b(' + '|'.join(_KNOWN_CITIES) + r')\b', re.IGNORECASE)

# A fee page mentioned as a bare URL inside the text (rare — most live in
# stripped <a href> markup, hence the worker passes the link explicitly).
_FEE_URL_RE = re.compile(
    r'https?://[^\s"\'<>]*fee[^\s"\'<>]*', re.IGNORECASE
)


def extract_location_from_content(name, content):
    """Best-effort campus city: prefer the name (esp. its parenthetical campus
    tag like '(Lahore Campus)'), then fall back to the free text."""
    if name:
        # A parenthetical usually names the *actual* campus, which can differ
        # from the institution's headquarters mentioned earlier in the name
        # (e.g. 'COMSATS ... Islamabad (Lahore Campus)' -> Lahore).
        paren = re.search(r'\(([^)]*)\)', name)
        if paren:
            m = _CITY_RE.search(paren.group(1))
            if m:
                return m.group(1).title()
        m = _CITY_RE.search(name)
        if m:
            return m.group(1).title()  # normalise: 'lahore' -> 'Lahore'
    if content:
        m = _CITY_RE.search(content)
        if m:
            return m.group(1).title()
    return ""


def extract_fee_url_from_content(content):
    """Recover a fee-structure URL if one appears as plain text in content."""
    if not content:
        return ""
    m = _FEE_URL_RE.search(content)
    return m.group(0) if m else ""

TARGET_URL = os.environ.get('TARGET_URL', 'https://smart-admission-guide.vercel.app/api/universities')
REPLACE = os.environ.get('REPLACE', 'false').lower() in ('1', 'true', 'yes')
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

# Initialize Claude client (Haiku only - cost-efficient)
claude_client = None
use_claude = False
if anthropic and ANTHROPIC_API_KEY:
    try:
        claude_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        use_claude = True
        print("✓ Claude API enabled (Haiku model)")
    except Exception as e:
        print(f"⚠ Claude API initialization failed: {e}")
        use_claude = False

# Logging tracking
stats = {
    'total_items': 0,
    'saved': 0,
    'skipped': 0,
    'corrected_dates': 0,
    'claude_corrected': 0,
    'programs_extracted': 0,
    'locations_found': 0,
    'fee_links_found': 0,
    'undeclared': 0,
    'skipped_reasons': {},
}

def log_skipped(university, reason):
    stats['skipped'] += 1
    if reason not in stats['skipped_reasons']:
        stats['skipped_reasons'][reason] = []
    stats['skipped_reasons'][reason].append(university)

def is_valid_date(month_str, day_str):
    try:
        day = int(day_str)
        if month_str not in VALID_MONTHS:
            return False
        if day < 1 or day > 31:
            return False
        return True
    except (ValueError, TypeError):
        return False

def correct_month_typo(month_str):
    """Attempt to correct common OCR/typo errors in month names"""
    # Common typo mappings based on visual similarity or OCR errors
    typo_map = {
        'Fee': 'Feb',      # F looks like Fe, e looks like second e
        'Feb': 'Feb',      # Already correct
        'Psy': 'Sep',      # P->S, sy->ep
        'Sep': 'Sep',      # Already correct
        'Ocr': 'Oct',      # OCR scanning artifact
        'Oct': 'Oct',      # Already correct
        'Noy': 'Nov',      # Common typo
        'Nov': 'Nov',      # Already correct
        'Oec': 'Dec',      # O looks like D
        'Dec': 'Dec',      # Already correct
        'Msn': 'May',      # M looks like May
        'Mar': 'Mar',      # Already correct
        'Apr': 'Apr',      # Already correct
        'Jor': 'Jun',      # J->J, or->un
        'Jun': 'Jun',      # Already correct
        'Juk': 'Jul',      # K looks like L
        'Jul': 'Jul',      # Already correct
        'Aug': 'Aug',      # Already correct
        'Jan': 'Jan',      # Already correct
    }

    # Try exact match first
    if month_str in typo_map:
        return typo_map[month_str]

    # Try case-insensitive fuzzy matching
    month_lower = month_str.lower()
    for valid_month in VALID_MONTHS.keys():
        if month_lower == valid_month.lower():
            return valid_month

    # Try Levenshtein-like simple heuristic for single character differences
    for valid_month in VALID_MONTHS.keys():
        if len(month_str) == len(valid_month):
            diff_count = sum(1 for a, b in zip(month_str, valid_month) if a.lower() != b.lower())
            if diff_count <= 1:  # 1 character difference
                return valid_month

    return None


def correct_month_with_claude(month_str, day_str):
    """Use Claude Haiku to intelligently correct any malformed date"""
    if not use_claude or not claude_client:
        return None

    try:
        prompt = f"""You are a date correction expert. Someone has scanned or OCR'd a date and got "{month_str} {day_str}".
The "{month_str}" part is likely a typo or OCR error of a month abbreviation (Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec).

Given the malformed text "{month_str}", what is the most likely correct month abbreviation?
Respond with ONLY the 3-letter month abbreviation (Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec) or "INVALID" if impossible.
Do not explain, just respond with the month or INVALID."""

        message = claude_client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=10,
            messages=[{"role": "user", "content": prompt}]
        )

        corrected = message.content[0].text.strip()

        # Validate the response
        if corrected in VALID_MONTHS:
            return corrected
        else:
            return None
    except Exception as e:
        print(f"  ⚠️  Claude correction failed: {e}")
        return None


OPEN_KW = re.compile(
    r'admission[s]?\s+open|application[s]?\s+open|'
    r'online\s+admission[s]?\s+open|commencement\s+of\s+admissions?|'
    r'admission[s]?\s+start|admission[s]?\s+begin|'
    r'application\s+submission',
    re.IGNORECASE
)
CLOSE_KW = re.compile(
    r'application[s]?\s+deadline|admission[s]?\s+deadline|'
    r'online\s+admission\s+deadline|last\s+date|'
    r'deadline\s+to\s+submit|completion\s+of\s+admission',
    re.IGNORECASE
)


def extract_all_date_hits(content):
    """Collect all date matches with text positions; deduplicate by (month, day)."""
    raw = []
    for m in re.finditer(pat_mon_day, content):
        mo, d = m.groups()
        if is_valid_date(mo, d):
            raw.append((m.start(), VALID_MONTHS[mo], int(d), f"{mo} {d}"))
    for m in re.finditer(pat_ord_full, content):
        d, full = m.groups()
        ab = FULL_MONTHS.get(full)
        if ab and is_valid_date(ab, d):
            raw.append((m.start(), VALID_MONTHS[ab], int(d), f"{ab} {d}"))
    for m in re.finditer(pat_day_mon, content):
        d, mo = m.groups()
        if is_valid_date(mo, d):
            raw.append((m.start(), VALID_MONTHS[mo], int(d), f"{mo} {d}"))
    for m in re.finditer(pat_day_full, content):
        d, full = m.groups()
        ab = FULL_MONTHS.get(full)
        if ab and is_valid_date(ab, d):
            raw.append((m.start(), VALID_MONTHS[ab], int(d), f"{ab} {d}"))
    for m in re.finditer(pat_full_day, content):
        full, d = m.groups()
        ab = FULL_MONTHS.get(full)
        if ab and is_valid_date(ab, d):
            raw.append((m.start(), VALID_MONTHS[ab], int(d), f"{ab} {d}"))

    seen = {}
    for pos, mn, dn, ds in sorted(raw, key=lambda x: x[0]):
        if (mn, dn) not in seen:
            seen[(mn, dn)] = (pos, ds)
    return seen  # {(month_num, day_num): (pos, "Mon DD")}


def pick_admission_window(seen, content):
    """Pick (start_str, end_str) using keyword proximity + chronological fallback."""
    if not seen:
        return "", ""

    by_pos = sorted(seen.values(), key=lambda x: x[0])  # [(pos, ds)] by text position

    def nearest(kw_pos, max_dist=150):
        best, bd = None, max_dist + 1
        for pos, ds in by_pos:
            dist = abs(pos - kw_pos)
            if dist < bd:
                bd, best = dist, ds
        return best if bd <= max_dist else None

    def date_key(ds):
        parts = ds.split()
        return (VALID_MONTHS[parts[0]], int(parts[1]))

    # 1. Start: first open-keyword match
    start_str = None
    for m in OPEN_KW.finditer(content):
        d = nearest(m.start())
        if d:
            start_str = d
            break

    # 2. Chronological sorted dates (fallback basis)
    by_date = sorted(seen.items())           # sorted by (month_num, day_num)
    chron = [ds for _, (_, ds) in by_date]  # "Mon DD" strings in month/day order

    if not start_str:
        start_str = chron[0]

    # 3. End: collect ALL close-keyword dates, take the latest
    end_candidates = set()
    for m in CLOSE_KW.finditer(content):
        d = nearest(m.start())
        if d and d != start_str and date_key(d) > date_key(start_str):
            end_candidates.add(d)

    end_str = max(end_candidates, key=date_key) if end_candidates else None

    # 4. Fallback end when no close keywords found
    if not end_str and len(chron) >= 2:
        second = chron[1]
        sk = date_key(start_str)
        ek = date_key(second)
        gap = (ek[0] - sk[0]) * 30 + (ek[1] - sk[1])
        if gap <= 6:
            # Consecutive days — find the last date meaningfully after start
            for ds in reversed(chron):
                if date_key(ds) > sk:
                    end_str = ds
                    break
        else:
            end_str = second

    return start_str or "", end_str or ""


def process_and_post(input_path='data.json', output_path='clean_data.json'):
    print(f"Reading raw {input_path}...")
    try:
        with open(input_path, 'r', encoding='utf-8') as file:
            raw_data = json.load(file)
    except FileNotFoundError:
        print(f"ERROR: I cannot find '{input_path}'. Please make sure it is in the same folder.")
        return False
    except json.JSONDecodeError:
        print(f"ERROR: '{input_path}' is corrupted or not properly formatted.")
        return False

    results_array = raw_data.get('results', [])
    cleaned_results = []

    print(f'\nProcessing {len(results_array)} items from raw data...')
    print('=' * 80)

    for idx, row in enumerate(results_array, 1):
        content = str(row.get('content', ''))
        university = row.get('university', 'Unknown')
        category = row.get('category', 'Uncategorized')
        stats['total_items'] += 1

        start_date = ""
        end_date = ""
        status = "Upcoming"

        # --- Extract Dates ---
        date_seen = extract_all_date_hits(content)
        start_str, end_str = pick_admission_window(date_seen, content)
        if start_str:
            start_date = f"{start_str}, 2026"
        if end_str:
            end_date = f"{end_str}, 2026"

        # --- Extract Programs (sent as an array so names with commas survive) ---
        found_programs = extract_programs_from_content(content)

        # --- Location: prefer the worker-provided field, fall back to text ---
        location = str(row.get('location', '')).strip()
        location_source = 'worker' if location else ''
        if not location:
            location = extract_location_from_content(university, content)
            location_source = 'content' if location else ''

        # --- Fee structure link: prefer worker field, fall back to text ---
        fee_structure_url = str(row.get('fee_structure_url', '')).strip()
        fee_source = 'worker' if fee_structure_url else ''
        if not fee_structure_url:
            fee_structure_url = extract_fee_url_from_content(content)
            fee_source = 'content' if fee_structure_url else ''

        # --- Clean Details & Status ---
        clean_details = content[:150].replace('\n', ' ').strip() + "..."

        # No admission dates parsed — keep the university anyway (flagged) rather
        # than dropping it, so it still shows up listed as "not announced yet".
        if not start_date:
            status = "Not Declared"
            stats['undeclared'] += 1

        clean_row = {
            "university_name": university,
            "event_type": category,
            "start_date": start_date,
            "end_date": end_date,
            "programs_offered": found_programs,
            "location": location,
            "fee_structure_url": fee_structure_url,
            "status": status,
            "details": clean_details
        }

        cleaned_results.append(clean_row)
        stats['saved'] += 1
        stats['programs_extracted'] += len(found_programs)
        if location:
            stats['locations_found'] += 1
        if fee_structure_url:
            stats['fee_links_found'] += 1
        loc_label = location or "no location"
        fee_label = "fee link ✓" if fee_structure_url else "no fee link"
        date_label = f"{start_date} → {end_date}" if start_date else "dates not declared yet"
        print(f"✅ SAVE [{idx}] {university} ({date_label}) — "
              f"{len(found_programs)} program(s), {loc_label}, {fee_label}")

        # Detailed location + fee-structure logs (value + where it came from).
        if location:
            print(f"   📍 Location: {location} (from {location_source})")
        else:
            print("   📍 Location: not found")
        if fee_structure_url:
            print(f"   💰 Fee structure: {fee_structure_url} (from {fee_source})")
        else:
            print("   💰 Fee structure: not available")

    final_output = {
        "project": "Smart Admission Guide",
        "pipeline_stage": "Cleaned and Normalized",
        "data": cleaned_results
    }

    # Save to a new JSON file
    with open(output_path, 'w', encoding='utf-8') as outfile:
        json.dump(final_output, outfile, indent=4)

    print('\n' + '=' * 80)
    print('📊 PROCESSING SUMMARY')
    print('=' * 80)
    print(f"Total items processed: {stats['total_items']}")
    print(f"✅ Items saved: {stats['saved']}")
    print(f"📋 Saved without declared dates: {stats['undeclared']}")
    print(f"❌ Items skipped: {stats['skipped']}")
    print(f"🎓 Total programs extracted: {stats['programs_extracted']}")
    print(f"📍 Locations resolved: {stats['locations_found']}")
    print(f"💰 Fee-structure links captured: {stats['fee_links_found']}")
    if stats['corrected_dates'] > 0:
        print(f"🔧 Dates auto-corrected (local): {stats['corrected_dates']}")
    if stats['claude_corrected'] > 0:
        print(f"🤖 Dates corrected by Claude: {stats['claude_corrected']}")

    if stats['skipped_reasons']:
        print('\nSkipped breakdown:')
        for reason, items in stats['skipped_reasons'].items():
            print(f"  • {reason}: {len(items)} item(s)")
            for item in items:
                print(f"    - {item}")

    print(f"\nClean data exported to {output_path}")
    print('=' * 80 + '\n')

    # POST to the API
    payload = {"replace": REPLACE, "data": cleaned_results}
    try:
        print(f"📤 Posting {len(cleaned_results)} records to {TARGET_URL}")
        print(f"   (replace={REPLACE})...\n")
        resp = requests.post(TARGET_URL, json=payload, timeout=30)
    except requests.RequestException as e:
        print('❌ POST failed: network error or timeout')
        print('Error:', str(e))
        return False

    status = resp.status_code
    text = None
    try:
        text = resp.json()
    except Exception:
        text = resp.text

    if 200 <= status < 300:
        # Success
        print(f"✅ POST succeeded (HTTP {status}).")
        if isinstance(text, dict) and 'inserted_count' in text:
            ic = text.get('inserted_count')
            inserted = text.get('inserted') or []
            summary = text.get('summary') or {}
            print(f"\n🎉 Data seeding successful! {ic} university record(s) processed.\n")
            if inserted:
                print('📋 Per-university breakdown:')
                print('─' * 72)
                for uni in inserted:
                    act    = uni.get('action', 'saved')
                    uname  = uni.get('name', '?')
                    uid    = uni.get('universityId')
                    pi     = uni.get('programs_inserted', 0)
                    ps     = uni.get('programs_skipped', 0)
                    pt     = uni.get('programs_total', 0)
                    pnames = uni.get('programs_inserted_names') or []
                    fc     = uni.get('field_changes') or {}

                    icon = '🆕' if act == 'created' else '✏️ '
                    print(f"\n  {icon} {uname}  (id={uid})  [{act.upper()}]")

                    # --- university fields ---
                    if act == 'updated' and fc:
                        changed  = {f: v for f, v in fc.items() if v.get('changed')}
                        same     = {f: v for f, v in fc.items() if not v.get('changed') and not v.get('skipped')}
                        skipped  = {f: v for f, v in fc.items() if v.get('skipped')}
                        if changed:
                            for f, v in changed.items():
                                old = (str(v.get('from') or 'null'))[:60]
                                new = (str(v.get('to')   or 'null'))[:60]
                                print(f"     ✏️  {f}: {old!r} → {new!r}")
                        if same:
                            print(f"     ✓  unchanged fields: {', '.join(same.keys())}")
                        if skipped:
                            print(f"     —  not sent by scraper: {', '.join(skipped.keys())}")
                    elif act == 'created':
                        print(f"     🆕 all fields written (new record)")

                    # --- programs ---
                    if pi > 0:
                        preview = ', '.join(pnames[:4])
                        more    = f'  …+{len(pnames)-4} more' if len(pnames) > 4 else ''
                        print(f"     ➕ {pi} program(s) added: {preview}{more}")
                    else:
                        print(f"     ✓  no new programs (all {ps} already in DB)")
                    if ps > 0 and pi > 0:
                        print(f"     ✓  {ps} program(s) already existed (unchanged)")
                    print(f"     📚 {pt} total program(s) in DB")

                print('\n' + '─' * 72)
                if 'programs_inserted' in summary:
                    print(f"   Total new programs across all universities: {summary.get('programs_inserted')}")
        else:
            print('Data seeding successful.')
            print('Response:', text)
        print()
        return True
    else:
        # Failure
        print(f"❌ POST failed (HTTP {status}).")
        print('Response body:', text)
        if status >= 500:
            print('Server error. Check the application logs (server-side) for details.')
        elif status == 400:
            print('Bad request. Verify the payload structure and required fields.')
        else:
            print('Unexpected response. Inspect status and body to diagnose.')
        return False


if __name__ == '__main__':
    ok = process_and_post()
    if not ok:
        sys.exit(1)
