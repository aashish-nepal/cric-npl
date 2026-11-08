# Deployment

## Status: not deployed

The hosted Supabase endpoint in the local environment responded to read-only checks and
has representative tables introduced by migration `0004`. Its current public data is
incomplete: one season and no teams, players, venues, matches, ball events or articles. No
hosted schema or content was changed. Vercel, Cloudflare and domain credentials/configuration
were not available, so no cloud deployment has been attempted.

## Recommended topology

- **Compute:** Vercel (Next.js App Router) — zero-config for this repo.
- **Data:** Supabase project (Postgres + Auth + Realtime + Storage + RLS).
- **Edge/CDN + WAF:** Cloudflare in front of Vercel; caching: static assets edge-cached,
  HTML for public pages revalidated per route (`revalidate` in App Router metadata),
  never cached for `/admin`, `/auth`, `/api`, fan-action routes.
- **Domain:** e.g. `nplcrickethub.com` (+ `/ne` same domain).

## Environment matrix (Vercel project settings)

| Variable |environments | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | from Supabase → API settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | **server-only secret**; never expose to client |
| `AUTH_SECRET` | Production, Preview | `openssl rand -base64 48` |
| `NEXT_PUBLIC_SITE_URL` | All | `https://nplcrickethub.com`, previews: `https://<slug>.vercel.app` |
| `CRICKET_PROVIDER` | All | `none` until an integration is verified |
| Analytics vars (`GA`, verification) | Production | optional |

## Go-live checklist (execute in order)

1. **Supabase project**: compare the deployed schema, RLS policies, RPCs, Storage bucket
   and migration history with `0001→0002→0003→0004`. The `0004` tables were visible in a
   read-only check, so inspect before applying anything; do not blindly replay migrations.
   Skip `seed.sql` (demo only). Enable daily backups.
2. **Auth users**: create auth users, then assign roles via SQL (see `docs/OPERATIONS.md` §2).
3. **Reference data**: seasons → teams → players → venues → fixtures via `/admin`.
4. **Vercel**: import repo, configure the env matrix above, deploy a preview first.
5. **Smoke-test the preview**: sign in on `/admin/system` and confirm
   backend = `supabase`, banner gone; record one test match end-to-end with the scorer.
6. **Cloudflare**: zone + DNS → Vercel CNAME; SSL Full(strict); WAF rate rule on
   `/api/*` and fan actions; cache rules per above.
7. **Domain + prod deploy**: update `NEXT_PUBLIC_SITE_URL`, redeploy, verify canonical
   URLs and `robots.txt`/`sitemap.xml`.
8. **Search Console**: verify domain, submit sitemap, validate JSON-LD.
9. **Monitoring**: uptime on `/` and `/sitemap.xml`; Supabase alerting; Vercel analytics.

## Rollback

- Vercel instant rollback to previous deployment.
- DB: point-in-time restore from Supabase backups — remember
  **`ball_events` is the source of truth** and recompute stats if a restore occurs.
- Feature flags: switching `CRICKET_PROVIDER`/env never leaves the site in a state
  without a visible banner or a working manual fallback.

## CI

GitHub Actions (or Vercel Git integration):

```yaml
# gates (run in order, stop on first failure)
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright test --with-deps chromium
npm run db:test:rls   # needs a postgres service container
```

## Post-deploy reminders

- Double-check admin rate-limit defaults are NOT loosened
  (`LOGIN_RATE_LIMIT_MAX` must be unset in Production).
- Keep `docs/OPERATIONS.md` as the operator runbook; migrate any one-off manual SQL
  into a numbered migration file for history.
