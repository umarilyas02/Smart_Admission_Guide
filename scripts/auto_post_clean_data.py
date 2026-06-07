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
date_pattern = r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})"

# 2. Dictionary of target programs
target_programs = [
    "Computer Science",
    "Software Engineering",
    "Artificial Intelligence",
    "Data Science",
    "Cyber Security",
    "Information Technology",
    "Business Analytics",
    "Accounting and Finance",
    "Business Administration",
    "BBA",
    "Civil Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Mathematics",
    "Clinical Psychology",
    "English Literature",
    "Media and Communication",
    "Human Nutrition and Dietetics",
    "Biotechnology"
]

TARGET_URL = os.environ.get('TARGET_URL', 'https://smart-admission-guide.vercel.app/api/universities')
REPLACE = os.environ.get('REPLACE', 'true').lower() in ('1', 'true', 'yes')
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
        found_dates = re.findall(date_pattern, content)
        valid_dates = []

        for month, day in found_dates:
            if is_valid_date(month, day):
                valid_dates.append(f"{month} {day}")
            else:
                # Try local correction first
                corrected_month = correct_month_typo(month)
                if corrected_month and is_valid_date(corrected_month, day):
                    valid_dates.append(f"{corrected_month} {day}")
                    stats['corrected_dates'] += 1
                    print(f"  🔧 Auto-corrected '{month} {day}' → '{corrected_month} {day}' for {university}")
                else:
                    # Try Claude correction as fallback
                    claude_month = correct_month_with_claude(month, day)
                    if claude_month and is_valid_date(claude_month, day):
                        valid_dates.append(f"{claude_month} {day}")
                        stats['claude_corrected'] += 1
                        print(f"  🤖 Claude corrected '{month} {day}' → '{claude_month} {day}' for {university}")
                    else:
                        print(f"  ⚠️  Could not correct date '{month} {day}' for {university}")

        unique_dates = list(dict.fromkeys(valid_dates))

        if len(unique_dates) >= 2:
            start_date = f"{unique_dates[0]}, 2026"
            end_date = f"{unique_dates[1]}, 2026"
        elif len(unique_dates) == 1:
            start_date = f"{unique_dates[0]}, 2026"

        # --- Extract Programs ---
        found_programs = []
        content_lower = content.lower()

        for prog in target_programs:
            if prog.lower() in content_lower:
                found_programs.append(prog)

        programs_string = ", ".join(found_programs) if found_programs else "Program list unavailable"

        # --- Clean Details & Status ---
        clean_details = content[:150].replace('\n', ' ').strip() + "..."

        if not start_date:
            status = "Dates Pending"
            reason = "No valid dates found"
            log_skipped(university, reason)
            print(f"❌ SKIP [{idx}] {university}: {reason}")
            continue

        clean_row = {
            "university_name": university,
            "event_type": category,
            "start_date": start_date,
            "end_date": end_date,
            "programs_offered": programs_string,
            "status": status,
            "details": clean_details
        }

        cleaned_results.append(clean_row)
        stats['saved'] += 1
        print(f"✅ SAVE [{idx}] {university} ({start_date} → {end_date})")

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
    print(f"❌ Items skipped: {stats['skipped']}")
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
            print(f"\n🎉 Data seeding successful!")
            print(f"   Inserted {ic} university record(s).")
            if inserted:
                print('\n📋 Inserted universities:')
                for it in inserted:
                    print(f"   ✓ {it.get('name')} (id={it.get('universityId')})")
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
