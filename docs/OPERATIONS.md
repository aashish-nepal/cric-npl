# Operations manual

Day-to-day operation of NPL Cricket Hub.

## 1. Environment

Copy `.env.example` → `.env.local`. Required for production:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase project. **Setting these switches the app out of demo mode.** |
| `AUTH_SECRET` | HMAC key for session cookies. Generate: `openssl rand -base64 48`. |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin (e.g. `https://nplcrickethub.com`) |
| `CRICKET_PROVIDER` | `none` (manual scoring) until a provider is integrated. |

Demo-only variables (`ADMIN_EMAIL`, `EDITOR_EMAIL`, `FAN_EMAIL`, passwords) are only read
when Supabase is not configured. Demo data is labelled; a banner is always visible.

## 2. Supabase setup (first production boot)

1. Create a project; note the URL and keys.
2. Run the SQL editor migrations **in order**:
   `supabase/migrations/0001_schema.sql` → `0002_functions.sql` → `0003_rls.sql`.
   All three are idempotent plain SQL (no bundled CLI assumed).
3. **Do not** apply `supabase/seed.sql` to production — it is a demo/instructional seed.
4. Create auth users (Dashboard → Authentication → Add user, email+password) for every
   scorer/editor/admin. Then assign roles by **direct SQL**:

   ```sql
   update public.profiles set role = 'admin'  where email = 'ops@yourdomain.com';
   update public.profiles set role = 'scorer' where email = 'scorer@yourdomain.com';
   update public.profiles set role = 'editor' where email = 'news@yourdomain.com';
   ```

   `profiles` rows are created automatically by the `on_auth_user_created` trigger.
5. Set `SUPABASE_SERVICE_ROLE_KEY` **only** in server-side secrets — it bypasses RLS.

## 3. Reference data setup

Create, via `/admin` (or seed SQL you author yourself), in this order:

1. Seasons → 2. Teams → 3. Players (team roster) → 4. Venues → 5. Fixtures.

Fixtures become openable in the scoring console once teams/venues exist and the start
time has arrived (past matches can also be opened for correction).

## 4. Match-day operations flow

1. **Before the toss** — confirm fixture in `/admin/matches`.
2. **After the toss** — select the batting team, openers and opening bowler in the
   “Match setup” panel (`/admin/matches/[id]`), and “Save match setup”. Match → live.
3. **During the innings** — a scorer records every ball in “Record a delivery”
   (runs, extras type, wicket, commentary). Mistakes are fixed with “Undo last delivery”.
4. **Innings end** — “Close innings” closes the current innings and pre-fills the next
   batters/bowler; openers are then selected and play continues.
5. **Match end** — “Complete match”, then the result form (winner, margin/neutral result,
   optional Player of the Match). Published matches power results, standings and stats.
6. **Corrections after completion** — reopen via the match page (status → live) is only
   for admins; prefer correcting before completion. Stats and NRR recompute automatically
   from the underlying ball events.

## 5. Editorial workflow

- `draft` articles are visible only in `/admin/news`; `published` immediately goes live
  at `/news/{slug}` and appears in `sitemap.xml` and the RSS feed.
- Comments are `pending` by default and become visible only after approval in
  `/admin/comments`. Approval/flush are one-click server actions, rate-limited.

## 6. Users and roles

Roles: `admin` (everything, incl. user management + system page), `scorer` (matches &
scoring), `editor` (news, comments, guides), `fan` (read + fan actions).
Checks live in `src/lib/permissions.ts` (`requirePermission`) and are enforced
server-side in every admin page and action; `src/proxy.ts` only makes unauthenticated
traffic bounce to `/auth/login` early.

Suspend/block a user: Admins → `/admin/users` (blocks login and actions via RLS + actions).

## 7. Health / monitoring

- `/admin/system` shows runtime configuration (backend mode, provider, rate limits),
  data counts and latencies for the logged-in admin.
- Uptime probe: `GET /` should return 200; `GET /sitemap.xml` exercises SEO routes.

## 8. Backups & data restoration

- Enable Supabase daily backups; export additionally with
  `pg_dump "$DATABASE_URL" -Fc -f nplcrickethub-$(date +%F).dump`.
- The single source of truth for cricket stats is `ball_events`. Finish matches can be
  fully recomputed from that table, so it must be in every backup.

## 9. Known demo-mode limitations

- Demo backend mutations are in-memory; they vanish on server restart.
- No realtime is used in demo mode (full Supabase Realtime wiring is only live when
  the Supabase adapter is active).
