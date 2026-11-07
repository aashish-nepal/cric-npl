# Architecture

## 1. Runtime shape

```
Browser
  │  RSC payload / HTML (SEO-first)
  ▼
Next.js 16 App Router on Vercel
  ├── Server Components  → services → repository ─┐
  ├── Server Actions     → auth + zod + service   │
  ├── Route Handlers     → search, live polling   │
  └── Middleware         → /admin session gate    │
                                                  ▼
                                    ┌─────────────────────────┐
                                    │ CricketRepository       │
                                    ├───────────┬─────────────┤
                                    │ Supabase  │ Demo (seed) │
                                    └───────────┴─────────────┘
                                          │
                              PostgreSQL + RLS + Realtime
```

- **Server Components by default.** Client components are limited to navigation state, search, tabs, charts, scoring console and live refresh.
- **No public API is required for rendering.** Pages read through the server repository directly, avoiding an internal HTTP hop.
- **Two backends, one contract.** `src/lib/data/repository.ts` defines the contract. `demo.ts` and `supabase.ts` implement it. Selection is by environment (`NEXT_PUBLIC_SUPABASE_URL` present → Supabase, otherwise demo).
- **Statistics are derived, never stored as editable totals.** `src/lib/engine` turns ball events into scorecards, standings, leaderboards and records. The SQL layer also exposes derived views/functions for server-side reporting and admin dashboards.

## 2. Domain layers

| Layer | Location | Responsibility |
|---|---|---|
| Domain types | `src/types` | Framework-free TypeScript models |
| Cricket engine | `src/lib/engine` | Pure functions: innings, extras, scorecards, partnerships, FoW, NRR, standings, leaderboards |
| Repository | `src/lib/data` | Loads normalized season bundles; demo and Supabase adapters |
| Services | `src/services` | Composes repository + engine into page view models |
| Validation | `src/lib/validation` | Zod schemas shared by actions and APIs |
| Auth / permissions | `src/lib/auth`, `src/lib/permissions` | Session resolution, role hierarchy, server guards |
| SEO | `src/lib/seo` | Metadata builders, JSON-LD, sitemap data |
| UI primitives | `src/components/ui` | shadcn-style accessible primitives |
| Feature UI | `src/components/*` | Cricket-specific presentation |

## 3. Rendering and caching

| Route class | Strategy | Reason |
|---|---|---|
| Home, live, match centre, standings, stats | Dynamic SSR (`force-dynamic`) | Live/admin mutations must appear immediately in demo mode |
| Team/player/news/season profiles | SSR with `revalidate` where safe | Stable content, cheap to regenerate |
| Admin | Dynamic, no-store | Private |
| Static assets | Immutable | Fonts/images |

Production caching plan (documented, not enabled without Redis): wrap read services in `unstable_cache`/`revalidateTag` with tags `season:{id}`, `match:{id}`, `news`, `standings:{season}`. Invalidation happens in scoring/editorial actions. A Redis adapter can replace the cache functions without touching pages.

## 4. Realtime and live updates

1. Scorer (admin) records a ball → server action validates → transactional write (Supabase RPC `record_ball_event`) → innings totals updated → audit row.
2. Supabase Realtime broadcasts the changed `ball_events`/`innings` row on a per-match channel (`match:{matchId}`), not a global channel.
3. The match page subscribes only to its own channel when `NEXT_PUBLIC_SUPABASE_URL` is configured.
4. Without Supabase, the live client polls `/api/matches/[slug]/live` every 15 s while the tab is visible, and stops when hidden. This is explicitly a degraded mode.
5. Reconnection: the hook re-subscribes with backoff; duplicate events are prevented by `provider_event_id` unique constraints and client-side sequence checks.

## 5. Authentication and authorization

- Production: Supabase Auth (email/password + magic link ready), `profiles.role`, RLS on every exposed table. Server guards re-check roles; the UI is never the authority.
- Local demo: signed HttpOnly cookie (HMAC-SHA256, `AUTH_SECRET`), three seeded accounts (super admin, editor, fan). Clearly a demo mechanism; production refuses to start demo auth when `NODE_ENV=production` and Supabase is configured.
- Role hierarchy: `public < user < moderator < author < editor < scorer < admin < super_admin`. Permission checks are centralized in `src/lib/permissions`.

## 6. Security controls

- Zod validation on every action/API boundary.
- Parameterized SQL only (Supabase client / SQL functions), no string-built queries.
- Markdown rendered through a whitelist renderer (no raw HTML injection).
- Rate limiting on search, votes, comments, login (in-memory token bucket; Redis-ready interface).
- Uploads validated by MIME, extension and size in the Supabase Storage policy; demo mode has no uploads.
- Security headers in `next.config.ts`; secrets only in server modules.
- Audit log for all administrative mutations.

## 7. Directory map

```
src/app/(public)      public routes
src/app/admin         dashboard + scoring
src/app/api           search, live score, health
src/app/auth          login/callback
src/components        ui + feature components
src/lib               data, engine, auth, seo, validation, utils
src/services          view-model composition
supabase/migrations   schema, RLS, scoring RPCs, views
tests                 unit, integration, e2e
docs                  architecture, DB, API, SEO, security, deployment, testing
```

## 8. Key architectural decisions

| Decision | Rationale |
|---|---|
| Derive all stats from ball events | Traceability, no stale manually maintained numbers |
| Season bundle loading | Avoids N+1 queries; one query set per season, memoized |
| Same engine in both backends | One tested source of truth for cricket rules |
| SQL views/RPCs alongside TS engine | Fast server-side aggregation and atomic scoring |
| Demo mode first-class | Honest local verification without fake credentials |
| No Redis initially | In-process cache + tag-based invalidation seam |
