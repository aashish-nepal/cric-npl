# Security model

## 1. Identity & sessions

Two interchangeable identity backends behind one helper module (`src/lib/auth/`):

- **Supabase Auth (production)** — email/password users; every user gets a `profiles`
  row via a trigger; role lives in `profiles.role`.
- **Local demo auth** — when Supabase env is absent, logins against the
  `.env.local` demo accounts issue an HttpOnly, SameSite=Lax, signed HMAC cookie
  (`AUTH_SECRET`). Playback against that cookie is impossible without the secret.
  Production requires a strong `AUTH_SECRET`; local machines fall back to a dev
  secret so local dev is never blocked, and this is documented as dev-only.

Rate limits (per identity+IP, in-process in demo mode; swap-in point documented):

- login: 8 attempts / 15 min per email (override in CI via `LOGIN_RATE_LIMIT_MAX`)
- fan actions (vote/predict/comment): modest per-user windows (see `src/lib/rate-limit.ts`)

## 2. Authorization layers

1. **UI/proxy (defense-in-depth)** — `src/proxy.ts` (Next 16 proxy convention) redirects
   unauthenticated visitors from `/admin*` to `/auth/login?next=…`. It only checks for
   session presence, never role — the real check is server-side.
2. **Server-side enforcement (authoritative)** — every admin page and server action calls
   `requirePermission(...)` from `src/lib/permissions.ts`, which resolves the session,
   loads the profile, maps role→allowed permissions, and throws/redirects on failure.
   Failing to pass a permission returns the admin 403 page; pages never render
   protected data before the check.
3. **Database (RLS)** — `supabase/migrations/0003_rls.sql` enables RLS on all tables and
   defines policies: anonymous reads are scoped to published/public rows; insert/update
   operations on cricket/event tables are limited to service role or scorer/admin via
   `security definer` helper functions that check `auth.uid()` + `current_user_role()`.
4. **Column privilege hardening** — `role` and `suspended` on `public.profiles` are
   excluded from direct UPDATE grants for non-admin roles → users cannot self-escalate,
   even with a mis-scoped policy. This is covered by the SQL test suite (`tests/sql/rls.sql`).

## 3. Server action hygiene

- All inputs validated with Zod schemas in `src/lib/validation.ts` before any service call.
- `redirect()` never runs inside `try` (`NEXT_REDIRECT` must not be swallowed) —
  the pattern matches Next.js guidance in the bundled docs.
- Mutating actions re-check session + permission first; ownership checks for editor
  actions; admin-only actions (users, system page) gated to `admin`.
- No secrets are ever read in client components; the service role key is used only in
  server-side Supabase admin clients.

## 4. Image/API security

- No external images are fetched at runtime (avatars are initials/SVG), so no remote
  host allowlist is required.
- `poweredByHeader: false`; security headers (CSP-lite via `next.config.ts`, HSTS nosniff
  etc.) are set in `next.config.ts` and, where needed, at the edge (Cloudflare).

## 5. Data integrity

Every statistic on the site is derived from recorded ball events; there are no manual
override columns in public paths. The scoring RPC (`record_ball_event`) is `security
definer` with internal role checks, transactional, and re-validates that the ball
matches a live innings, legal/illegal allocation, and batter/bowler membership —
defending also against tampering via the anon key.

## 6. Threat-model notes and gaps

- CSRF: server actions + SameSite=Lax cookies cover the state-changing surface in the
  current browser threat model; no cross-site form targets remain.
- Secrets in the repo: none; `.env.example` is placeholder-only.
- Rate limiting in the demo backend is in-process; on horizontal scale swap the
  in-memory store for Redis/Supabase table (interface already abstracted).
- The demo cookie is HttpOnly+HMAC, but demo accounts are always only for local dev.
