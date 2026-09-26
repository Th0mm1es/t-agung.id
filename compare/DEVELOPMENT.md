# 🛠️ Development & Contribution Guide — BandingHidup

BandingHidup is a monorepo containing shared computational models, monetary math, database schemas, and a Next.js web application comparing real purchasing power for vocational trainees, students, and professionals in Germany, Japan, and Indonesia.

---

## 💻 Prerequisites

- **Node.js**: `v18.18+` or `v20+`
- **pnpm**: `v9.15.5` (enforced via `packageManager`)

---

## 🚀 Quickstart

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd bandinghidup
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `apps/web/.env.local`:
   ```bash
   cp .env.example apps/web/.env.local
   ```
   *Note: At minimum, `NEXT_PUBLIC_APP_DOMAIN=https://compare.t-agung.id` is configured by default. For local database operations, add your Supabase credentials to `.env.local`.*

4. **Run Development Server:**
   ```bash
   pnpm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

---

## 🧪 Testing & Validation

- **Type Check:**
   ```bash
   pnpm --filter web type-check
   ```
- **Run Unit Tests (99+ Vitest tests):**
   ```bash
   pnpm test
   ```
- **Production Build:**
   ```bash
   pnpm run build
   ```

---

## 📁 Repository Structure

```
bandinghidup/
├── apps/
│   └── web/                # Next.js 14 App Router web application
├── packages/
│   └── core/               # Shared monetary math, tax calculators, i18n, & types
├── scripts/                # Ingestion scripts (Hermes updater)
├── supabase/               # Database migrations & seed scripts
├── .env.example            # Committed template for environment variables
├── SECURITY.md             # Security policy and environment variables directory
└── netlify.toml            # Deployment configuration for compare.t-agung.id
```
