# Testing

## Pyramid

| Layer | Command | What it covers |
| --- | --- | --- |
| Static | `npm run lint`, `npm run typecheck` | ESLint (incl. React hooks, a11y rules) and strict TS |
| Unit (Vitest) | `npm run test` | Cricket engine (scoring, extras, partnerships, FoW, NRR, standings, analytics), validation schemas, rate limiting |
| SQL integration | `npm run db:test:rls` | Local Postgres: schema migrations, RLS policies for anon/authenticated/admin, security-definer scoring RPCs (`record_ball_event`, `undo_last_ball`, `cast_poll_vote`), role-escalation guards |
| End-to-end (Playwright) | `npm run test:e2e` | Real browser flows on desktop + mobile |

## Unit tests

34 tests across engine/analytics, standings, credential-detection and provider-registry
suites. Pure functions with deterministic demo fixtures; nothing network-dependent.

## SQL integration harness

`scripts/db-local-reset.sh` creates a local database `npl_cricket_hub_test`, applies
`supabase/migrations/*.sql`, and stubs Supabase internals
(`auth.users` table, `auth.uid()`, `current_user_role()` helpers) so the RLS layer is
exercised with the exact production SQL. `tests/sql/rls.sql` then asserts:

- anon cannot read unpublished/unplayed data; cannot insert/patch score rows;
- scorer can record/undo through RPCs but cannot grant roles;
- users cannot update `profiles.role`/`suspended`;
- polls validate one-vote-per-user and duplicate attempts are rejected;
- `match_events_log` is publicly readable but not writable by anon/authenticated;
- article revision history is staff-only, while media/tag indexes are public;
- notifications are readable only by their owner.

## Playwright e2e

`playwright.config.ts` boots a dedicated demo server on `127.0.0.1:3100` with its own
`.next-e2e` output directory. It forces invalid Supabase placeholders and test-only demo
accounts, so a developer's `.env.local` or hosted project cannot change the test data.
Set `PLAYWRIGHT_BASE_URL` only when intentionally testing a separately managed server.
The suite covers Chromium desktop and Pixel 7 mobile layouts.

- `tests/e2e/public.spec.ts` — homepage surfaces, live & match centre, points table,
  statistics overview + all seven leaderboard sub-routes, team-filter navigation,
  news article open, RSS + sitemap + robots, Nepali landing + every `/ne` section
  route, sitemap coverage for localized/statistics URLs, 404 page.
- `tests/e2e/auth.spec.ts` — unauthenticated `/admin` bounces to login, demo admin
  sign-in → console → sign-out, fan sign-in → fan zone, invalid credentials rejected.
- `tests/e2e/admin-scoring.spec.ts` — record a four then undo it on the live demo
  match; fixture creation validation.
- `tests/e2e/admin-news.spec.ts` — editor creates an article (published mode), it is
  publicly visible immediately at `/news/{slug}`, and editable from the list; moderation
  page loads.
- `tests/e2e/admin-competitions.spec.ts` — admin creates a season and a venue through
  the competition console and sees them listed.
- `tests/e2e/public.spec.ts` — editorial and corrections policy pages render and appear in
  the sitemap.

Two deliberate pieces of test infrastructure:

- `LOGIN_RATE_LIMIT_MAX` is raised by the Playwright web-server env so a full suite
  of sign-ins isn't throttled; production default (8 / 15 min) is untouched.
- Demo backend mutations during e2e (fixtures/articles/recorded balls) are in-memory
  and reset on server restart, which keeps the suite self-contained.

## Executed QA report (2026-11-08)

| Check | Expected result | Actual result | Status |
| --- | --- | --- | --- |
| `npm run lint` | No ESLint errors | Passed | Pass |
| `npm run typecheck` | No TypeScript errors | Passed | Pass |
| `npm test` | Unit suite passes | 34 tests across 5 files passed | Pass |
| `npm run db:test:rls` | Migrations apply; RLS and scoring RPC assertions pass | Passed against local PostgreSQL 14, including migration `0004` | Pass |
| `npm run test:e2e` | Public, admin, auth and mobile flows pass | 33 tests passed: 21 Chromium desktop and 12 mobile | Pass |
| `NEXT_DIST_DIR=.next-build npm run build` | Production compile, static generation and trace collection complete | Passed; all configured routes generated using Next.js 16 Webpack | Pass |
| Turbopack diagnostic in this sandbox | Build completes | Worker failed to bind a port (`Operation not permitted`). The release build script uses the supported Webpack compiler. | Environment blocked |
| Hosted Supabase read-only probe | Public schema is reachable | HTTP 200 for `seasons`, `teams`, `players`, `venues`, `matches`, `ball_events` and `news_articles`; one season and zero rows in the other six tables. Five representative `0004` tables responded. | Pass, read-only only |
| Hosted Auth/write/Realtime smoke | Authorized staff can sign in, score and receive a live update | Not exercised; demo credentials were rejected by hosted Auth and no hosted write was made | Not run |
| Lighthouse/accessibility audit | Target mobile routes meet agreed thresholds | Not run | Not run |
| Vercel/Cloudflare deployment | Preview and production smoke checks pass | No deployment credentials/domain configuration available; no deployment attempted | Not run |

The hosted probe used only public, read-only requests. It confirms endpoint/schema
reachability, not that hosted admin workflows, RLS mutations, Storage or Realtime are
production-ready. No Supabase rows or credentials were changed by these checks.

## Manual QA checklist (no CI needed)

With the demo server running: score one over on the live match, verify the public
match page updates; publish a news article and confirm it appears in `/news` and
`sitemap.xml`; cast a poll vote from a fan account; check tab order + focus rings on
`/auth/login` and the scoring console.
