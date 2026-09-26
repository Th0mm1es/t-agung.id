# 🛡️ Security Policy & Environment Variables Guide — BandingHidup

## Security Principles
1. **Zero Secret Policy in Version Control**: Never commit real API keys, passwords, or service-role keys into git repositories, issue trackers, test fixtures, or code literals.
2. **Local Development Secrets**: All local secrets live strictly in `apps/web/.env.local`, which is ignored by `.gitignore`.
3. **Production Deployment Secrets**: Set environment variables directly in your hosting platform dashboard (e.g., Netlify Site Configuration → Environment variables).

---

## 📋 Required Environment Variables Reference

| Variable Name | Scope | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_APP_DOMAIN` | Client & Server | Yes | The canonical application domain (e.g. `https://compare.t-agung.id`). Used in metadata, canonical links, and share URL generation. |
| `NEXT_PUBLIC_BLOG_URL` | Client & Server | Yes | Outbound link to the author's engineering blog (`https://t-agung.id`). |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Client & Server | Yes | Default UI locale (`id`, `en`, `de`, `ja`). Default is `id`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Yes | Public REST URL for the Supabase backend project. Safe for client-side bundle. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Yes | Supabase publishable anonymous key. Used by client components for public reads and authenticated user queries. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | Yes | Privileged Supabase key that bypasses Row Level Security (RLS). Used exclusively by server-side API routes (`/api/proposals`, admin actions) and autonomous ingest agents. **NEVER expose to client!** |
| `NEXT_PUBLIC_ALLOW_DIRECT_BENCHMARK_UPDATES` | Server & Client | Optional | Boolean flag (`true`/`false`) determining whether crowdsourced price reports immediately reflect in live benchmarks. Default is `true`. |
| `DESTATIS_USERNAME` | **Server-Only** | Optional | Username/email for Germany Federal Statistical Office (Destatis GENESIS-Online) REST WebService. |
| `DESTATIS_PASSWORD` | **Server-Only** | Optional | Password for Destatis GENESIS-Online WebService account. |
| `DESTATIS_API_BASE_URL` | **Server-Only** | Optional | Base URL for Destatis REST API (`https://www-genesis.destatis.de/genesisWS/rest/2020`). |
| `ESTAT_APP_ID` | **Server-Only** | Optional | Registered Application ID (`appId`) for Japan Statistics Bureau (e-Stat API). |
| `ESTAT_API_BASE_URL` | **Server-Only** | Optional | Base URL for e-Stat API (`https://api.e-stat.go.jp/rest/3.0/app/json`). |
| `BPS_API_KEY` | **Server-Only** | Optional | API key for Indonesia Central Bureau of Statistics (Badan Pusat Statistik - BPS). |
| `BPS_API_BASE_URL` | **Server-Only** | Optional | Base URL for BPS Web API (`https://webapi.bps.go.id/v1/api`). |
| `FRED_API_KEY` | **Server-Only** | Optional | Federal Reserve Bank of St. Louis economic data API key. |
| `BLS_API_KEY` | **Server-Only** | Optional | Bureau of Labor Statistics API key. |
| `CENSUS_API_KEY` | **Server-Only** | Optional | US Census Bureau data API key. |

---

## 🔒 Reporting a Vulnerability

If you discover a potential security vulnerability or exposed credential, please contact the maintainer directly via LinkedIn ([Thomas Agung](https://www.linkedin.com/in/thomasagung/)) rather than opening a public issue.
