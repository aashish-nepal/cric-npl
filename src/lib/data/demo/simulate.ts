import type {
  BallEvent,
  ExtraType,
  Innings,
  Player,
  WicketType,
} from "@/types/cricket";
import { isInningsComplete } from "@/lib/engine/innings";

export interface SimulateInningsOptions {
  inningsId: string;
  matchId: string;
  battingTeamId: string;
  bowlingTeamId: string;
  battingXI: Player[];
  bowlingXI: Player[];
  seed: number;
  target?: number | null;
  maxBalls?: number;
  /** Stop mid-innings at this many legal balls (live demo match). */
  partialAtBalls?: number;
  baseTime: string;
}

export interface SimulatedInnings {
  innings: Innings;
  events: BallEvent[];
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function surname(fullName: string): string {
  const parts = fullName.split(" ");
  return parts[parts.length - 1] ?? fullName;
}

function choose<T>(items: T[], index: number): T {
  return items[index % items.length] as T;
}

const RUN_COMMENTARY: Record<number, string[]> = {
  0: [
    "defended solidly back down the pitch",
    "beaten outside off, no run",
    "pushed to cover, no run",
    "good length, blocked",
    "swings and misses",
  ],
  1: [
    "nudged into the leg side for a single",
    "worked through point for one",
    "dropped into the off side, quick single",
    "tucked off the pads for one",
  ],
  2: ["driven into the gap, two runs", "clipped square for a couple", "good running, two more"],
  3: ["placed into the deep, three runs", "excellent running between the wickets, three"],
  4: ["FOUR! cracked through the covers", "FOUR! flicked fine off the pads", "FOUR! cut hard past point", "FOUR! driven straight down the ground"],
  6: ["SIX! launched over long-on", "SIX! pulled flat into the stands", "SIX! slog-swept over midwicket", "SIX! lofted over extra cover"],
};

const WICKET_TEXT: Record<WicketType, string> = {
  bowled: "through the gate and into the stumps",
  caught: "picks out the fielder",
  caught_and_bowled: "leading edge back to the bowler",
  lbw: "trapped in front, the finger goes up",
  run_out: "short of the crease, run out",
  stumped: "beaten in the flight and stumped",
  hit_wicket: "chopped onto his own stumps",
  retired_hurt: "retires hurt",
  obstructing_field: "obstructing the field",
  timed_out: "timed out",
};

export function simulateInnings(options: SimulateInningsOptions): SimulatedInnings {
  const {
    inningsId,
    matchId,
    battingTeamId,
    bowlingTeamId,
    battingXI,
    bowlingXI,
    seed,
    target = null,
    maxBalls = 120,
    partialAtBalls,
    baseTime,
  } = options;

  const rng = mulberry32(seed);
  const events: BallEvent[] = [];
  const base = new Date(baseTime).getTime();

  const eligibleBowlers = bowlingXI.filter((player) => player.bowlingStyle !== "None");
  const attack = eligibleBowlers.length >= 5 ? eligibleBowlers : bowlingXI;
  const oversBowled = new Map<string, number>();
  let lastBowlerId: string | null = null;

  let legalBalls = 0;
  let runs = 0;
  let wickets = 0;
  let extras = 0;
  let strikerIndex = 0;
  let nonStrikerIndex = 1;
  let nextBatterIndex = 2;
  let currentOver = -1;
  let bowler: Player = attack[0] as Player;
  let deliveryIndex = 0;

  const pickBowler = (overIndex: number): Player => {
    const available = attack.filter(
      (player) => (oversBowled.get(player.id) ?? 0) < 4 && player.id !== lastBowlerId,
    );
    const pool = available.length > 0 ? available : attack.filter((player) => (oversBowled.get(player.id) ?? 0) < 4);
    const source = pool.length > 0 ? pool : attack;
    return choose(source, overIndex * 5 + seed);
  };

  while (legalBalls < maxBalls && wickets < 10) {
    if (partialAtBalls !== undefined && legalBalls >= partialAtBalls) break;
    if (target !== null && runs >= target) break;

    const overIndex = Math.floor(legalBalls / 6);
    if (overIndex !== currentOver) {
      currentOver = overIndex;
      if (overIndex > 0) {
        const temp = strikerIndex;
        strikerIndex = nonStrikerIndex;
        nonStrikerIndex = temp;
      }
      bowler = pickBowler(overIndex);
      lastBowlerId = bowler.id;
    }

    const striker = battingXI[strikerIndex];
    if (!striker) break;

    const overNumber = Math.floor(legalBalls / 6) + 1;
    const ballNumber = (legalBalls % 6) + 1;
    const positionFactor = strikerIndex < 3 ? 1.15 : strikerIndex < 6 ? 1 : 0.82;
    const wicketProbability = 0.041 * (strikerIndex >= 8 ? 1.55 : strikerIndex >= 5 ? 1.2 : 1);

    const roll = rng();
    let extraType: ExtraType | null = null;
    let runsBatter = 0;
    let runsExtras = 0;
    let totalRuns = 0;
    let legalBall = true;
    let wicketType: WicketType | null = null;
    let dismissedPlayerId: string | null = null;
    let fielderId: string | null = null;
    let commentary = "";

    if (roll < 0.035) {
      extraType = "wide";
      runsExtras = 1;
      totalRuns = 1;
      legalBall = false;
      commentary = `Wide down the leg side, ${surname(bowler.fullName)} loses his line`;
    } else if (roll < 0.052) {
      extraType = "no_ball";
      runsExtras = 1;
      totalRuns = 1;
      legalBall = false;
      commentary = `No ball, ${surname(bowler.fullName)} oversteps`;
    } else if (roll < 0.064) {
      extraType = "bye";
      runsExtras = 1;
      totalRuns = 1;
      commentary = "Sneaks through the keeper, one bye";
    } else if (roll < 0.076) {
      extraType = "leg_bye";
      runsExtras = 1;
      totalRuns = 1;
      commentary = "Off the pads, one leg bye";
    } else if (rng() < wicketProbability) {
      const wicketRoll = rng();
      if (wicketRoll < 0.28) wicketType = "bowled";
      else if (wicketRoll < 0.72) wicketType = "caught";
      else if (wicketRoll < 0.85) wicketType = "lbw";
      else if (wicketRoll < 0.9) wicketType = "stumped";
      else if (wicketRoll < 0.97) wicketType = "run_out";
      else wicketType = "hit_wicket";

      if (wicketType === "run_out" && nonStrikerIndex >= 0 && rng() < 0.3) {
        dismissedPlayerId = battingXI[nonStrikerIndex]?.id ?? striker.id;
      } else {
        dismissedPlayerId = striker.id;
      }
      if (wicketType === "caught" || wicketType === "run_out" || wicketType === "stumped") {
        fielderId = choose(bowlingXI, deliveryIndex + 3).id;
      }
      commentary = `OUT! ${surname(striker.fullName)} ${WICKET_TEXT[wicketType]}`;
      totalRuns = 0;
    } else {
      const runRoll = rng();
      const fourThreshold = 0.75 + 0.12 * positionFactor;
      const sixThreshold = fourThreshold + 0.045 * positionFactor;
      if (runRoll < 0.36) runsBatter = 0;
      else if (runRoll < 0.63) runsBatter = 1;
      else if (runRoll < 0.73) runsBatter = 2;
      else if (runRoll < 0.75) runsBatter = 3;
      else if (runRoll < fourThreshold) runsBatter = 4;
      else if (runRoll < sixThreshold) runsBatter = 6;
      else runsBatter = 0;
      totalRuns = runsBatter;
      commentary = `${surname(bowler.fullName)} to ${surname(striker.fullName)}, ${choose(RUN_COMMENTARY[runsBatter] ?? ["no run"], deliveryIndex)}`;
    }

    const event: BallEvent = {
      id: `${inningsId}-e${deliveryIndex}`,
      inningsId,
      overNumber,
      ballNumber,
      legalBall,
      batterId: striker.id,
      bowlerId: bowler.id,
      runsBatter,
      runsExtras,
      totalRuns,
      extraType,
      wicketType,
      dismissedPlayerId,
      fielderId,
      commentary,
      providerEventId: null,
      createdAt: new Date(base + deliveryIndex * 1000).toISOString(),
    };
    events.push(event);
    deliveryIndex += 1;

    runs += totalRuns;
    extras += runsExtras;
    if (legalBall) {
      legalBalls += 1;
      oversBowled.set(bowler.id, (oversBowled.get(bowler.id) ?? 0) + 1);
    }

    if (wicketType) {
      wickets += 1;
      const dismissedStriker = dismissedPlayerId === striker.id;
      if (wickets >= 10) break;
      if (dismissedStriker) {
        const incoming = battingXI[nextBatterIndex];
        if (!incoming) break;
        strikerIndex = nextBatterIndex;
        nextBatterIndex += 1;
      } else {
        const incoming = battingXI[nextBatterIndex];
        if (!incoming) break;
        nonStrikerIndex = nextBatterIndex;
        nextBatterIndex += 1;
      }
    } else if (totalRuns % 2 === 1) {
      const temp = strikerIndex;
      strikerIndex = nonStrikerIndex;
      nonStrikerIndex = temp;
    }
  }

  const targetReached = target !== null && runs >= target;
  const closed = partialAtBalls === undefined ? isInningsComplete(legalBalls, wickets, maxBalls) || targetReached : false;

  const innings: Innings = {
    id: inningsId,
    matchId,
    inningsNumber: 0,
    battingTeamId,
    bowlingTeamId,
    totalRuns: runs,
    wickets,
    legalBalls,
    extras,
    declared: false,
    closed,
  };

  return { innings, events };
}
