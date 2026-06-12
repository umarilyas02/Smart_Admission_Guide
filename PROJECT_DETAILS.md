# Project Details — Smart Admission Guide

This document is for anyone who is new to the codebase. It explains what the app does, how every piece connects, what each page is for, how data flows from a university website all the way to the screen, and what to touch when you need to change something.

---

## What the app does (one paragraph)

Smart Admission Guide (SAG) is a web app for Pakistani intermediate students. A student signs up, fills in their matric/FSc marks and interests, and the app shows which universities and programs they are likely to get into. It also shows live admission schedules, fee structure links, and lets the student generate a ready-to-print application pack (admission form, motivation letter, recommendation request) as PDFs. An AI chatbot answers questions about merit, deadlines, and scholarships 24/7.

---

## How the big pieces connect

```
Cloudflare Worker  (runs manually)
        │
        │  returns raw JSON { results: [ { university, content, location, fee_structure_url } ] }
        ▼
  data.json  (saved to disk)
        │
        │  python scripts/auto_post_clean_data.py  (runs manually)
        │  ├─ extract admission dates
        │  ├─ extract programs
        │  ├─ extract / use location
        │  ├─ extract / use fee URL
        │  └─ POST to /api/universities
        ▼
  PostgreSQL (Neon)  ←──────────────────────────────────────────┐
        │                                                         │
        │  Next.js API routes read from DB                        │
        ▼                                                         │
  Browser (React pages)                                          │
        │                                                         │
        └── Admin panel → "Scrape & Sync" button ────────────────┘
             (does both steps above automatically)
```

**Key point:** The Cloudflare Worker is a separate service deployed to Cloudflare. It is NOT triggered automatically. You (or the Admin panel button) must call it manually to get fresh data.

---

## Page-by-page reference

### Public pages (no login needed)

| URL | File | What it does |
|---|---|---|
| `/` | `src/app/page.js` | Homepage. Hero section, stats strip, how-it-works steps, tool cards, chatbot callout. |
| `/about` | `src/app/about/page.js` | About the project. |
| `/universities` | `src/app/universities/page.js` | Browse all universities. Filter by city, program, fee range. Search by name. |
| `/universities/[id]` | `src/app/universities/[id]/page.js` | Detail page for one university — location, fee structure link, admission events, all programs. |
| `/quiz` | `src/app/quiz/page.js` | Career aptitude quiz. Asks questions and recommends programs. |

### Auth pages

| URL | File | What it does |
|---|---|---|
| `/auth` | `src/app/auth/page.js` | Login and register (toggled by `?mode=login` or `?mode=register`). Also has Google sign-in. |
| `/auth/forgot-password` | `src/app/auth/forgot-password/page.js` | Request a password reset email. |
| `/auth/reset-password` | `src/app/auth/reset-password/page.js` | Set a new password via the link emailed to the user. |

### Student dashboard (login required)

| URL | File | What it does |
|---|---|---|
| `/dashboard` | `src/app/dashboard/page.js` | Welcome screen, profile completion %, shortcut cards, latest notifications. |
| `/dashboard/profile-progress` | `src/app/dashboard/profile-progress/page.js` | Fill in personal info, matric/FSc marks, test score, interests. |
| `/dashboard/notifications` | `src/app/dashboard/notifications/page.js` | Inbox — mark read, delete. |
| `/academic-background` | `src/app/academic-background/page.js` | Academic info entry (also accessible from dashboard). |
| `/admission-probability` | `src/app/admission-probability/page.js` | Enter marks → see probability of admission to specific programs. |
| `/application-pack` | `src/app/application-pack/page.js` | Fill one form → download admission form, motivation letter, and recommendation request as PDFs. |

### Admin panel (admin role required)

Only users with `role = 'admin'` in the database can access these. Everyone else gets redirected.

| URL | File | What it does |
|---|---|---|
| `/admin` | `src/app/admin/page.js` | Stats (students, universities, programs, chatbot queries) + **Scrape & Sync** button. |
| `/admin/universities` | `src/app/admin/universities/page.js` | List, add, edit, delete universities. |
| `/admin/programs` | `src/app/admin/programs/page.js` | List, add, edit, delete programs. |
| `/admin/students` | `src/app/admin/students/page.js` | View all registered students and their profiles. |
| `/admin/entry-tests` | `src/app/admin/entry-tests/page.js` | Manage entry test definitions (HAT, ECAT, MCAT, etc.). |
| `/admin/notifications` | `src/app/admin/notifications/page.js` | Send notifications to all users or specific users. |
| `/admin/chatbot-queries` | `src/app/admin/chatbot-queries/page.js` | See every question users have asked the AI chatbot. |
| `/admin/settings` | `src/app/admin/settings/page.js` | Admin-level settings. |

---

## API routes reference

Every file under `src/app/api/` is a Next.js route handler. They are called by the frontend pages and by the Python scripts.

### Auth

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Login → returns JWT |
| `/api/auth/google` | POST | Google OAuth login/register |
| `/api/auth/forgot-password` | POST | Send reset email |
| `/api/auth/reset-password` | POST | Set new password |

### Universities

| Route | Method | Purpose |
|---|---|---|
| `/api/universities` | GET | List all universities with events + programs |
| `/api/universities` | POST | Upsert universities (used by Python pipeline) |
| `/api/universities/search` | GET | Search by name / location |
| `/api/universities/[id]/programs` | GET | Get one university + its programs + events |
| `/api/universities/[id]` | DELETE | Remove a university |

### Student profile

| Route | Method | Purpose |
|---|---|---|
| `/api/profile` | GET | Get logged-in user + student record |
| `/api/profile` | PUT | Update profile |

### Admin

| Route | Method | Purpose |
|---|---|---|
| `/api/admin/stats` | GET | Totals for dashboard stats cards |
| `/api/admin/students` | GET | All students |
| `/api/admin/programs` | GET / POST / DELETE | Manage programs |
| `/api/admin/entry-tests` | GET / POST / DELETE | Manage entry tests |
| `/api/admin/notifications` | POST | Send a notification |

### Other

| Route | Method | Purpose |
|---|---|---|
| `/api/chatbot` | POST | Ask the AI chatbot a question |
| `/api/chatbot/logs` | GET | Admin: view all chatbot queries |
| `/api/quiz/recommend` | POST | Get program recommendations from quiz answers |
| `/api/documents/generate` | POST | Generate PDF documents |
| `/api/notifications` | GET | Get user's notifications |
| `/api/notifications/[id]` | PATCH / DELETE | Mark read / delete |
| `/api/notifications/read-all` | PATCH | Mark all as read |
| `/api/reminders/send` | POST | Cron-triggered reminder emails |
| `/api/admission-form/schema` | GET | Admission form field definitions |
| `/api/admission-form` | POST | Submit admission form |
| `/api/health/db` | GET | Check database connection is alive |

---

## The data pipeline in detail

This is the part that keeps university data fresh. Read this carefully before touching the scraper or Python scripts.

### Where the data lives

Everything lives in `data.json` (raw) → `clean_data.json` (processed) → PostgreSQL (live).

```
Cloudflare Worker
  visits: nu.edu.pk, lums.edu.pk, umt.edu.pk, etc.
  strips: all HTML tags, nav, footer, scripts
  returns: { university, category, location, fee_structure_url, content }
  writes to: data.json  (via the Node.js scrape action)

Python pipeline (auto_post_clean_data.py)
  reads: data.json
  extracts: dates, programs, location (fallback), fee URL (fallback)
  writes: clean_data.json
  posts to: POST /api/universities

API route (/api/universities POST)
  upserts: universities table (name, location, fee_structure_url, description)
  upserts: university_events table (start_date, end_date, status)
  inserts new: programs table (name)
```

### How to add a new university to the scraper

Open `scripts/cloudflare-worker.js` and add an entry to the `targets` array:

```js
{
  name: "University of Lahore (UOL)",
  location: "Lahore",
  feeUrl: "https://uol.edu.pk/admissions/fee-structure",
  urls: [
    "https://uol.edu.pk/admissions/",
    "https://uol.edu.pk/programs/",
    "https://uol.edu.pk/admissions/fee-structure"
  ]
}
```

Rules:
- `name` must be unique and consistent — it is the primary key the database uses to match existing records.
- `location` is the campus city (plain string, e.g. `"Lahore"`).
- `feeUrl` is the canonical fee page URL, or `null` if there isn't one.
- `urls` is the list of pages to scrape and combine into one `content` block. Include the fee page here too so its text gets indexed.

Then **redeploy the worker** to Cloudflare and run a scrape.

### How the Python script finds admission dates

Regex patterns search the raw `content` text for date formats like:
- `May 20`, `20 May`, `20th May`, `May 20th`
- Full month names: `20 September`, `September 20`

Keywords like "Admission open", "Application submission", "Last date", "Deadline" are used to decide which dates are start vs. end dates.

If a month is garbled (e.g. OCR artifact `"Fee 27"` instead of `"Feb 27"`), a local typo map corrects it first. If still not recognised, Claude Haiku corrects it (requires `ANTHROPIC_API_KEY` in env).

Universities where no dates are found are **not skipped** — they are saved with `status = "Not Declared"` and empty date fields.

### How to run a manual scrape

**Option A — from the Admin panel (easiest):**

1. Log in as admin → go to `/admin`
2. Click **Scrape & Sync Data**
3. Wait. The button shows a spinner. The output log appears below when done.

**Option B — from the terminal:**

```bash
# 1. Fetch fresh data from the worker
curl https://your-worker.workers.dev > data.json

# 2. Clean and post to local dev DB
python scripts/auto_post_clean_data.py
```

The `TARGET_URL` defaults to the production Vercel URL. To post to your local dev server instead:

```bash
TARGET_URL=http://localhost:3000/api/universities python scripts/auto_post_clean_data.py
```

---

## Components

These are reusable React components in `src/components/`:

| Component | Used on | What it renders |
|---|---|---|
| `Navbar.js` | Every page | Top navigation bar. Shows different links for logged-in vs. logged-out users. |
| `Footer.js` | Every page | Bottom footer with links. |
| `ChatbotWidget.js` | Every page | Floating chat bubble in the bottom-right corner. Opens the AI chatbot. |
| `HeroSection.js` | Homepage | Big hero area with title, subtitle, and two CTA buttons. |
| `DashboardLayout.js` | Dashboard pages | Wraps dashboard pages with sidebar / layout chrome. |
| `AdminLayout.js` | Admin pages | Wraps admin pages with the admin sidebar and header. |
| `Loader.js` | Various | Spinning loader for loading states. |
| `PasswordInput.js` | Auth pages | Password field with show/hide toggle. |
| `Card.js` | Various | Generic card wrapper. |

---

## Library files (`src/lib/`)

These are not React components — they are pure utilities used by API routes.

| File | Purpose |
|---|---|
| `db.js` | Three functions: `query(sql, params)`, `queryOne(sql, params)`, `queryMany(sql, params)`. All talk to the Neon PostgreSQL database using `pg`. |
| `auth.js` | `hashPassword`, `comparePassword` (bcrypt), `generateToken`, `verifyToken` (JWT). |
| `schema.sql` | The **source of truth** for the database structure. Run `node scripts/apply-schema.js` to apply it. |
| `email.js` | Nodemailer transporter setup for sending password reset emails via Gmail SMTP. |
| `pdf-generator.js` | PDFKit helpers that turn form data into a downloadable PDF document. |
| `admission-form-schema.js` | Field definitions for the admission form (used by both frontend and API). |

---

## How authentication works

1. User registers or logs in → API returns a JWT.
2. JWT is stored in `localStorage` as `auth_token`.
3. Every protected API call sends the token as `Authorization: Bearer <token>`.
4. API routes call `verifyToken(token)` from `src/lib/auth.js` to get `{ userId, email }`.
5. Token expires after 24 hours.

Admin check: API routes for `/api/admin/*` additionally check that the user's `role` column equals `'admin'`.

To promote a user to admin:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

---

## How to make common changes

### Add a new page

1. Create `src/app/your-page/page.js`
2. Add `"use client";` at the top if it needs browser APIs or state
3. Link to it from the Navbar or wherever makes sense

### Add a new API route

1. Create `src/app/api/your-route/route.js`
2. Export named functions `GET`, `POST`, `PUT`, `PATCH`, or `DELETE`
3. For dynamic routes (e.g. `/api/things/[id]`), always `await params` before reading from it:
   ```js
   export async function GET(req, { params }) {
     const { id } = await params; // must await in Next.js 15+
   }
   ```

### Add a new database column

1. Add the column to the relevant `CREATE TABLE` block in `src/lib/schema.sql`
2. Also add an `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` line below it (so already-deployed databases pick it up without a full re-run)
3. Run `node scripts/apply-schema.js`
4. Update the relevant API routes to read/write the new column

### Add a new university manually (without re-scraping)

Hit the API directly:

```bash
curl -X POST http://localhost:3000/api/universities \
  -H "Content-Type: application/json" \
  -d '{
    "replace": false,
    "data": [{
      "university_name": "University of Lahore (UOL)",
      "location": "Lahore",
      "fee_structure_url": "https://uol.edu.pk/fee",
      "event_type": "Undergraduate Admission",
      "start_date": "Jul 1, 2026",
      "end_date": "Aug 15, 2026",
      "status": "Upcoming",
      "programs_offered": ["BS Computer Science", "BS Software Engineering"]
    }]
  }'
```

### Change what the scraper extracts

Edit `scripts/cloudflare-worker.js`:
- Add/remove URLs in a university's `urls` array
- Change `location` or `feeUrl`
- Add a new university object to `targets`

Then redeploy to Cloudflare (`wrangler deploy`) and run a fresh scrape.

### Change how dates / programs are extracted

Edit `scripts/auto_post_clean_data.py`:
- Date patterns: `pat_mon_day`, `pat_ord_full`, etc. (top of file)
- Program regex: `_DEG_FULL`, `_DEG_ABBREV`
- Date keyword matching: `OPEN_KW`, `CLOSE_KW`
- Location city list: `_KNOWN_CITIES`

---

## Environment variables quick reference

| Variable | Where used | Required? |
|---|---|---|
| `DATABASE_URL` | All API routes, `apply-schema.js` | Yes |
| `JWT_SECRET` | Login, token verification | Yes |
| `GOOGLE_CLIENT_ID` | Google sign-in API route | No |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google sign-in frontend button | No |
| `CLAUDE_API_KEY` | Chatbot API route | Yes (chatbot won't work without it) |
| `CLAUDE_MODEL` | Chatbot API route | Yes (defaults to Haiku) |
| `ANTHROPIC_API_KEY` | Python pipeline (date correction) | No (pipeline works without it) |
| `SMTP_HOST` / `SMTP_PORT` / `EMAIL_MAIL` / `SMTP_PASS` | Password reset emails | No (reset won't work without it) |
| `NEXT_PUBLIC_APP_URL` | Reset email links, scrape action | Yes |
| `CLOUDFLARE_WORKER_URL` | Admin scrape button | Yes (scraper won't work without it) |
| `REMINDER_SECRET` | `/api/reminders/send` cron protection | No |

---

## Folder structure at a glance

```
src/app/          → pages and API routes (Next.js App Router)
src/components/   → shared React UI components
src/lib/          → server-side utilities (db, auth, email, pdf)
scripts/          → data pipeline (Cloudflare worker + Python scripts)
public/           → static assets
```

Everything under `src/app/api/` is server-side only — never runs in the browser.
Everything under `src/app/(pages)/` is a React page — runs in the browser (add `"use client"` when you need state or browser APIs).

---

## Gotchas to know upfront

1. **`await params` in dynamic API routes** — Next.js 16 makes route params async. Always write `const { id } = await params;` not `const { id } = params;`. Forgetting this gives a silent 404.

2. **data.json is not committed** — It is a generated file. Never commit it. If it's missing, run a scrape.

3. **REPLACE=true wipes all data** — The Python pipeline accepts `REPLACE=true` to delete and re-seed everything. Don't use this casually. The default (`false`) upserts by university name and is safe.

4. **University names are the primary key** — The API matches existing records by name (case-insensitive). If you rename a university in the worker config without updating existing DB records, it will create a duplicate.

5. **Fee URLs come from the worker config, not the scraped text** — The worker strips `<a href>` tags, so links in HTML never survive into `content`. Fee URLs must be declared explicitly in `scripts/cloudflare-worker.js`.

6. **Admin role is set in the DB** — There is no "Make Admin" button in the UI. You must run an `UPDATE users SET role = 'admin'` query directly.
