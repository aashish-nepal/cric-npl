# NPL Cricket Hub — Project Plan

**Status:** Phase 0 complete — greenfield repository inspected (empty directory, no git history).
**Platform:** Next.js 16 App Router + TypeScript + Tailwind CSS 4 + Supabase.
**Positioning:** Independent Nepali cricket media, statistics and fan platform. Not affiliated with the Nepal Premier League or the Cricket Association of Nepal.

---

## 1. What exists today

The working directory `/Users/aashishnepal/Documents/cric_nepal` was empty at project start. There is no legacy code to preserve and no existing framework to migrate.

Available tooling:

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22.13 | Supports Next.js 16 |
| npm | 10.9 | Registry reachable |
| PostgreSQL | 14.18 (local) | Used to apply and test migrations + RLS locally |
| Docker | installed, daemon not running | Not required |
| Supabase CLI | not installed | Migrations are plain SQL, portable to Supabase |

## 2. External dependencies and credentials

| Dependency | Status | Strategy |
|---|---|---|
| Supabase project | **Not provided** | Build full adapter + SQL migrations; run locally against PostgreSQL with a Supabase-compatible `auth` stub. Production requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. |
| Cricket data provider | **None verified** | Provider-independent interface + adapters are shipped, but no provider is claimed as working. Manual scoring is the supported path. See `docs/API.md`. |
| Google Analytics / Search Console / AdSense | Not provided | Integration hooks and verification placeholders documented, not claimed live. |
| Domain / Cloudflare / Vercel | Not provided | Deployment runbook only. No deployment is claimed. |

## 3. Delivery strategy

Because no Supabase credentials exist in this environment, the application ships with two interchangeable data backends behind one repository contract:

1. **Supabase backend** (production): normalized PostgreSQL schema, RLS, transactional scoring RPCs, realtime.
2. **Deterministic demo backend** (local verification): the same domain types and the same cricket engine, seeded with clearly labelled demo data generated from ball events. No real player statistics are invented and presented as fact; every demo page carries a data-source notice.

This lets the full UI, engine, admin flows and tests be exercised for real in this environment without pretending an external service is connected.

## 4. Scope

In scope: public site (live, fixtures, results, standings, teams, players, comparison, statistics, seasons, venues, news, fan zone, guides, legal), search, admin dashboard and scoring, editorial CMS, predictions/polls/comments/bookmarks, SEO (metadata, JSON-LD, sitemap, robots, hreflang), security (RLS, RBAC, validation, rate limits, audit log), tests, docs.

Deliberately out of scope for the first release: payments, betting, native apps, push notifications, dedicated search engine, Redis, microservices, automatic translation of editorial content.

## 5. Quality gates

- `npm run typecheck`, `npm run lint`, `npm run build` must pass.
- `npm test` (Vitest) must pass, including NRR/all-out edge cases.
- SQL migrations applied to a clean local PostgreSQL database; RLS policies exercised with `SET ROLE`.
- Playwright specs written; browser execution depends on download availability and is reported honestly.
- No feature is marked complete unless it was executed.

## 6. Key risks

| Risk | Mitigation |
|---|---|
| Scope is very large | Phase-by-phase delivery, shared primitives, computed data instead of duplicated static values |
| No live provider | Manual scoring + provider interface; UI never fabricates live data in production mode |
| Demo data mistaken for real data | Global demo banner, `dataSource` flag, documented in README and UI |
| Supabase adapter untested at runtime | Same engine used for both backends; SQL tested locally; adapter documented as requiring a real project before launch |
| NRR / cricket rule errors | Pure functions with exhaustive unit tests, including all-out innings and no-results |
