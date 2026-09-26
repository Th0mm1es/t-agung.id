# 🚀 Launch Checklist: BandingHidup (compare.t-agung.id)

Runbook to take the BandingHidup purchasing-power comparison product live on `compare.t-agung.id` alongside the `t-agung.id` Astro blog.

---

## 1. Prerequisites

- [ ] **pnpm installed**: Verify via `pnpm -v` (version 9.x recommended; enable via `corepack enable` or `npm i -g pnpm@9`).
- [ ] **Git configured**: Working tree clean (or untracked blog drafts left untouched), origin connected to `https://github.com/Th0mm1es/t-agung.id.git`.
- [ ] **Netlify Account**: Access to the Netlify team dashboard currently hosting the `t-agung.id` production site.
- [ ] **DNS Access**: Access to Cloudflare or your DNS registrar for `t-agung.id`.

---

## 2. Create the Compare Netlify Site

1. In the Netlify Dashboard, click **Add new site** → **Import an existing project**.
2. Select your repository: `Th0mm1es/t-agung.id`.
3. Configure Site Settings:
   - **Base directory**: `compare`
   - **Build command**: `pnpm run build`
   - **Publish directory**: `apps/web/.next`
4. In **Site configuration → Environment variables**, add the following variables:

| Variable Name | Required / Optional | Scope | Where to Get Value |
|---|:---:|:---:|---|
| `NEXT_PUBLIC_APP_DOMAIN` | **Required** | All | Set to `https://compare.t-agung.id` |
| `NEXT_PUBLIC_BLOG_URL` | **Required** | All | Set to `https://t-agung.id` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Optional | All | Set to `id` |
| `NEXT_PUBLIC_SUPABASE_URL` | **Required** | All | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Required** | All | Supabase Dashboard → Project Settings → API → `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required (SECRET)** | **Server only (Functions)** | Supabase Dashboard → Project Settings → API → `service_role` secret (Bypasses RLS) |
| `NEXT_PUBLIC_ALLOW_DIRECT_BENCHMARK_UPDATES` | Optional | All | Set to `true` |
| `DESTATIS_USERNAME` | Optional | Server only | Destatis GENESIS-Online login (from local `compare/apps/web/.env.local`) |
| `DESTATIS_PASSWORD` | Optional | Server only | Destatis GENESIS-Online password (from local `compare/apps/web/.env.local`) |
| `DESTATIS_API_BASE_URL` | Optional | Server only | `https://www-genesis.destatis.de/genesisWS/rest/2020` |
| `ESTAT_APP_ID` | Optional | Server only | e-Stat Japan Application ID (from local `compare/apps/web/.env.local`) |
| `ESTAT_API_BASE_URL` | Optional | Server only | `https://api.e-stat.go.jp/rest/3.0/app/json` |
| `BPS_API_KEY` | Optional | Server only | Badan Pusat Statistik Web API key |
| `BPS_API_BASE_URL` | Optional | Server only | `https://webapi.bps.go.id/v1/api` |
| `FRED_API_KEY` | Optional | Server only | Federal Reserve Bank of St. Louis economic data API key |
| `FRED_API_BASE_URL` | Optional | Server only | `https://api.stlouisfed.org/fred` |
| `BLS_API_KEY` | Optional | Server only | Bureau of Labor Statistics API key |
| `BLS_API_BASE_URL` | Optional | Server only | `https://api.bls.gov/publicAPI/v2` |
| `CENSUS_API_KEY` | Optional | Server only | US Census Bureau data API key |
| `DATA_GOV_API_KEY` | Optional | Server only | Data.gov API key |

> 🔒 **Security Notice:** `SUPABASE_SERVICE_ROLE_KEY` is a privileged, secret key. Set it ONLY in the Netlify Dashboard (or local `.env.local`). Never commit it to git or paste it in public forums.

---

## 3. Staging Smoke Test

Before attaching the custom subdomain, test the generated staging URL (`https://<random-hash>.netlify.app`):

- [ ] **Homepage 200 in all 4 locales**:
  - `/?lang=id` (Indonesian default)
  - `/?lang=en` (English)
  - `/?lang=de` (German, verify full glossary translations render)
  - `/?lang=ja` (Japanese)
- [ ] **Simulator Computes**:
  - Move salary slider to test calculation.
  - Verify headline output displays meal purchasing power (e.g. `~145 porsi Gyudon / bulan`).
  - Verify Rupiah conversion is labeled `(nominal kurs saja · bukan daya beli)`.
- [ ] **DE Tax Progressive Calculation**:
  - Select Germany preset and move gross to €5,000.
  - Verify breakdown shows progressive income tax separate from social security (~38.4%–42.0% total deduction, not flat 20.5%).
- [ ] **Data Freshness Indicator**:
  - Check the timestamp below the hero: `Kurs & harga diperbarui: <real date>`.
- [ ] **WhatsApp Share & Scenario Sharing**:
  - Click WhatsApp share button and confirm pre-filled text in the active locale.
  - Open `/s/<token>` page to ensure personal scenario retrieval works.
- [ ] **Admin & Health Endpoints**:
  - `/admin`: Password protection gate renders.
  - `/api/health`: Returns JSON status `{"status":"ok"}`.
- [ ] **SEO Plumbing**:
  - `/robots.txt`: Disallows `/s/` and `/admin`, allows public routes.
  - `/sitemap.xml`: Generates valid XML with canonical `https://compare.t-agung.id`.
- [ ] **OpenGraph Image & Favicon**:
  - Verify `/icon.svg` renders as tab icon.
  - Test `/opengraph-image` in social card previewer (WhatsApp/Telegram/Facebook debugger).
- [ ] **Persona On-Ramp Buttons**:
  - Click `🇯🇵 Pindah ke Jepang`, `🇩🇪 Pindah ke Jerman`, and `⚖️ Bandingkan 2 Kota` to confirm instant preset selection and scroll.
- [ ] **Mobile Viewport**:
  - Open Chrome DevTools in iPhone/Android viewport; verify no horizontal scroll on the hero simulator.

---

## 4. Go Live (Custom Domain & DNS)

1. In Netlify Site Settings for the compare site:
   - Navigate to **Domain management** → **Add custom domain**.
   - Enter `compare.t-agung.id`.
2. Netlify will display the CNAME target: `<site-name>.netlify.app`.
3. In your DNS Management (Cloudflare for `t-agung.id`):
   - **Type**: `CNAME`
   - **Name**: `compare`
   - **Target**: `<site-name>.netlify.app`
   - **Proxy status**: **Proxied (Orange cloud)** (terminates TLS at edge; Netlify provisions the cert).
4. Wait for SSL certificate issuance (typically 1–5 minutes).

---

## 5. After Propagation

- [ ] Re-run the Section 3 smoke test against `https://compare.t-agung.id`.
- [ ] **Spot-check 3 apex blog URLs** to ensure zero side-effects on `t-agung.id`:
  - `https://t-agung.id/`
  - `https://t-agung.id/blog`
  - `https://t-agung.id/blog/blog41_2nm_week_mediatek_dimensity_apple_m6_moore/`
- [ ] *(Optional & Gated)*: Apply the blog outbound navigation link (see Step 7 in launch brief).

---

## 6. Data Sync Automation

- [ ] Confirm GitHub repository secrets are set in GitHub (`Settings → Secrets and variables → Actions`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DESTATIS_USERNAME` / `DESTATIS_PASSWORD` (if applicable)
  - `ESTAT_APP_ID` / `BPS_API_KEY` / `FRED_API_KEY` / `BLS_API_KEY`
- [ ] In GitHub Actions tab, trigger the **Periodic Data Sync & Benchmark Refresh** workflow manually via `workflow_dispatch`.
- [ ] Confirm workflow completes successfully and exchange rates in Supabase show current date.

---

## 7. Post-Launch Review (24 Hours)

- [ ] Netlify SSL certificate status is green with automatic renewal active.
- [ ] Check Netlify Functions log for `/api/benchmarks/correction` and `/api/proposals` — ensure no 500 errors.
- [ ] Comments section (`comments.t-agung.id`) connects and loads without CORS errors.
- [ ] **Security audit**: If `SUPABASE_SERVICE_ROLE_KEY` was ever copied or shared in unencrypted channels, rotate it in the Supabase Dashboard and update Netlify environment variables.

---

## 8. Rollback Plan

If an unforeseen issue occurs:
1. **Instant DNS Rollback**:
   - In Cloudflare DNS, delete or disable the `compare` CNAME record.
   - `compare.t-agung.id` will immediately stop resolving. The blog `t-agung.id` remains 100% operational.
2. **Git Rollback**:
   - Revert the single integration commit:
     ```bash
     git revert launch-v1
     git push origin main
     ```
   - Because all compare code resides in the self-contained `compare/` directory, removing it has zero impact on the Astro blog.

---

Live on: ____________________ (date), verified by: ____________________
