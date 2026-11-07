# Testing

## Pyramid

| Layer | Command | What it covers |
| --- | --- | --- |
| Static | `npm run lint`, `npm run typecheck` | ESLint (incl. React hooks, a11y rules) and strict TS |
| Unit (Vitest) | `npm run test` | Cricket engine (scoring, extras, partnerships, FoW, NRR, standings, analytics), validation schemas, rate limiting |
| SQL integration | `npm run db:test:rls` | Local Postgres: schema migrations, RLS policies for anon/authenticated/admin, security-definer scoring RPCs (`record_ball_event`, `undo_last_ball`, `cast_poll_vote`), role-escalation guards |
| End-to-end (Playwright) | `npm run test:e2e` | Real browser flows on desktop + mobile |

## Unit tests

26 tests across engine/analytics suites. Pure functions with deterministic demo
fixtures; nothing network-dependent.

## SQL integration harness

`scripts/db-local-reset.sh` creates a local database `npl_cricket_hub_test`, applies
`supabase/migrations/*.sql`, and stubs Supabase internals
(`auth.users` table, `auth.uid()`, `current_user_role()` helpers) so the RLS layer is
exercised with the exact production SQL. `tests/sql/rls.sql` then asserts:

- anon cannot read unpublished/unplayed data; cannot insert/patch score rows;
- scorer can record/undo through RPCs but cannot grant roles;
- users cannot update `profiles.role`/`suspended`;
- polls validate one-vote-per-user and duplicate attempts are rejected.

## Playwright e2e

`playwright.config.ts` boots `npm run dev` itself (or reuses
`PLAYWRIGHT_BASE_URL`), tests both desktop (1440×1000) and mobile (iPhone metrics).

- `tests/e2e/public.spec.ts` — homepage surfaces, live & match centre, points table,
  news article open, RSS + sitemap + robots, Nepali landing, 404 page.
- `tests/e2e/auth.spec.ts` — unauthenticated `/admin` bounces to login, demo admin
  sign-in → console → sign-out, fan sign-in → fan zone, invalid credentials rejected.
- `tests/e2e/admin-scoring.spec.ts` — record a four then undo it on the live demo
  match; fixture creation validation.
- `tests/e2e/admin-news.spec.ts` — editor creates an article (published mode), it is
  publicly visible immediately at `/news/{slug}`, and editable from the list; moderation
  page loads.

Two deliberate pieces of test infrastructure:

- `LOGIN_RATE_LIMIT_MAX` is raised by the Playwright web-server env so a full suite
  of sign-ins isn't throttled; production default (8 / 15 min) is untouched.
- Demo backend mutations during e2e (fixtures/articles/recorded balls) are in-memory
  and reset on server restart, which keeps the suite self-contained.

## Verified locally vs not verified

- **Verified:** every cell of the table above, on this machine, including the SQL
  harness against a real local Postgres 14.
- **Not verified:** the Supabase adapter against a hosted Supabase project (no
  credentials exist), and any cloud deployment. Those are documented in
  `docs/OPERATIONS.md` and `docs/DEPLOYMENT.md`.

## Manual QA checklist (no CI needed)

With the demo server running: score one over on the live match, verify the public
match page updates; publish a news article and confirm it appears in `/news` and
`sitemap.xml`; cast a poll vote from a fan account; check tab order + focus rings on
`/auth/login` and the scoring console.
