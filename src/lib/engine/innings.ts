import type {
  BallEvent,
  BattingEntry,
  BowlingEntry,
  Dismissal,
  ExtrasBreakdown,
  FallOfWicket,
  Innings,
  InningsComputed,
  Partnership,
  WicketType,
} from "@/types/cricket";
import { economy, oversFromBalls, runRate, strikeRate } from "@/lib/utils";

/**
 * Wickets credited to the bowler. Run-outs, retirements, obstruction and timed-out
 * dismissals are never credited to the bowler.
 */
const BOWLER_CREDITED_WICKETS = new Set<WicketType>([
  "bowled",
  "caught",
  "caught_and_bowled",
  "lbw",
  "stumped",
  "hit_wicket",
]);

const EXTRAS_CHARGED_TO_BOWLER = new Set(["wide", "no_ball"]);

export function compareBallEvents(a: BallEvent, b: BallEvent): number {
  if (a.overNumber !== b.overNumber) return a.overNumber - b.overNumber;
  if (a.ballNumber !== b.ballNumber) return a.ballNumber - b.ballNumber;
  return a.createdAt.localeCompare(b.createdAt);
}

interface BattingAccumulator {
  playerId: string;
  position: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissal: Dismissal | null;
}

interface BowlingAccumulator {
  playerId: string;
  legalBalls: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
  /** runs conceded per over number, used for maiden detection */
  perOver: Map<number, number>;
  legalPerOver: Map<number, number>;
}

export interface ComputeInningsOptions {
  /** Override the innings total if the persisted cache is ahead of available events (e.g. partial sync). */
  usePersistedTotals?: boolean;
}

/**
 * Derive an entire innings from its ball events. This is the single source of truth for
 * batting cards, bowling cards, extras, partnerships and fall of wickets.
 */
export function computeInnings(
  innings: Innings,
  allEvents: BallEvent[],
  _options: ComputeInningsOptions = {},
): InningsComputed {
  const events = allEvents
    .filter((event) => event.inningsId === innings.id)
    .map((event, index) => ({ event, index }))
    .sort((a, b) => compareBallEvents(a.event, b.event) || a.index - b.index)
    .map(({ event }) => event);

  const batting = new Map<string, BattingAccumulator>();
  const bowling = new Map<string, BowlingAccumulator>();
  const fallOfWickets: FallOfWicket[] = [];
  const partnerships: Partnership[] = [];

  const appearanceOrder: string[] = [];
  for (const event of events) {
    if (!appearanceOrder.includes(event.batterId)) appearanceOrder.push(event.batterId);
  }

  const extras: ExtrasBreakdown = { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 };
  let runs = 0;
  let wickets = 0;
  let legalBalls = 0;
  let currentPair: [string, string | null] | null = null;
  let pairRuns = 0;
  let pairBalls = 0;
  let pairNumber = 1;
  let appearedCount = 0;
  let awaitingNewBatter = false;
  let survivorId: string | null = null;
  let strikerId: string | null = null;
  let nonStrikerId: string | null = null;

  const ensureBatter = (playerId: string): BattingAccumulator => {
    const existing = batting.get(playerId);
    if (existing) return existing;
    const entry: BattingAccumulator = {
      playerId,
      position: appearanceOrder.indexOf(playerId) + 1,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      dismissal: null,
    };
    batting.set(playerId, entry);
    return entry;
  };

  const ensureBowler = (playerId: string): BowlingAccumulator => {
    const existing = bowling.get(playerId);
    if (existing) return existing;
    const entry: BowlingAccumulator = {
      playerId,
      legalBalls: 0,
      runsConceded: 0,
      wickets: 0,
      wides: 0,
      noBalls: 0,
      perOver: new Map(),
      legalPerOver: new Map(),
    };
    bowling.set(playerId, entry);
    return entry;
  };

  for (const event of events) {
    const batter = ensureBatter(event.batterId);
    const bowler = ensureBowler(event.bowlerId);

    if (!appearanceOrder.slice(0, appearedCount).includes(event.batterId)) {
      appearedCount += 1;
    }

    if (strikerId === null) {
      strikerId = event.batterId;
      currentPair = [event.batterId, null];
    } else if (event.batterId !== strikerId && event.batterId !== nonStrikerId) {
      // A new batter has arrived at the crease.
      if (nonStrikerId === null && !awaitingNewBatter) {
        nonStrikerId = event.batterId;
        if (currentPair && currentPair[1] === null) currentPair[1] = event.batterId;
      } else if (awaitingNewBatter) {
        nonStrikerId = event.batterId;
        if (currentPair && currentPair[0] === survivorId) currentPair[1] = event.batterId;
        awaitingNewBatter = false;
      } else {
        // Strike rotation was not tracked perfectly; treat as the new striker.
        strikerId = event.batterId;
      }
    }

    // Runs and balls faced.
    runs += event.totalRuns;
    if (event.legalBall) legalBalls += 1;
    batter.runs += event.runsBatter;
    if (event.extraType !== "wide") batter.balls += 1;
    if (event.runsBatter === 4) batter.fours += 1;
    if (event.runsBatter === 6) batter.sixes += 1;

    if (currentPair) {
      pairRuns += event.totalRuns;
      if (event.legalBall) pairBalls += 1;
    }

    // Bowling figures.
    if (event.legalBall) bowler.legalBalls += 1;
    const charged = event.extraType && EXTRAS_CHARGED_TO_BOWLER.has(event.extraType) ? event.totalRuns : event.runsBatter;
    bowler.runsConceded += charged;
    bowler.perOver.set(event.overNumber, (bowler.perOver.get(event.overNumber) ?? 0) + charged);
    if (event.legalBall) {
      bowler.legalPerOver.set(event.overNumber, (bowler.legalPerOver.get(event.overNumber) ?? 0) + 1);
    }
    if (event.extraType === "wide") bowler.wides += event.runsExtras;
    if (event.extraType === "no_ball") bowler.noBalls += 1;

    // Extras.
    if (event.extraType) {
      extras.total += event.runsExtras;
      switch (event.extraType) {
        case "wide":
          extras.wides += event.runsExtras;
          break;
        case "no_ball":
          extras.noBalls += event.runsExtras;
          break;
        case "bye":
          extras.byes += event.runsExtras;
          break;
        case "leg_bye":
          extras.legByes += event.runsExtras;
          break;
        case "penalty":
          extras.penalty += event.runsExtras;
          break;
      }
    }

    // Wicket handling.
    if (event.wicketType) {
      const dismissedId = event.dismissedPlayerId ?? event.batterId;
      const dismissed = ensureBatter(dismissedId);
      dismissed.dismissal = {
        type: event.wicketType,
        bowlerId: BOWLER_CREDITED_WICKETS.has(event.wicketType) ? event.bowlerId : null,
        fielderId: event.fielderId,
        dismissedPlayerId: dismissedId,
      };
      if (event.wicketType !== "retired_hurt") {
        wickets += 1;
        if (BOWLER_CREDITED_WICKETS.has(event.wicketType)) {
          bowler.wickets += 1;
        }
        fallOfWickets.push({
          wicketNumber: wickets,
          runs,
          legalBalls,
          over: oversFromBalls(legalBalls),
          batterId: dismissedId,
          dismissalType: event.wicketType,
        });
      }

      const survivor: string | null =
        dismissedId === strikerId ? nonStrikerId : dismissedId === nonStrikerId ? strikerId : strikerId;
      if (currentPair) {
        partnerships.push({
          wicketNumber: pairNumber,
          batterAId: currentPair[0],
          batterBId: currentPair[1] ?? survivor ?? currentPair[0],
          runs: pairRuns,
          legalBalls: pairBalls,
          unbroken: false,
        });
        pairNumber += 1;
      }
      currentPair = survivor ? [survivor, null] : null;
      pairRuns = 0;
      pairBalls = 0;
      awaitingNewBatter = true;
      survivorId = survivor;
      strikerId = survivor;
      nonStrikerId = null;
    } else {
      // Strike rotation on odd runs.
      if (event.totalRuns % 2 === 1 && strikerId && nonStrikerId) {
        const temp: string = strikerId;
        strikerId = nonStrikerId;
        nonStrikerId = temp;
      }
      // End of over.
      if (event.legalBall && legalBalls % 6 === 0 && strikerId && nonStrikerId) {
        const temp: string = strikerId;
        strikerId = nonStrikerId;
        nonStrikerId = temp;
      }
    }
  }

  if (currentPair) {
    partnerships.push({
      wicketNumber: pairNumber,
      batterAId: currentPair[0],
      batterBId: currentPair[1] ?? strikerId ?? currentPair[0],
      runs: pairRuns,
      legalBalls: pairBalls,
      unbroken: true,
    });
  }

  const battingEntries: BattingEntry[] = Array.from(batting.values())
    .sort((a, b) => a.position - b.position)
    .map((entry) => ({
      playerId: entry.playerId,
      position: entry.position,
      runs: entry.runs,
      balls: entry.balls,
      fours: entry.fours,
      sixes: entry.sixes,
      out: entry.dismissal !== null && entry.dismissal.type !== "retired_hurt",
      dismissal: entry.dismissal,
      strikeRate: strikeRate(entry.runs, entry.balls),
    }));

  const bowlingEntries: BowlingEntry[] = Array.from(bowling.values())
    .filter((entry) => entry.legalBalls > 0 || entry.wides > 0 || entry.noBalls > 0)
    .map((entry) => {
      let maidens = 0;
      for (const [over, legal] of entry.legalPerOver) {
        if (legal === 6 && (entry.perOver.get(over) ?? 0) === 0) maidens += 1;
      }
      return {
        playerId: entry.playerId,
        legalBalls: entry.legalBalls,
        maidens,
        runsConceded: entry.runsConceded,
        wickets: entry.wickets,
        wides: entry.wides,
        noBalls: entry.noBalls,
        economy: economy(entry.runsConceded, entry.legalBalls),
        overs: oversFromBalls(entry.legalBalls),
      };
    })
    .sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded);

  const lastFiveOversRuns = sumLastOvers(events, 5, "runs");
  const lastFiveOversWickets = sumLastOvers(events, 5, "wickets");

  return {
    innings,
    runs,
    wickets,
    legalBalls,
    overs: oversFromBalls(legalBalls),
    runRate: runRate(runs, legalBalls),
    batting: battingEntries,
    bowling: bowlingEntries,
    fallOfWickets,
    partnerships,
    extras,
    lastFiveOversRuns,
    lastFiveOversWickets,
    isAllOut: wickets >= 10,
    isClosed: innings.closed,
  };
}

function sumLastOvers(events: BallEvent[], overs: number, mode: "runs" | "wickets"): number {
  if (events.length === 0) return 0;
  const lastOver = events.reduce((max, event) => Math.max(max, event.overNumber), 1);
  const threshold = Math.max(1, lastOver - overs + 1);
  let total = 0;
  for (const event of events) {
    if (event.overNumber < threshold) continue;
    if (mode === "runs") total += event.totalRuns;
    else if (event.wicketType && event.wicketType !== "retired_hurt") total += 1;
  }
  return total;
}

/** True if the delivery is a legal ball (wides and no-balls are not). */
export function isLegalDelivery(extraType: BallEvent["extraType"]): boolean {
  return extraType !== "wide" && extraType !== "no_ball";
}

export function nextDeliveryPosition(legalBalls: number): { overNumber: number; ballNumber: number } {
  return {
    overNumber: Math.floor(legalBalls / 6) + 1,
    ballNumber: (legalBalls % 6) + 1,
  };
}

/** Innings are complete at the quota or ten wickets. */
export function isInningsComplete(legalBalls: number, wickets: number, ballsPerInnings = 120): boolean {
  return wickets >= 10 || legalBalls >= ballsPerInnings;
}
