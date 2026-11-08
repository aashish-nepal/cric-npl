# NPL Cricket Hub — Project Plan

**Status (2026-11-08):** The local application and automated checks are implemented and
verified. A configured hosted Supabase endpoint is reachable, but its public cricket
content is not populated. A licensed provider and cloud deployment are still outstanding,
so this is not yet a production launch.

**Platform:** Next.js 16 App Router, TypeScript, Tailwind CSS 4, Supabase.
**Positioning:** Independent Nepali cricket media, statistics and fan platform. Not
affiliated with the Nepal Premier League or the Cricket Association of Nepal.

---

## 1. Current implementation

The repository now contains the public site, Nepali section, scoring and statistics engine,
admin console, editorial CMS, fan features, Supabase adapter, migrations, SEO routes,
automated tests and operational documentation. The initial directory was empty; that is no
longer an accurate description of the repository.

Local verification passed for lint, strict typecheck, 34 unit tests, the PostgreSQL RLS and
scoring harness, 33 desktop/mobile Playwright tests, and a production build using Next.js
16's Webpack compiler. See `docs/TESTING.md` for the full report.

## 2. External services and current evidence

| Dependency | Current evidence | Remaining work |
|---|---|---|
| Supabase | A configured endpoint returned successful read-only responses. Representative tables introduced by migration `0004` responded. Public queries show 1 season and 0 teams, players, venues, matches, ball events and published articles. | Confirm migration definitions/RLS against the deployment, provision staff accounts, populate verified data, and verify hosted Auth, writes and Realtime. No remote writes were made in this review. |
| Cricket data provider | No external provider adapter, provider key or provider ID is configured. The manual scoring adapter and provider contract are implemented. | Choose a provider with appropriate rights, implement and verify its adapter, or explicitly launch with manual scoring only. |
| Vercel / Cloudflare / domain | No deployment or domain is claimed; deployment tokens were not present in the local environment. | Configure the production project, domain, secrets, preview deployment, DNS/WAF and monitoring. |
| Google Analytics / Search Console / AdSense | Hooks and readiness notes exist; no verification or production integration is claimed. | Configure the relevant properties and verify them after domain setup. |

The local `.env.local` is ignored by Git and must never be copied into documentation or
committed. The tests use explicit demo-only values and do not rely on hosted data.

## 3. Data modes

1. **Supabase:** production adapter backed by normalized PostgreSQL tables, RLS, scoring
   RPCs, Storage and Realtime. A read-only connection is verified; hosted authentication,
   mutation flows and event delivery are not.
2. **Demo:** deterministic local fixture using the same domain types and cricket engine.
   It is visibly labelled, generated from simulated ball events, and mutations reset when
   the server restarts.

No demo score or player statistic is represented as a verified real-world record.

## 4. Scope

Implemented locally: live and completed match views, fixtures, standings, teams, players,
comparison, statistics, seasons, venues, news, fan features, search, admin scoring and CMS,
SEO, security controls, migrations, RLS, tests and operational documentation.

Out of scope for the first release: payments, betting, native apps, push notifications,
dedicated search infrastructure, Redis, microservices and automatic translation of
editorial content.

## 5. Remaining definition-of-done gates

- Populate the hosted project with verified reference data and provision real staff users.
- Verify authorized hosted reads/writes, Auth, RLS behavior, scoring RPCs and Realtime.
- Integrate and verify a licensed data provider, or formally operate with manual scoring.
- Complete accessibility and Lighthouse checks on the production-like deployment.
- Configure Vercel, Cloudflare, domain, backups, monitoring and analytics/Search Console.

The local implementation is reviewable; the hosted production acceptance gates remain open.
