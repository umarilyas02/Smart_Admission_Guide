"""Extract university location + fee-structure links separately.

A focused companion to auto_post_clean_data.py. Where that script processes the
full admission pipeline (dates, programs, events), this one deals ONLY with two
fields: `location` and `fee_structure_url`. Run it when you want to refresh just
those — e.g. after editing the worker's location/feeUrl config — without
re-touching admission events or program lists.

It reads the same raw data.json the worker produces, prefers the worker-emitted
`location` / `fee_structure_url` fields, and falls back to recovering them from
`content`. Results are POSTed with replace=false so existing events/programs are
left untouched (the API COALESCEs these fields onto the existing row).

Usage:
    python scripts/scrape_locations_fees.py            # extract + post
    python scripts/scrape_locations_fees.py --dry-run  # extract + print only

Env:
    TARGET_URL   API endpoint (default: production /api/universities)
"""

import json
import os
import sys

# Windows consoles default to cp1252 and choke on the emoji below when the
# script is run directly. Force UTF-8 so CLI use matches the piped (server) path.
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

try:
    import requests
except ImportError:
    print('Missing dependency: requests. Install with: pip install requests')
    sys.exit(1)

# Reuse the exact extraction logic from the main pipeline so the two scripts
# never drift apart.
from auto_post_clean_data import (
    extract_location_from_content,
    extract_fee_url_from_content,
)

TARGET_URL = os.environ.get(
    'TARGET_URL', 'https://smart-admission-guide.vercel.app/api/universities'
)


def extract(input_path='data.json'):
    """Return a list of {university_name, location, fee_structure_url} rows."""
    try:
        with open(input_path, 'r', encoding='utf-8') as fh:
            raw = json.load(fh)
    except FileNotFoundError:
        print(f"ERROR: cannot find '{input_path}'.")
        return None
    except json.JSONDecodeError:
        print(f"ERROR: '{input_path}' is not valid JSON.")
        return None

    rows = []
    for item in raw.get('results', []):
        name = item.get('university', 'Unknown')
        content = str(item.get('content', ''))

        location = str(item.get('location', '')).strip()
        if not location:
            location = extract_location_from_content(name, content)

        fee_url = str(item.get('fee_structure_url', '')).strip()
        if not fee_url:
            fee_url = extract_fee_url_from_content(content)

        rows.append({
            'university_name': name,
            'location': location,
            'fee_structure_url': fee_url,
        })
    return rows


def main():
    dry_run = '--dry-run' in sys.argv

    rows = extract()
    if rows is None:
        sys.exit(1)

    print(f"Extracted location/fee data for {len(rows)} universities:\n")
    print('=' * 80)
    with_loc = with_fee = 0
    for r in rows:
        loc = r['location'] or '—'
        fee = r['fee_structure_url'] or '—'
        if r['location']:
            with_loc += 1
        if r['fee_structure_url']:
            with_fee += 1
        print(f"  {r['university_name']}")
        print(f"    📍 {loc}")
        print(f"    💰 {fee}")
    print('=' * 80)
    print(f"📍 Locations: {with_loc}/{len(rows)}   💰 Fee links: {with_fee}/{len(rows)}\n")

    if dry_run:
        print('Dry run — nothing posted.')
        return

    # replace=false → API updates location + fee_structure_url via COALESCE and
    # leaves admission events / programs intact.
    payload = {'replace': False, 'data': rows}
    try:
        print(f"📤 Posting location/fee updates to {TARGET_URL} ...")
        resp = requests.post(TARGET_URL, json=payload, timeout=30)
    except requests.RequestException as e:
        print('❌ POST failed:', str(e))
        sys.exit(1)

    if 200 <= resp.status_code < 300:
        print(f"✅ POST succeeded (HTTP {resp.status_code}).")
    else:
        print(f"❌ POST failed (HTTP {resp.status_code}).")
        try:
            print('Response:', resp.json())
        except Exception:
            print('Response:', resp.text)
        sys.exit(1)


if __name__ == '__main__':
    main()
