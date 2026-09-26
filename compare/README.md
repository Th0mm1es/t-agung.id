# BandingHidup 🌏

> Perbandingan biaya hidup realistis untuk Ausbildung di Jerman & Kenshusei di Jepang.
> A neutral, anonymous cost-of-living comparison platform for vocational trainees, students, and entry-level workers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Web App | Next.js 14+ (App Router, TypeScript) |
| Styling | Tailwind CSS v3 |
| Database | Supabase (PostgreSQL + PostgREST) |
| Shared Logic | `@bandinghidup/core` TypeScript package |
| Money Math | `bigint` minor units + `decimal.js` |
| Validation | Zod |
| Testing | Vitest |
| Data Fetching | TanStack Query v5 |

---

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0 — install with `npm install -g pnpm`
- **Supabase CLI** — install with `npm install -g supabase` (for local dev)

---

## Setup Instructions

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url> bandinghidup
cd bandinghidup
pnpm install
```

### 2. Configure Environment Variables

```bash
# Copy the example file
cp .env.example apps/web/.env.local

# Edit with your actual Supabase credentials
# (or use local Supabase — see step 3)
```

### 3. Start Local Supabase (Recommended for Development)

> Requires Docker Desktop to be running.

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Start local Supabase instance
supabase start

# Apply database migrations
supabase db push

# Seed initial data
supabase db reset  # (runs migrations + seed.sql automatically)
```

After `supabase start`, you'll get output like:
```
API URL: http://localhost:54321
anon key: eyJh...
```

Update your `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<the anon key from above>
```

### 4. Run the Development Server

```bash
pnpm dev
```

Opens at: **http://localhost:3000**

### 5. Run Unit Tests

```bash
pnpm test
# or run only core package tests:
pnpm --filter @bandinghidup/core test
```

### 6. Check API Health

```bash
curl http://localhost:3000/api/health
# → { "status": "ok", "timestamp": "..." }
```

---

## Project Structure

```
bandinghidup/
├── .env.example              # Environment variable template
├── README.md                 # This file
├── turbo.json                # Turborepo pipeline config
├── package.json              # Root workspace
├── pnpm-workspace.yaml       # pnpm workspace definition
│
├── packages/
│   └── core/                 # @bandinghidup/core — shared TypeScript package
│       ├── src/
│       │   ├── money/        # Monetary helpers (bigint, no float drift)
│       │   ├── types/        # Supabase DB type definitions
│       │   └── i18n/         # Translation dictionaries (id, en, ja)
│       └── ...
│
├── apps/
│   └── web/                  # Next.js 14 web application
│       ├── app/
│       │   ├── layout.tsx    # Root layout
│       │   ├── page.tsx      # Landing page
│       │   └── api/health/   # Health check endpoint
│       └── ...
│
└── supabase/
    ├── migrations/
    │   └── 00001_initial_schema.sql
    └── seed.sql
```

---

## Legal Disclaimer

BandingHidup provides planning estimates based on user inputs and available reference data. It is **not** legal, tax, payroll, visa, or financial advice. Always consult qualified professionals for important decisions.

---

## Stage Roadmap

| Stage | Description |
|---|---|
| **Stage 0** ✅ | Technical Foundations & Meta Shell |
| Stage 1 | Core Calculation MVP (Wizard, Gakumen vs Tedori) |
| Stage 2 | Data Governance & Hermes Scraping Pipeline |
| Stage 3 | Community Contributions & Private Sharing |
| Stage 4 | Product Depth & Personalization |
| Stage 5 | Cross-Platform Mobile (React Native / Expo) |
