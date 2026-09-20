<div align="center">

# 🎓 Smart Admission Guide

**An AI-powered university admission platform for Pakistani intermediate students.**

Find matching universities, check your admission chances, generate application documents, and never miss a deadline — all in one place.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/Postgres-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Claude API](https://img.shields.io/badge/AI-Claude-D97757?logo=anthropic&logoColor=white)](https://www.anthropic.com/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure) • [Deployment](#-deployment)

</div>

---

## 📖 About

Choosing a university in Pakistan means digging through dozens of separate websites, each with its own admission dates, merit criteria, and application process — and most of that information changes every year. **Smart Admission Guide (SAG)** solves this by centralizing everything in one place: it aggregates university and program data, estimates a student's admission probability using historical merit trends, recommends programs through a career-aptitude quiz, and auto-generates application paperwork, all backed by an AI chatbot that can answer admission questions in real time.

It's built for FSc/A-Level students in Pakistan who are applying to universities and don't want to track ten browser tabs and a dozen deadlines by hand.

## ✨ Features

- 🏫 **University Explorer** — browse and filter universities and their degree programs
- 📊 **Admission Probability Checker** — estimates your chances using historical closing-merit data
- 🧭 **Career Aptitude Quiz** — recommends programs based on a student's interests and strengths
- 📄 **Application Pack Generator** — auto-generates application documents as PDFs (PDFKit)
- 🔔 **Deadline Reminders** — tracks admission events and emails reminders before they close
- 🤖 **AI Chatbot** — Claude-powered assistant for admission-related questions, logged for review
- 🔐 **Auth** — email/password with JWT sessions, plus Google OAuth one-tap sign-in
- 🛠️ **Admin Panel** — manage universities, programs, entry tests, students, and notifications; trigger the scraper/data-sync pipeline from the UI
- 🔄 **Automated Data Pipeline** — a Cloudflare Worker scrapes university sites, a Python script cleans and normalizes the data, then posts it into the database

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, Lucide Icons |
| Database | PostgreSQL via Neon (serverless) |
| Auth | JWT + Google OAuth |
| AI | Claude API (Haiku — chatbot & date correction) |
| Documents | PDFKit |
| Scraper | Cloudflare Worker (deployed separately) |
| Data pipeline | Python 3 (`scripts/auto_post_clean_data.py`) |
| Email | Nodemailer + Gmail SMTP |
| Deployment | Vercel |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+ with pip
- A [Neon](https://neon.tech) PostgreSQL database
- A [Cloudflare Workers](https://workers.cloudflare.com) account (for the scraper)

### 1. Install dependencies

```bash
npm install
pip install -r scripts/requirements.txt
```

### 2. Configure environment

Create a `.env.local` file at the project root:

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

### 3. Apply the database schema

```bash
node scripts/apply-schema.js
```

Safe to re-run — every statement uses `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🔄 Data Pipeline — How University Data Gets In

The Cloudflare Worker and the Next.js app are **not automatically linked** — data is loaded in two manual steps.

**Step 1 — Run the Cloudflare Worker.** `scripts/cloudflare-worker.js` is deployed to Cloudflare Workers. It visits each university's website, strips the HTML, and returns structured JSON. It must be triggered manually (no schedule):

```bash
curl https://your-worker.workers.dev > data.json
```

The Admin panel's **Scrape & Sync** button does this automatically — it calls `CLOUDFLARE_WORKER_URL`, saves `data.json`, then runs the Python cleaning script.

**Step 2 — Run the Python cleaning script.**

```bash
python scripts/auto_post_clean_data.py
```

This reads `data.json` and extracts admission dates (regex + optional Claude correction for OCR typos), programs offered, campus location, and fee-structure URLs, then POSTs the cleaned records to `POST /api/universities`, which upserts them into the database.

To refresh **only** location and fee-structure links without touching events or programs:

```bash
python scripts/scrape_locations_fees.py --dry-run   # preview only
python scripts/scrape_locations_fees.py             # post to DB
```

| Python env variable | Default | Purpose |
|---|---|---|
| `TARGET_URL` | production URL | Where to POST cleaned data |
| `REPLACE` | `false` | `true` = delete all then re-insert; `false` = upsert |
| `ANTHROPIC_API_KEY` | (none) | Enables Claude date-typo correction (optional) |

## 📜 Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `node scripts/apply-schema.js` | Apply / migrate database schema |
| `python scripts/auto_post_clean_data.py` | Clean `data.json` and post to DB |
| `python scripts/scrape_locations_fees.py` | Refresh only location + fee URLs |

## 📂 Project Structure

```
Smart_Admission_Guide/
├── src/
│   ├── app/
│   │   ├── page.js                      # Homepage
│   │   ├── layout.js                    # Root layout
│   │   ├── auth/                        # Login / Register / Forgot / Reset password
│   │   ├── dashboard/                   # Student dashboard (login required)
│   │   ├── universities/                # Browse universities + program detail
│   │   ├── quiz/                        # Career aptitude quiz
│   │   ├── admission-probability/       # Check admission chances
│   │   ├── academic-background/         # Academic info entry
│   │   ├── application-pack/            # Generate PDF application docs
│   │   ├── about/                       # About page
│   │   ├── admin/                       # Admin panel (admin role required)
│   │   ├── api/                         # Next.js API routes (auth, universities, admin, chatbot, ...)
│   │   └── actions/scrape.js            # Server action: fetch worker → run Python
│   ├── components/                      # Navbar, Footer, ChatbotWidget, layouts, ...
│   └── lib/
│       ├── db.js                        # PostgreSQL query helpers
│       ├── auth.js                      # JWT sign / verify helpers
│       ├── schema.sql                   # Full DB schema (source of truth)
│       ├── email.js                     # Nodemailer setup
│       └── pdf-generator.js             # PDFKit document helpers
├── scripts/
│   ├── cloudflare-worker.js             # Scraper source — deploy to Cloudflare
│   ├── auto_post_clean_data.py          # Main data pipeline (clean + post)
│   ├── scrape_locations_fees.py         # Focused location/fee updater
│   ├── apply-schema.js                  # DB migration runner
│   └── requirements.txt                 # Python deps (requests, anthropic)
├── data.json                            # Raw worker output (auto-generated, not committed)
├── clean_data.json                      # Cleaned pipeline output (auto-generated)
└── .env.local                           # Environment variables — never commit this file
```

## 🗄️ Database Schema (key tables)

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
| `quiz_questions` / `quizzes` | Career aptitude quiz + student attempts |
| `recommendations` | AI program recommendations per student |
| `documents` | Uploaded student documents |
| `merit_history` | Historical closing merit per program/year |

## 🔐 Authentication

- JWT stored in `localStorage` as `auth_token`, expires after 24 hours
- Google OAuth available via one-tap sign-in
- Admin access: users with `role = 'admin'` in the `users` table

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## ☁️ Deployment

The app deploys to **Vercel**; the database is hosted on **Neon** (serverless Postgres).

On first deploy:
1. Set all env vars in the Vercel dashboard
2. Run `node scripts/apply-schema.js` once against the production `DATABASE_URL`
3. Deploy the Cloudflare worker from `scripts/cloudflare-worker.js`
4. Set `CLOUDFLARE_WORKER_URL` in Vercel to the deployed worker URL

## ⚠️ Known Limitations

- The Cloudflare Worker has a 30-second CPU limit — it may time out on slow university websites.
- Fee-structure URLs are declared statically in the worker config; universities without a public fee page have `null`.
- Universities with no parseable admission dates are stored with `status: "Not Declared"` and null date fields, but still appear in the listing.

---

<div align="center">

Built by [umarilyas02](https://github.com/umarilyas02)

</div>
