# Data provider

## Where the data comes from

NPL Cricket Hub has exactly two data backends, both behind the
`CricketRepository` contract (`src/lib/data/repository.ts`):

1. **Supabase adapter** — production. Everything derives from ball events recorded
   manually by scorers (or written by a future provider). Selected automatically when
   `NEXT_PUBLIC_SUPABASE_URL` is set.
2. **Demo adapter** — deterministic local dataset (NPL-style teams, players, a live
   match and published articles) for development and demos. Always labelled with a
   visible banner; never serves as a source of real scores.

## Current integrations: none (by design)

`CRICKET_PROVIDER=none`. **No external cover/feed/provider is wired in, and no live
score displayed anywhere should be assumed to come from a third party.** Manual scoring
through `/admin` is the only source of match data. This is intentional: fake “live”
scores would be worse than no scores.

## How to integrate a provider (recommended path)

1. **Choose a licensed provider** (e.g. Sportradar, CricAPI, Cricket API partners or a
   BCCI/NPL official feed partner). Record your rights scope in this file.
2. **Introduce one adapter method group**, e.g. `provider.fetchFixture(manifestId)`,
   `provider.fetchBallEvents(manifestId)`, mapping provider entities to the existing
   domain types in `src/types/cricket.ts`.
3. **Write events, never render them** — push provider ball events through the same
   validation the manual scorer uses (`record_ball_event` SQL RPC / engine), then let
   the scorecard/stat services derive everything. The UI does not read provider data
   directly; therefore stats, partnerships and NRR stay consistent and auditable.
4. **Reconcile** — provider-sourced events should be idempotent (prov event id stored on
   the ball row); conflicts (manual correction vs provider revision) resolve last-writer
   with an audit note in `match_events_log`.
5. **Disable demo labels** — set `CRICKET_PROVIDER=…` and the demo banner disappears
   automatically once a real backend (Supabase or provider-backed) is active.

## Realtime

In production the live match page listens to Supabase Realtime channel(s) scoped to
public ball events of live matches. Nothing in demo mode streams (documented limitation).

## What is NOT allowed

- Shipping a page that renders invented or placeholder scores without a provider.
- Labelling provider data as official before rights/verification.
- Bypassing the repository contract with ad-hoc provider calls in UI components.
