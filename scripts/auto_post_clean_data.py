import json
import re
import os
import sys

try:
    import requests
except ImportError:
    print('Missing dependency: requests. Install with: pip install requests')
    sys.exit(1)

# 1. Regex Pattern for Dates
date_pattern = r"([A-Z][a-z]{2}\s\d{1,2})"

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

    print('Cleaning dates and matching programs...')
    for row in results_array:
        content = str(row.get('content', ''))
        university = row.get('university', 'Unknown')
        category = row.get('category', 'Uncategorized')

        start_date = ""
        end_date = ""
        status = "Upcoming"

        # --- Extract Dates ---
        found_dates = re.findall(date_pattern, content)
        unique_dates = list(dict.fromkeys(found_dates))

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

    final_output = {
        "project": "Smart Admission Guide",
        "pipeline_stage": "Cleaned and Normalized",
        "data": cleaned_results
    }

    # Save to a new JSON file
    with open(output_path, 'w', encoding='utf-8') as outfile:
        json.dump(final_output, outfile, indent=4)

    print(f"Success! Clean data exported to {output_path} ({len(cleaned_results)} records)")

    # POST to the API
    payload = {"replace": REPLACE, "data": cleaned_results}
    try:
        print(f"Posting to {TARGET_URL} (replace={REPLACE})...")
        resp = requests.post(TARGET_URL, json=payload, timeout=30)
    except requests.RequestException as e:
        print('POST failed: network error or timeout')
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
        print(f"POST succeeded (HTTP {status}).")
        if isinstance(text, dict) and 'inserted_count' in text:
            ic = text.get('inserted_count')
            inserted = text.get('inserted') or []
            print(f"Data seeding successful: inserted {ic} university record(s).")
            if inserted:
                print('Inserted universities:')
                for it in inserted:
                    print(f" - {it.get('name')} (id={it.get('universityId')})")
        else:
            print('Data seeding successful.')
            print('Response:', text)
        return True
    else:
        # Failure
        print(f"POST failed (HTTP {status}).")
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
