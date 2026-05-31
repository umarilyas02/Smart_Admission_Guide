# Universities API Guide

This guide covers the `/api/universities` endpoint for ingesting and retrieving university admission data.

## Quick Start

### 1. Apply Database Schema

```bash
npm run db:migrate
```

This creates required tables (`universities`, `university_events`, `programs`) and establishes relationships.

### 2. Deduplicate Existing Data (if needed)

If you have duplicate university entries in the database:

```bash
node scripts/dedupe-universities.js
```

This script:
- Finds duplicate university names
- Merges them (keeps the lowest ID)
- Updates all references (programs, scholarships, events) to point to the kept ID
- Deletes duplicate rows
- Creates a unique index on `universities.name`

### 3. Ingest University Data

```bash
node scripts/post-clean-data.js
```

This POSTs `clean_data.json` to the API and displays the response.

Or manually via PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/universities' `
  -ContentType 'application/json' `
  -InFile '.\clean_data.json'
```

---

## API Endpoints

### POST `/api/universities`

**Ingest university and admission data from JSON.**

If you send `{ "replace": true, "data": [...] }`, the API clears existing university records first, then inserts the new values from the payload. This is the recommended mode when you want the database to reflect only the latest dataset.

#### Request

- **Content-Type:** `application/json`
- **Body:** JSON object or array

**Accepted formats:**

```json
{
  "data": [
    {
      "university_name": "FAST NUCES",
      "event_type": "Combined_Admission_Data",
      "start_date": "May 19, 2026",
      "end_date": "Jul 4, 2026",
      "programs_offered": "Computer Science, Software Engineering, Artificial Intelligence",
      "status": "Upcoming",
      "details": "Admission details..."
    },
    ...
  ]
}
```

Or directly as an array:

```json
[
  {
    "university_name": "UMT Sialkot",
    "event_type": "admission",
    "start_date": "",
    "end_date": "",
    "programs_offered": "Computer Science; Software Engineering; Data Science",
    "status": "Dates Pending",
    "details": "..."
  }
]
```

#### Field Mapping

| Field | Required? | Type | Notes |
|-------|-----------|------|-------|
| `university_name` or `name` | ✓ | string | University name (must not be empty) |
| `event_type` | ✗ | string | Defaults to `"admission"` |
| `start_date` or `start` | ✗ | string | Date format: "May 19, 2026", "2026-05-19", etc. |
| `end_date` or `end` | ✗ | string | Date format (same as start_date) |
| `status` | ✗ | string | E.g., "Upcoming", "Dates Pending", "Closed" |
| `details` | ✗ | string | General description/notes |
| `website` | ✗ | string | University website URL |
| `programs_offered` or `programs` | ✗ | string | Comma or semicolon-separated list |

#### Response (Success)

**Status:** `201 Created`

```json
{
  "inserted_count": 2,
  "inserted": [
    { "universityId": 1, "name": "FAST NUCES" },
    { "universityId": 2, "name": "UMT Sialkot" }
  ]
}
```

#### Replace Mode Example

```json
{
  "replace": true,
  "data": [
    {
      "university_name": "FAST NUCES",
      "event_type": "Combined_Admission_Data",
      "start_date": "May 19, 2026",
      "end_date": "Jul 4, 2026",
      "programs_offered": "Computer Science, Software Engineering",
      "status": "Upcoming",
      "details": "..."
    }
  ]
}
```

#### Response (Error)

**Status:** `400` / `500`

```json
{
  "error": "No university data provided"
}
```

---

### GET `/api/universities`

**Retrieve all universities with their events and programs.**

#### Request

```bash
curl http://localhost:3000/api/universities
```

PowerShell:

```powershell
Invoke-RestMethod 'http://localhost:3000/api/universities' | ConvertTo-Json -Depth 5
```

#### Response

**Status:** `200 OK`

```json
{
  "universities": [
    {
      "id": 1,
      "name": "FAST NUCES",
      "location": null,
      "website": null,
      "description": "Admission Schedule...",
      "created_at": "2026-05-12T10:30:45.123Z",
      "events": [
        {
          "id": 1,
          "event_type": "Combined_Admission_Data",
          "start_date": "2026-05-19",
          "end_date": "2026-07-04",
          "status": "Upcoming",
          "details": "...",
          "created_at": "2026-05-12T10:30:45.123Z"
        }
      ],
      "programs": [
        { "id": 1, "name": "Computer Science" },
        { "id": 2, "name": "Software Engineering" },
        { "id": 3, "name": "Artificial Intelligence" }
      ]
    },
    ...
  ]
}
```

---

## Data Processing

### Validation

All POSTed items are validated:
- University name must not be empty
- Dates must be parseable (e.g., "May 19, 2026", "2026-05-19")
- Field types are checked (strings expected for text fields)

Invalid items are skipped with console warnings.

### Deduplication

- **Universities:** Upserted by name (UPSERT). If a university with the same name exists, it is updated; otherwise, created.
- **Programs:** Case-insensitive duplicate check per university. Multiple spaces normalized to single space.
- **Events:** Skipped if same `event_type` + dates already exist for the university; otherwise updated.

### Date Parsing

Supports multiple date formats:
- "May 19, 2026"
- "2026-05-19"
- "05/19/2026"

Empty strings treated as `NULL`.

---

## Database Schema

### Tables Created

#### `universities`
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(255) UNIQUE)
- `location` (VARCHAR(255))
- `type` (VARCHAR(50))
- `ranking` (INT)
- `website` (VARCHAR(255))
- `description` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `university_events`
- `id` (SERIAL PRIMARY KEY)
- `university_id` (INT, FK → universities)
- `event_type` (VARCHAR(255))
- `start_date` (DATE)
- `end_date` (DATE)
- `status` (VARCHAR(100))
- `details` (TEXT)
- `created_at` (TIMESTAMPTZ)

#### `programs`
- `id` (SERIAL PRIMARY KEY)
- `university_id` (INT, FK → universities)
- `name` (VARCHAR(255))
- `field` (VARCHAR(100))
- `duration` (VARCHAR(50))
- `fee` (DECIMAL(10,2))
- `merit_percentage` (DECIMAL(5,2))
- `description` (TEXT)
- `eligibility` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

## Scripts

### `npm run db:migrate`
Applies `src/lib/schema.sql` to your database via Node (no `psql` required on Windows).

### `node scripts/post-clean-data.js`
POSTs `clean_data.json` from project root to `http://localhost:3000/api/universities` using replace mode so only the newest dataset remains in the DB.

Optional: Set `TARGET_URL` env var to POST to a different endpoint:
```powershell
$env:TARGET_URL='https://example.com/api/universities'
node scripts/post-clean-data.js
```

### `node scripts/dedupe-universities.js`
Safely merges duplicate universities by name, updates all references, and creates a unique index.

---

## Troubleshooting

### "Cannot reach http://localhost:3000"
- Start the dev server: `npm run dev`
- Check if it's listening: `Test-NetConnection -ComputerName localhost -Port 3000`

### "there is no unique or exclusion constraint matching the ON CONFLICT specification"
- Run: `node scripts/dedupe-universities.js`
- Restart dev server: `npm run dev`

### "DATABASE_URL not set"
- Add `DATABASE_URL=postgres://...` to `.env.local`
- Ensure it's a valid PostgreSQL connection string

### "Fetch failed" from `scripts/post-clean-data.js`
- Verify dev server is running and port 3000 is accessible
- Check `src/app/api/universities/route.js` runtime is set to `nodejs`

---

## Example: Complete Workflow

```powershell
# 1. Ensure .env.local has DATABASE_URL
# 2. Apply schema
npm run db:migrate

# 3. Dedupe (if you've run POST multiple times)
node scripts/dedupe-universities.js

# 4. Start dev server (in another terminal)
npm run dev

# 5. POST clean_data.json (replace old university rows)
node scripts/post-clean-data.js

# 6. Fetch and verify
Invoke-RestMethod 'http://localhost:3000/api/universities' | ConvertTo-Json -Depth 5
```

---

## Notes

- The API uses the Node runtime to support PostgreSQL queries.
- All timestamps are UTC (TIMESTAMPTZ).
- Programs are deduplicated case-insensitively per university.
- Empty date fields are stored as NULL.

