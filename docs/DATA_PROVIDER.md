# Data provider

## Where the data comes from

NPL Cricket Hub has exactly two data backends, both behind the
`CricketRepository` contract (`src/lib/data/repository.ts`):

1. **Supabase adapter** — production. Everything derives from ball events recorded
   manually by scorers (or written by a verified provider). Selected automatically when
   both a plausible `NEXT_PUBLIC_SUPABASE_URL` and anon key are set; placeholder values
   are rejected so the app stays in demo mode.
2. **Demo adapter** — deterministic local dataset (NPL-style teams, players, a live
   match and published articles) for development and demos. Always labelled with a
   visible banner; never serves as a source of real scores.

## Current integrations: none (by design)

`CRICKET_PROVIDER=none`. **No external cover/feed/provider is wired in, and no live
score displayed anywhere should be assumed to come from a third party.** Manual scoring
through `/admin` is the only source of match data. This is intentional: fake “live”
scores would be worse than no scores.

## Provider adapter contract (implemented, no live adapter)

`src/services/cricket-data/` contains the provider-independent contract and registry:

- `types.ts` — Zod-validated provider entities (`ProviderFixture`, `ProviderBallEvent`,
  scorecards, live scores) and the `CricketDataProvider` interface.
- `manual.ts` — the default adapter. It returns empty collections rather than inventing
  scores, so a sync run is logged as `skipped`.
- `index.ts` — `createCricketDataProvider()`. Unknown provider names fail loudly; there
  is no silent fallback that could be mistaken for a working feed.
- `sync.ts` — validates fixtures, counts accepted/rejected rows and writes an auditable
  row to `data_sync_logs`. Ingestion is intentionally adapter-specific.

## How to integrate a provider (recommended path)

1. **Choose a licensed provider** (e.g. Sportradar, CricAPI, Cricket API partners or a
   BCCI/NPL official feed partner). Record your rights scope in this file.
2. **Implement `CricketDataProvider`** in `src/services/cricket-data/`, map provider
   entities to the existing domain types and register the factory in `index.ts`.
3. **Write events, never render them** — push provider ball events through the same
   validation the manual scorer uses (`record_ball_event` SQL RPC / engine), then let
   the scorecard/stat services derive everything. The UI does not read provider data
   directly; therefore stats, partnerships and NRR stay consistent and auditable.
4. **Reconcile** — provider-sourced events should be idempotent (provider event id
   stored on the ball row); conflicts (manual correction vs provider revision) resolve
   last-writer with an audit note in `match_events_log`.
5. **Verify before enabling** — set `CRICKET_PROVIDER=<id>` only after the adapter's
   `verified` flag is true and the sync log shows accepted fixtures. The admin
   `/admin/system` page exposes a manual "Run sync" control.

## Realtime

Production live pages subscribe to one Supabase Realtime channel per match. Triggers on
`ball_events`, `innings` and `matches` write to `public.match_events_log`; the browser
subscribes with `filter: match_id=eq.<matchId>` so visitors never receive other matches'
traffic. The client de-duplicates event ids, debounces refreshes, reconnects with
exponential backoff and falls back to polling if Realtime is unavailable. In demo mode
(no Supabase credentials) it polls every 20 seconds and clearly labels the state.

## What is NOT allowed

- Shipping a page that renders invented or placeholder scores without a provider.
- Labelling provider data as official before rights/verification.
- Bypassing the repository contract with ad-hoc provider calls in UI components.
