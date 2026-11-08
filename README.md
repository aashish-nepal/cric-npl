# NPL Cricket Hub

A production-oriented, SEO-first platform for live NPL (Nepal Premier League) cricket scores,
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
  and `robots.txt`, hreflang alternates and a full Nepali section (`/ne/live`,
  `/ne/fixtures`, `/ne/results`, `/ne/points-table`, `/ne/statistics`, `/ne/news`,
  `/ne/teams`, `/ne/players`, `/ne/seasons`, `/ne/venues`, `/ne/fan-zone`).
- **Live updates** — Supabase Realtime channel per live match fed by
  `match_events_log`, with duplicate suppression, exponential reconnect and polling
  fallback in demo mode.
- **Admin** — dashboard, competition setup (tournaments, seasons, venues), match
  management, a real ball-by-ball scoring console with undo, article/workflow
  publishing with image uploads and revision history, comment moderation, user role
  management and a runtime-system status page with provider sync logging.
- **Security** — server-side role checks (`requirePermission`) in every admin page/action,
  defense-in-depth `proxy.ts` gate, Supabase RLS policies on all tables, rate-limited
  login/fan actions, HttpOnly session cookies, column grants that block role self-escalation.

## Quick start (demo mode, zero configuration)

```bash
npm install
npm run dev          # http://localhost:3000
```

A fresh checkout with no `.env.local` starts in **demo mode** with a deterministic dataset
of NPL-style teams, players and matches. The persistent banner marks all demo data, and demo
admin mutations reset when the server restarts. Placeholder values from `.env.example` are
rejected. A valid Supabase configuration selects the hosted adapter; that project must have
public data and staff accounts provisioned before it is ready for use. The Playwright suite
pins its own demo configuration regardless of the developer's local environment.

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
supabase/migrations 0001 schema, 0002 functions (security-definer RPCs), 0003 RLS,
                    0004 realtime event log + completion tables
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

## Verification status (2026-11-08)

**Verified locally:** ESLint, strict TypeScript, 34 Vitest tests, a Webpack production build,
the local PostgreSQL migration/RLS/scoring harness, and 33 Playwright checks across desktop
and mobile. See [docs/TESTING.md](docs/TESTING.md) for commands and results.

**Hosted Supabase:** the configured endpoint and representative tables from migration
`0004` responded to read-only checks. The project currently has one season and no teams, players, venues,
matches, ball events or published articles. Hosted Auth, write operations and Realtime have
not been verified; no hosted schema or content was changed during this review.

**Still required for a production launch:** populate the hosted project with verified
reference data, provision staff accounts, select and verify a licensed cricket data provider
(or explicitly launch with manual scoring only), configure analytics/Search Console, and
deploy through Vercel/Cloudflare with the production domain. No cloud deployment or external
cricket feed is claimed.
