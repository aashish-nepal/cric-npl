# NPL Cricket Hub

A production-grade, SEO-first platform for live NPL (Nepal Premier League) cricket scores,
standings, stats, editorial content and fan engagement. Built with Next.js (App Router),
TypeScript, Tailwind 4 and Supabase (Postgres / Auth / Realtime / Storage / RLS).

**Product rule baked into the codebase:** live scores and statistics are *never fabricated*.
Every number shown in the UI comes from ball events recorded through the scoring console
(or an external data provider, when one is configured and verified). Before credentials are
wired up the app runs in a clearly-labelled **demo mode** with a persistent banner.

---

## Features

- **Live & results** — live match centre with ball-by-ball commentary, full scorecard
  (innings, extras, partnerships, falls of wicket), fixtures and results with filters.
- **Derived statistics** — runs, balls, strike rates, economy, averages, bests, NRR and
  standings computed from ball events by a pure-TypeScript cricket engine (no hand-entered stats).
- **Teams & players** — roster profiles, per-player analytics, head-to-head player comparison.
- **Seasons & venues** — season pages with derived standings and venue profiles.
- **Fan zone** — polls, predictions, bookmarks and moderated comments (rate-limited).
- **Editorial** — news, categories, guides, RSS feed, category pages.
- **SEO** — per-page metadata, Open Graph/Twitter cards, canonical URLs, JSON-LD
  (SportsEvent, SportsTeam, Person, Article, BreadcrumbList), dynamic `sitemap.xml`
  and `robots.txt`, multilingual Nepali landing (`/ne`) ready for full `/ne` routes.
- **Admin** — dashboard, match management, a real ball-by-ball scoring console with
  undo, article/workflow publishing, comment moderation, user role management and a
  runtime-system status page.
- **Security** — server-side role checks (`requirePermission`) in every admin page/action,
  defense-in-depth `proxy.ts` gate, Supabase RLS policies on all tables, rate-limited
  login/fan actions, HttpOnly session cookies, column grants that block role self-escalation.

## Quick start (demo mode, zero configuration)

```bash
npm install
npm run dev          # http://localhost:3000
```

The app starts in **demo mode** because no Supabase credentials are configured. A banner
clearly marks demo data (deterministic dataset of NPL-style teams/players/matches, with one
match mid-second-innings). Demo admin mutations are in-memory and reset on server restart.

Demo accounts (local only, no signup):

| Role   | Email                          | Password            |
| ------ | ------------------------------ | ------------------- |
| admin  | `admin@nplcrickethub.local`    | `demo-admin-password` |
| editor | `editor@nplcrickethub.local`   | `demo-editor-password` |
| fan    | `fan@nplcrickethub.local`      | `demo-fan-password` |

Copy `.env.example` → `.env.local` and set values. For production you **must** set
`AUTH_SECRET` (32+ random chars) and the three Supabase variables.

## Repo layout

```
src/app/            App Router routes (public, /ne, /admin, sitemap, robots)
src/components/     design-system + feature components (public/ admin/ ...)
src/services/       read/view layer per domain (cricket, content, fan, admin)
src/lib/engine/     pure scoring/analytics engine
src/lib/data/       CricketRepository contract + demo & supabase adapters
src/app/actions/    server actions (auth, admin, fan), validated with Zod
supabase/migrations 0001 schema, 0002 functions (security-definer RPCs), 0003 RLS
supabase/seed.sql   optional clearly-labelled demo/instructional seed (never use as real data)
scripts/            local database reset + RLS test harness
tests/              vitest unit/statistics tests, Playwright e2e specs, SQL RLS tests
docs/               operators, scoring, security, SEO, data provider, testing, deployment
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start dev server (demo mode unless Supabase env is set) |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` / `typecheck` | ESLint / strict TypeScript |
| `npm run test` | Vitest unit tests (engine, analytics, validation) |
| `npm run test:e2e` | Playwright e2e suite (chromium + mobile) — boots its own dev server |
| `npm run db:local:reset` | Recreate local test DB and apply all migrations + seed |
| `npm run db:test:rls` | Local Postgres RLS + scoring RPC integration tests |

## Documentation

| Doc | Contents |
| --- | --- |
| `docs/OPERATIONS.md` | Running the platform day-to-day, Supabase setup, roles, migrations |
| `docs/SCORING.md` | Scorer manual: consoles, ball recording, undo, innings flow |
| `docs/SECURITY.md` | Auth, RLS, permissions model, threat controls, environment secrets |
| `docs/SEO.md` | Metadata, JSON-LD, sitemap/robots, i18n plan, performance budget |
| `docs/DATA_PROVIDER.md` | How live data enters the system; provider integration guide |
| `docs/TESTING.md` | Test pyramid, what is verified and what is not, how to run suites |
| `docs/DEPLOYMENT.md` | Vercel + Cloudflare deployment, env matrix, go-live checklist |

## Verified vs unverified (honesty statement)

**Verified locally, this machine:** lint, strict typecheck, 26 unit tests, production build
(29 routes), 22 Playwright e2e tests (desktop + mobile), SQL RLS + scoring RPC integration
tests against a local Postgres database, and the demo data pipeline end-to-end.

**Not verified (no credentials available):**

- Supabase adapter at runtime — migrations and SQL are local-tested, but no Supabase
  project exists; point `NEXT_PUBLIC_SUPABASE_URL`/keys at a real project to activate,
  then replay `supabase/migrations/*.sql` through the Supabase SQL editor or CLI.
- Cloud deployment (Vercel/Cloudflare) — no project/domain credentials provided.
- External cricket data provider — none integrated or claimed. Scores are manual-only
  until a provider is chosen, implemented and verified (see `docs/DATA_PROVIDER.md`).
