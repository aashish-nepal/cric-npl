# Implementation Roadmap

| Phase | Scope | Status gate |
|---|---|---|
| 0 | Inspect repo, plan, architecture, DB design, roadmap | ✅ complete |
| 1 | Next.js 16 scaffold, TS strict, Tailwind 4, design tokens, layout, nav, footer, error/loading states | typecheck + build |
| 2 | SQL migrations (schema, indexes, RLS, scoring RPC, views), local PostgreSQL verification, Supabase client, auth, seed | migrations apply cleanly; RLS tests pass |
| 3 | Public routes: home, live, matches, fixtures, results, standings, teams, players, venues, seasons | routes render with real repository data |
| 4 | Cricket engine: innings, extras, scorecards, partnerships, FoW, NRR, standings, leaderboards, records | unit tests pass |
| 5 | Admin: auth, dashboard, teams, players, matches, scoring console, corrections, audit | guarded routes; scoring persists |
| 6 | Provider abstraction, sync logging, realtime/polling, manual fallback | interface + docs; realtime verified in degraded mode only |
| 7 | News CMS, predictions, polls, fan zone, comments, bookmarks, moderation | actions validated + authorized |
| 8 | SEO: metadata, JSON-LD, sitemap, robots, breadcrumbs, hreflang, analytics hooks | structured data renders; sitemap builds |
| 9 | Tests: unit, integration, RLS, e2e, accessibility/responsive checks, build audit | report in docs/TESTING.md |
| 10 | Deployment runbook, env example, backup/ops docs | documented only; no deployment claimed |

## Execution notes

- Each phase ends with `typecheck`, `lint`, `test`, and (from phase 1) `build`.
- Demo backend is used for local verification; Supabase adapter is type-checked and documented as requiring a live project.
- The QA report records only executed tests. Unverified external integrations are marked as such.
