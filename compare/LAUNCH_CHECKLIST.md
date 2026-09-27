# 🚀 Launch Checklist: BandingHidup (compare.t-agung.id) — v4 Launch Polish

Single source of truth runbook to take the BandingHidup purchasing-power comparison product live on `compare.t-agung.id` alongside the `t-agung.id` Astro blog.

---

## 1. Netlify Site: Environment Variables & Build Settings

- [x] **Base directory**: `compare` (in the unified `Th0mm1es/t-agung.id` repository)
- [x] **Build command**: `pnpm run build`
- [x] **Publish directory**: `apps/web/.next`
- [x] **Node version**: 20.x (`NODE_VERSION = 20`)
- [x] **Next.js plugin**: `@netlify/plugin-nextjs` configured in `netlify.toml`

### Environment Variables Matrix (Set in Netlify Dashboard → Site configuration → Environment variables)

| Variable Name | Required | Scope | Purpose & Source |
|---|:---:|:---:|---|
| `NEXT_PUBLIC_APP_DOMAIN` | **Required** | All | `https://compare.t-agung.id` |
| `NEXT_PUBLIC_BLOG_URL` | **Required** | All | `https://t-agung.id` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Optional | All | `id` |
| `NEXT_PUBLIC_SUPABASE_URL` | **Required** | All | Supabase Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Required** | All | Supabase Project Settings → API → `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required (SECRET)** | **Server only (Functions)** | Supabase Project Settings → API → `service_role` secret (Bypasses RLS) |
| `NEXT_PUBLIC_ALLOW_DIRECT_BENCHMARK_UPDATES` | Optional | All | `true` |
| `DESTATIS_USERNAME` | Optional | Server only | Destatis GENESIS-Online login (from `.env.local`) |
| `DESTATIS_PASSWORD` | Optional | Server only | Destatis GENESIS-Online password (from `.env.local`) |
| `DESTATIS_API_BASE_URL` | Optional | Server only | `https://www-genesis.destatis.de/genesisWS/rest/2020` |
| `ESTAT_APP_ID` | Optional | Server only | e-Stat Japan Application ID (from `.env.local`) |
| `ESTAT_API_BASE_URL` | Optional | Server only | `https://api.e-stat.go.jp/rest/3.0/app/json` |
| `BPS_API_KEY` | Optional | Server only | BPS Web API Key (from `.env.local`) |
| `BPS_API_BASE_URL` | Optional | Server only | `https://webapi.bps.go.id/v1/api` |
| `FRED_API_KEY` | Optional | Server only | FRED Economic Data API Key |
| `FRED_API_BASE_URL` | Optional | Server only | `https://api.stlouisfed.org/fred` |

> 🔒 **Security Notice:** Never paste `SUPABASE_SERVICE_ROLE_KEY` into git or public logs. Values reside securely in Netlify dashboard environment variables and local `.env.local`.

---

## 2. "Powered by Netlify" Badge

- [x] **DONE in Netlify Console (2026-09-27)**: Toggled OFF at `Site configuration → Build & deploy → Continuous deployment → "Powered by Netlify" → Hide`.
- [x] **In-Repo Fallback Shield Active**: `components/common/NetlifyShield.tsx` mounted in `app/layout.tsx`. If the badge is ever re-injected due to a Netlify platform reset or site migration, the client-side stylesheet selector and MutationObserver automatically remove `/.netlify/scripts/hud` and hide all badge host nodes.
- **Troubleshooting Note**: If badge ever reappears, re-toggle in Netlify console or rely on the in-repo client-side shield.

---

## 3. DNS Configuration & SSL Certificate

- [x] **Registrar**: Porkbun (`t-agung.id`)
- [x] **DNS Management**: Cloudflare DNS
- [x] **CNAME Record**:
  - **Type**: `CNAME`
  - **Name**: `compare`
  - **Content / Target**: `compare-t-agung.netlify.app`
  - **Proxy status**: `Proxied (Orange cloud)` (Cloudflare Universal SSL edge + Netlify Let's Encrypt origin)
- [x] **SSL / TLS Encryption**: Full / Strict in Cloudflare, certificate status active and valid.

---

## 4. Favicon & Social Card (OG Preview) Re-Check

- [x] **Favicon**: `/icon.svg` returns HTTP 200 with SVG brand mark (`#2aa9a6` teal & `#e3b341` gold).
- [x] **Favicon Redirect Route**: `/favicon.ico` cleanly redirects (307) to `/icon.svg` via `app/favicon.ico/route.ts` — eliminating 404 errors in legacy browser crawlers.
- [x] **OpenGraph Preview**: `/opengraph-image` returns dynamic 1200×630 branded social card.
- [ ] **Social Debugger Links**:
  - Facebook Sharing Debugger: `https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fcompare.t-agung.id`
  - X / Twitter Card Validator: `https://cards-dev.twitter.com/validator`
  - LinkedIn Post Inspector: `https://www.linkedin.com/post-inspector/inspect/https%3A%2F%2Fcompare.t-agung.id`

---

## 5. Staging Smoke Test (12 Checkpoints)

Execute against `https://<site-name>.netlify.app` or `https://compare.t-agung.id`:

- [ ] **1. All 4 Locales on Homepage**:
  - Indonesian (`/?lang=id`), English (`/?lang=en`), German (`/?lang=de`), Japanese (`/?lang=ja`).
- [ ] **2. Light Mode Complete Legibility (P0-1 Proof)**:
  - Toggle theme to `light` via Navbar switcher.
  - Verify every text element, card, table, and input is crisp, dark, and 100% legible on `/`, `/compare`, `/gaji-setara`, `/persentil`, `/wizard`, `/contribute`, `/metode`.
  - Zero invisible white-on-white text.
- [ ] **3. DE Progressive Tax at €5.000 Gross**:
  - On `/gaji-setara` or home simulator, select Germany and set gross to €5.000 / month.
  - Verify progressive income tax (Lohnsteuer) is itemized separately from social security (effective rate ~38%–42%, NOT flat 20.5%).
- [ ] **4. Japan Pathway & Trainee Tax Exemption**:
  - Select Kenshusei / Tokutei pathway. Verify 1st-year resident tax (Juminzei) exemption applies correctly.
- [ ] **5. Persona On-Ramp Buttons**:
  - Click `🇯🇵 Pindah ke Jepang`, `🇩🇪 Pindah ke Jerman`, and `⚖️ Bandingkan 2 Kota` to confirm instant preset selection and scroll.
- [ ] **6. Share Scenario Token (`/s/<token>`)**:
  - Save or load a scenario URL token; verify scenario state restores with exact parameters.
- [ ] **7. Saved Scenarios Round-Trip (P2 Retention 1)**:
  - Save up to 3 scenarios in localStorage on homepage.
  - Click "Muat ke Simulator" (1-click reload); verify inputs restore instantly.
  - Delete individual scenario.
- [ ] **8. Result Card PNG Generation (P2 Retention 2)**:
  - On `/gaji-setara`, `/compare`, or `/wizard` Step 7, click "Salin / Bagikan Kartu Hasil (PNG 1080×1350)".
  - Verify canvas renders crisp 1080×1350 preview image.
  - Test "Unduh Gambar (PNG)" and WhatsApp share link.
- [ ] **9. One-Field Email Subscribe Round-Trip (P2 Retention 3)**:
  - Enter email in "Pantau Perubahan Biaya" box.
  - POST to `/api/subscribe` returns 200 JSON success response.
- [ ] **10. Health Check Endpoint**:
  - `GET /api/health` returns `{"status":"ok","uptime":...}` with HTTP 200.
- [ ] **11. SEO Crawlers**:
  - `/robots.txt` disallows `/admin` and `/s/`, allows public pages.
  - `/sitemap.xml` generates valid XML including `/metode`, `/gaji-setara`, `/persentil`, `/compare`, `/wizard`, `/contribute`.
- [ ] **12. Comments Integration (Isso)**:
  - `comments.t-agung.id` connects and loads without CORS origin blocking.

---

## 6. Data Sync Automation

- [ ] Confirm GitHub repository secrets are set in `Th0mm1es/t-agung.id` (`Settings → Secrets and variables → Actions`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ESTAT_APP_ID`, `BPS_API_KEY`, `FRED_API_KEY` (if syncing live APIs)
- [ ] In GitHub Actions, trigger the **Periodic Data Sync & Benchmark Refresh** workflow manually via `workflow_dispatch`.
- [ ] Confirm workflow completes successfully and exchange rates in Supabase display the fresh date.

---

## 7. Go-Live Re-Test (Blog Isolation Spot-Check)

Verify that deployment of `compare.t-agung.id` has caused ZERO disturbances to the main blog:

- [ ] `https://t-agung.id/` (Homepage loads with original Astro design and post listings)
- [ ] `https://t-agung.id/blog` (Blog archive page intact)
- [ ] `https://t-agung.id/blog/blog41_2nm_week_mediatek_dimensity_apple_m6_moore/` (Individual blog post renders with code blocks and Isso comments)

---

## 8. Rollback Plan

If a critical rollback is required:
1. **Instant DNS Rollback (30 Seconds)**:
   - In Cloudflare DNS, delete or pause the `compare` CNAME record.
   - `compare.t-agung.id` will stop resolving. The apex blog `t-agung.id` remains 100% active.
2. **Git Rollback**:
   - Revert commit or redeploy previous git tag:
     ```bash
     git revert HEAD
     git push origin main
     ```
   - Rollback tag reference: `launch-v0` / `launch-v1`.
