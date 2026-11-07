# Scorer manual

How to run a match through the manual scoring console (`/admin/matches/[id]`).
Requires the `scorer` or `admin` role. Every screen below is also keyboard-reachable;
totals, commentary and the public scorecard update instantly after each ball.

## 1. Before the match

Create the fixture in `/admin/matches/new` or `/admin/matches` → “Create fixture”:
season, home/away team, venue, start time, optional match number. Validation (Zod)
blocks duplicates and “a team cannot play itself”.

## 2. Match setup (after the toss)

Open the match console. In **Match setup**:

1. Choose the team batting first.
2. Pick the first opener, second opener and the opening bowler. The lists only show
   players from the relevant squads.
3. **Save match setup** — match flips to “live” and the recording console unlocks.

Changing setup later is possible until the first ball is recorded.

## 3. Recording a delivery

The console defaults are safe:

- **Striker / Non-striker** — current batters (openers initially, then whoever is in).
  The non-striker list **excludes the striker** and any dismissed/opening batters, so a
  batter can never be duplicated while at the crease.
- **Bowler** — last bowler by default; the list excludes whoever bowled the previous over
  (consecutive-over guard).
- **Runs off the bat** — 0–6 radio group.
- **Extra** — none, wide, no-ball, or bye/leg-bye with “Extra runs”.
  A wide/no-ball always also contributes the penalty run to the bowling figures.
- **Wicket** — dismissed batter + type (bowled/lbw/caught/run out/stumped/hit wicket/
  caught & bowled/other) + optional fielder (required for caught / run out / stumped).
- **Commentary (optional)** — free text up to ~300 chars; shown on the public match page.

Then **Record ball**. One click = one ball. The Recent deliveries list (with over-ball
numbers and running totals) lets the scorer eyeball the previous balls before continuing.

Derived effects of each recorded ball, handled by the engine/RPC:

- strike rotation on odd runs and at over end, end-of-over rotation, new-over reset of
  legal-ball counters, extras split (penalties to the bowler, byes/leg-byes not to the
  batter), partnership breaks and falls of wicket, dismissal of the batter, and
  completed-match/innings bookkeeping where applicable.

## 4. Undo

**Undo last delivery** removes the most recent ball and restores the exact previous
state (strike, totals, dismissals, commentary). Undo is one-deep per click; press it
repeatedly to roll back several balls. The service layer recomputes scorecards from
ball events, so state after undo is exact — nothing needs re-entering.

## 5. Innings transitions

- **Close innings** — closes the current innings (all-out, target reached, or declared/
  restricted end chosen by the scorer), then the same console serves the next innings.
  Choose the openers when prompted.
- **Complete match** — only enabled once the fixtures’ innings are closed. Then pick:
  winning team (or “no result”), margin type (runs/wickets), margin value, and optionally
  a Player of the Match. On submission, the match becomes **completed**: it moves to
  results, enters standings/NRR and every player statistic everywhere on the site.

## 6. Retirement / interrupts

Retired-hurt or retired-out is entered as a custom “other” flow via commentary and
undo if needed — until a provider drives the data, exotic interrupts (rain/DLS) are
handled by the scorer editing the target note in the match notes field. The engine
computes target/NRR from recorded data only and never invents anything.

## 7. What the scorer must not do

- Record balls for a second innings before closing the first.
- Select an opener who has already been dismissed (the UI prevents this).
- Manually “adjust” totals — there is no field to edit scorecards by hand by design;
  corrections happen by undo + re-record so stats, partnerships and FoW stay truthful.
