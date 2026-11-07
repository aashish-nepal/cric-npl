# Database Design

Authoritative DDL lives in `supabase/migrations/`. This document explains intent and invariants.

## 1. Conventions

- UUID primary keys (`gen_random_uuid()`), `timestamptz` for all instants, UTC storage.
- `created_at`/`updated_at` on mutable tables; `updated_at` maintained by trigger.
- Slugs are unique and URL-safe (`citext`-like lower-case uniqueness enforced by check + unique index).
- Cricket totals (`innings.total_runs`, `wickets`, `legal_balls`) are **derived caches** updated transactionally from `ball_events`; scorecards and standings are computed, not hand-edited.
- Provider identifiers are nullable and unique per provider to guarantee idempotent sync.

## 2. Entity groups

### Competition
`tournaments` → `seasons` → `matches` → `innings` → `ball_events`
Supporting: `venues`, `teams`, `players`, `team_squads`, `playing_xi`.

### Derived / snapshot
`batting_scorecards`, `bowling_scorecards`, `partnerships`, `fall_of_wickets`, `points_table_snapshots`, `player_match_statistics`, `team_match_statistics`. These are regenerated from events; snapshots exist for historical publishing and fast reads.

### Editorial
`news_categories`, `news_articles`, `article_tags`, `article_revisions`, `media_assets`.

### Fan engagement
`polls`, `poll_options`, `fan_votes`, `predictions`, `prediction_options`, `user_predictions`, `comments`, `comment_reports`, `bookmarks`, `notifications`.

### Platform
`profiles`, `admin_audit_logs`, `data_sync_logs`, `search_documents` (materialized search index).

## 3. Cricket invariants

- One innings per `(match_id, innings_number)`.
- `ball_events.provider_event_id` unique per provider → duplicate webhook protection.
- A legal delivery increments `legal_balls`; wides/no-balls do not.
- Extras: `wide`, `no_ball`, `bye`, `leg_bye`, `penalty`. Only wide/no-ball are charged to the bowler.
- Bowler wickets exclude run-out, retired hurt, obstructing the field and timed out.
- `innings.wickets` max 10; an innings ends at the overs quota or 10 wickets.
- NRR: `runs_for / overs_faced − runs_against / overs_bowled`; if a team is all out before its quota, the full quota is used for overs faced (official short-form convention). No-result matches are excluded.
- Standings: win = 2 points (configurable per season), tie/no-result = 1, loss = 0.

## 4. RLS model

Helper functions (SECURITY DEFINER, fixed `search_path`):

- `public.current_role()` → role from `profiles` for `auth.uid()`.
- `public.has_role(min_role)` → hierarchy check.
- `public.is_staff()` → moderator and above.

Policies:

| Table group | anon | authenticated | staff | notes |
|---|---|---|---|---|
| tournaments, seasons, teams, players, venues, squads, fixtures | SELECT (published/active) | SELECT | full write | Public content only |
| matches, innings, ball_events | SELECT | SELECT | scorer+ write | Score writes restricted to `scorer`, `admin`, `super_admin` |
| news (published) | SELECT | SELECT | editor+ write | Drafts invisible to public |
| polls | SELECT | SELECT + vote | admin manage | One vote per user per poll |
| predictions | SELECT | SELECT + own prediction | admin manage | Own rows only |
| comments | SELECT approved | INSERT own, UPDATE own (limited) | moderator+ | Reports staff-only |
| profiles | none | own row | admin all | No email exposure publicly |
| audit/sync logs | none | none | admin | Service role for jobs |

`service_role` bypasses RLS by design and is only used in server-side jobs. It is never shipped to the client.

## 5. Scoring transaction

`record_ball_event(...)` (PL/pgSQL):
1. Locks the innings row (`FOR UPDATE`).
2. Rejects if match is not `live` or innings is closed.
3. Inserts the event, rejecting duplicate `provider_event_id`.
4. Recomputes `total_runs`, `wickets`, `legal_balls`, `extras` from the inserted event.
5. Ends the innings automatically on 10 wickets or quota.
6. Writes an audit row.
7. Returns the updated innings summary.

`undo_last_ball(innings_id)` deletes the newest event, recomputes totals, and writes an audit row. Corrections are always additive/audited; nothing is silently overwritten.

## 6. Indexes

- `matches (season_id, scheduled_at)`, `matches (status)`, unique `matches (slug)`.
- `ball_events (innings_id, over_number, ball_number)`, unique `(innings_id, provider_event_id)`.
- `news_articles (status, published_at desc)`, full-text GIN on title/body.
- Trigram indexes for team/player/venue names for search suggestions.
- `fan_votes (poll_id, user_id)` unique; `user_predictions (prediction_id, user_id)` unique.

## 7. Migration rollback

Each migration has a paired `down` section documented in `docs/DATABASE.md`. Destructive changes are never applied automatically in production; rollback uses the documented reverse DDL inside a transaction.
