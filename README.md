# Smart Admission Guide (SAG)

An AI-powered university admission platform for Pakistani intermediate students. SAG helps students find matching universities, check admission chances, generate application documents, and track deadlines — all in one place.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Database | PostgreSQL via Neon (serverless) |
| Auth | JWT + Google OAuth |
| AI | Claude API (Haiku — chatbot & date correction) |
| PDF | PDFKit |
| Scraper | Cloudflare Worker (deployed separately) |
| Data pipeline | Python 3 (`scripts/auto_post_clean_data.py`) |
| Email | Nodemailer + Gmail SMTP |

---

## Prerequisites

- Node.js 18+
- Python 3.10+ with pip
- A [Neon](https://neon.tech) PostgreSQL database
- A [Cloudflare Workers](https://workers.cloudflare.com) account (for the scraper)

---

## Setup

### 1. Install dependencies

```bash
npm install
pip install -r scripts/requirements.txt
```

### 2. Configure environment

Copy the variables below into `.env.local` at the project root:

```env
# Database (Neon)
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# Auth
JWT_SECRET=your_jwt_secret_here

# Google OAuth (optional — for "Sign in with Google")
GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Claude API (for chatbot + date correction)
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_API_KEY=sk-ant-...   # used by the Python pipeline

# Email (Gmail SMTP — for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_MAIL=your@gmail.com
SMTP_PASS=your_app_password

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cloudflare Worker URL (scraper endpoint)
CLOUDFLARE_WORKER_URL=https://your-worker.workers.dev

# Reminder job secret
REMINDER_SECRET=any-secret-string
```

### 3. Apply database schema

```bash
node scripts/apply-schema.js
```

This is safe to re-run — all statements use `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Data Pipeline — How University Data Gets In

The Cloudflare Worker and the Next.js app are **not automatically linked**. Data is loaded manually in two steps:

### Step 1 — Run the Cloudflare Worker

The worker (`scripts/cloudflare-worker.js`) is deployed to Cloudflare Workers. It visits each university's website, strips the HTML, and returns structured JSON. **It must be deployed and triggered manually** — it does not run on a schedule.

To fetch fresh data, hit the worker URL (or use the Admin → Scrape & Sync button in the app):

```bash
curl https://your-worker.workers.dev > data.json
```

The Admin panel button does this automatically: it calls `CLOUDFLARE_WORKER_URL`, saves `data.json`, then immediately runs the Python script.

### Step 2 — Run the Python cleaning script

```bash
python scripts/auto_post_clean_data.py
```

This reads `data.json` and extracts:
- Admission dates (regex + optional Claude correction for OCR typos)
- Programs offered
- Campus location
- Fee structure URL

Then POSTs the cleaned records to `POST /api/universities`, which upserts them into the database.

To refresh **only** location and fee-structure links without touching events or programs:

```bash
python scripts/scrape_locations_fees.py --dry-run   # preview only
python scripts/scrape_locations_fees.py             # post to DB
```

### Python env variables

| Variable | Default | Purpose |
|---|---|---|
| `TARGET_URL` | production URL | Where to POST cleaned data |
| `REPLACE` | `false` | `true` = delete all then re-insert; `false` = upsert |
| `ANTHROPIC_API_KEY` | (none) | Enables Claude date-typo correction (optional) |

---

## Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `node scripts/apply-schema.js` | Apply / migrate database schema |
| `python scripts/auto_post_clean_data.py` | Clean `data.json` and post to DB |
| `python scripts/scrape_locations_fees.py` | Refresh only location + fee URLs |

---

## Project Structure

```
Smart_Admission_Guide/
├── src/
│   ├── app/
│   │   ├── page.js                      # Homepage
│   │   ├── layout.js                    # Root layout
│   │   ├── auth/                        # Login / Register / Forgot / Reset password
│   │   ├── dashboard/                   # Student dashboard (login required)
│   │   │   ├── page.js                  # Dashboard home
│   │   │   ├── profile-progress/        # Complete profile form
│   │   │   └── notifications/           # Notification inbox
│   │   ├── universities/
│   │   │   ├── page.js                  # Browse all universities
│   │   │   └── [id]/page.js             # University detail + programs
│   │   ├── quiz/page.js                 # Career aptitude quiz
│   │   ├── admission-probability/       # Check admission chances
│   │   ├── academic-background/         # Academic info entry
│   │   ├── application-pack/            # Generate PDF application docs
│   │   ├── about/page.js                # About page
│   │   ├── admin/                       # Admin panel (admin role required)
│   │   │   ├── page.js                  # Stats dashboard + Scrape & Sync
│   │   │   ├── universities/            # Manage university records
│   │   │   ├── programs/                # Manage programs
│   │   │   ├── students/                # View registered students
│   │   │   ├── entry-tests/             # Manage entry test info
│   │   │   ├── notifications/           # Send notifications to users
│   │   │   ├── chatbot-queries/         # View chatbot query logs
│   │   │   └── settings/                # Admin settings
│   │   ├── api/                         # Next.js API routes
│   │   │   ├── auth/                    # login, signup, google, forgot/reset-password
│   │   │   ├── universities/            # CRUD + [id]/programs sub-route
│   │   │   ├── admin/                   # stats, students, programs, notifications, entry-tests
│   │   │   ├── chatbot/                 # AI chatbot + query logs
│   │   │   ├── documents/generate/      # PDF generation
│   │   │   ├── notifications/           # Per-user notifications
│   │   │   ├── profile/                 # Get / update student profile
│   │   │   ├── quiz/recommend/          # Quiz-based recommendations
│   │   │   ├── reminders/send/          # Admission deadline reminders
│   │   │   ├── admission-form/          # Admission form schema + submit
│   │   │   └── health/db/               # DB health check
│   │   └── actions/scrape.js            # Server action: fetch worker → run Python
│   ├── components/
│   │   ├── Navbar.js
│   │   ├── Footer.js
│   │   ├── ChatbotWidget.js             # Floating AI chat (global)
│   │   ├── HeroSection.js
│   │   ├── DashboardLayout.js
│   │   └── AdminLayout.js
│   └── lib/
│       ├── db.js                        # PostgreSQL query helpers (query / queryOne / queryMany)
│       ├── auth.js                      # JWT sign / verify helpers
│       ├── schema.sql                   # Full DB schema (source of truth)
│       ├── email.js                     # Nodemailer setup
│       └── pdf-generator.js             # PDFKit document helpers
├── scripts/
│   ├── cloudflare-worker.js             # Scraper source — deploy to Cloudflare
│   ├── auto_post_clean_data.py          # Main data pipeline (clean + post)
│   ├── scrape_locations_fees.py         # Focused location/fee updater
│   ├── apply-schema.js                  # DB migration runner
│   ├── requirements.txt                 # Python deps (requests, anthropic)
│   └── README.md                        # Pipeline-specific docs
├── data.json                            # Raw worker output (auto-generated, not committed)
├── clean_data.json                      # Cleaned pipeline output (auto-generated)
└── .env.local                           # Environment variables — never commit this file
```

---

## Database Schema (key tables)

| Table | Purpose |
|---|---|
| `users` | Accounts (email + hashed password + role) |
| `students` | Academic profile linked to a user |
| `universities` | University records (name, location, website, fee_structure_url) |
| `programs` | Degree programs linked to a university |
| `university_events` | Admission dates / events per university |
| `entry_tests` | Entry test definitions (HAT, MCAT, ECAT, etc.) |
| `notifications` | Per-user notifications |
| `chat_logs` | Chatbot query history |
| `admissions` | Student application records |
| `scholarships` | Scholarship info per university |
| `quiz_questions` | Career aptitude quiz questions |
| `quizzes` | Student quiz attempts + scores |
| `recommendations` | AI program recommendations per student |
| `documents` | Uploaded student documents |
| `merit_history` | Historical closing merit per program/year |

---

## Authentication

- JWT stored in `localStorage` as `auth_token`
- Token expires after 24 hours
- Google OAuth available via one-tap sign-in
- Admin access: users with `role = 'admin'` in the `users` table

To make a user an admin run directly on the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Deployment

The app deploys to **Vercel**. The database is hosted on **Neon** (serverless Postgres).

On first deploy:
1. Set all env vars in the Vercel dashboard
2. Run `node scripts/apply-schema.js` once (with the production `DATABASE_URL`)
3. Deploy the Cloudflare worker from `scripts/cloudflare-worker.js`
4. Set `CLOUDFLARE_WORKER_URL` in Vercel env vars to the deployed worker URL

---

## Known Limitations

- The Cloudflare Worker has a 30-second CPU limit — it may time out if a university's website is slow to respond.
- Fee structure URLs are declared statically in the worker config. Universities without a public fee page have `null`.
- Universities with no parseable admission dates are stored with `status: "Not Declared"` and null date fields — they still appear in the listing.
