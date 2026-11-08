# Implementation Roadmap

Status reviewed 2026-11-08. “Local complete” means the feature works against the
deterministic demo backend and the listed local checks pass. It does not imply hosted
production acceptance.

| Phase | Scope | Status |
|---|---|---|
| 0 | Repository inspection, architecture, database design and roadmap | ✅ Complete |
| 1 | Next.js 16 foundation, TypeScript, Tailwind, layouts and shared UI | ✅ Complete; lint, typecheck and production build pass |
| 2 | Schema, migrations, RLS, scoring RPCs, Supabase client, Auth and seed | ✅ Local PostgreSQL migrations/RLS pass. Hosted endpoint and `0004` tables respond read-only; hosted Auth and mutations remain unverified. |
| 3 | Public routes, search and responsive navigation | ✅ Demo routes verified by desktop/mobile E2E. Hosted project currently has no public match or editorial data. |
| 4 | Scoring engine, scorecards, standings, NRR and leaderboards | ✅ Implemented and covered by 34 unit tests plus SQL scoring tests. |
| 5 | Admin, role checks, match scoring, competitions, CMS and moderation | ✅ Local flows covered by Playwright. Hosted staff accounts and persistence remain unverified. |
| 6 | Provider abstraction, sync logging, realtime and manual fallback | ⚠️ Abstraction and fallback implemented. No licensed provider is configured; hosted Realtime delivery is not verified. |
| 7 | Editorial CMS, polls, predictions, comments and bookmarks | ✅ Demo workflows covered locally; hosted authentication and storage are not verified. |
| 8 | Metadata, JSON-LD, sitemap, robots, localization and analytics hooks | ✅ Routes and sitemap covered locally. Search Console and analytics properties are not configured. |
| 9 | Unit, SQL, E2E and build checks | ✅ 34 unit tests, local SQL/RLS harness, 33 desktop/mobile E2E tests, lint, typecheck and Webpack build pass. Lighthouse/accessibility audits remain outstanding. |
| 10 | Deployment, environment, backup and operations documentation | ⚠️ Runbooks exist. No Vercel/Cloudflare/domain deployment is configured or claimed. |

## External release gates

1. Confirm the hosted schema and policies, create authorized staff accounts, and enter
   verified teams, players, venues, fixtures and editorial content.
2. Verify hosted Auth, RLS, scoring writes, Storage and Realtime with a controlled test
   match; remove the test data through an approved cleanup.
3. Choose and verify a licensed cricket provider, or explicitly launch with manual scoring.
4. Configure the Vercel project, domain, Cloudflare, production secrets, backup/monitoring,
   analytics and Search Console; deploy and smoke-test a preview before production.

Do not mark these gates complete until they have actually been exercised against the
production-like services.
