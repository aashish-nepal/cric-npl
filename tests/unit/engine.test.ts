import { describe, expect, it } from "vitest";
import type { BallEvent, Innings } from "@/types/cricket";
import { computeInnings, isInningsComplete, nextDeliveryPosition } from "@/lib/engine/innings";
import { economy, oversFromBalls, runRate, strikeRate } from "@/lib/utils";

function event(partial: Partial<BallEvent> & Pick<BallEvent, "overNumber" | "ballNumber">): BallEvent {
  return {
    id: `e-${partial.overNumber}-${partial.ballNumber}-${Math.random()}`,
    inningsId: "inn-1",
    legalBall: true,
    batterId: "bat-1",
    bowlerId: "bowl-1",
    runsBatter: 0,
    runsExtras: 0,
    totalRuns: 0,
    extraType: null,
    wicketType: null,
    dismissedPlayerId: null,
    fielderId: null,
    commentary: "",
    providerEventId: null,
    createdAt: new Date(2026, 0, 1, 0, 0, partial.overNumber * 10 + partial.ballNumber).toISOString(),
    ...partial,
  };
}

const innings: Innings = {
  id: "inn-1",
  matchId: "match-1",
  inningsNumber: 1,
  battingTeamId: "team-a",
  bowlingTeamId: "team-b",
  totalRuns: 0,
  wickets: 0,
  legalBalls: 0,
  extras: 0,
  declared: false,
  closed: false,
};

describe("delivery formatting", () => {
  it("converts legal balls to overs", () => {
    expect(oversFromBalls(0)).toBe("0.0");
    expect(oversFromBalls(6)).toBe("1.0");
    expect(oversFromBalls(76)).toBe("12.4");
    expect(oversFromBalls(119)).toBe("19.5");
    expect(oversFromBalls(120)).toBe("20.0");
  });

  it("computes run rate, strike rate and economy", () => {
    expect(runRate(120, 120)).toBe(6);
    expect(strikeRate(50, 40)).toBe(125);
    expect(economy(24, 24)).toBe(6);
    expect(runRate(10, 0)).toBe(0);
    expect(strikeRate(10, 0)).toBe(0);
  });

  it("computes the next delivery position including illegal deliveries", () => {
    expect(nextDeliveryPosition(0)).toEqual({ overNumber: 1, ballNumber: 1 });
    expect(nextDeliveryPosition(5)).toEqual({ overNumber: 1, ballNumber: 6 });
    expect(nextDeliveryPosition(6)).toEqual({ overNumber: 2, ballNumber: 1 });
    expect(nextDeliveryPosition(76)).toEqual({ overNumber: 13, ballNumber: 5 });
  });

  it("detects innings completion at the quota or ten wickets", () => {
    expect(isInningsComplete(120, 4)).toBe(true);
    expect(isInningsComplete(60, 10)).toBe(true);
    expect(isInningsComplete(60, 4)).toBe(false);
  });
});

describe("innings computation", () => {
  it("derives runs, extras, batting and bowling cards from events", () => {
    const events: BallEvent[] = [
      event({ overNumber: 1, ballNumber: 1, runsBatter: 4, totalRuns: 4 }),
      event({ overNumber: 1, ballNumber: 2, runsBatter: 0 }),
      event({ overNumber: 1, ballNumber: 3, runsBatter: 6, totalRuns: 6 }),
      event({ overNumber: 1, ballNumber: 4, extraType: "wide", runsExtras: 1, totalRuns: 1, legalBall: false }),
      event({ overNumber: 1, ballNumber: 4, runsBatter: 1, totalRuns: 1 }),
      event({ overNumber: 1, ballNumber: 5, runsBatter: 0 }),
      event({ overNumber: 1, ballNumber: 6, extraType: "leg_bye", runsExtras: 2, totalRuns: 2 }),
    ];
    const result = computeInnings(innings, events);
    expect(result.runs).toBe(14);
    expect(result.legalBalls).toBe(6);
    expect(result.overs).toBe("1.0");
    expect(result.extras.total).toBe(3);
    expect(result.extras.wides).toBe(1);
    expect(result.extras.legByes).toBe(2);

    const batter = result.batting[0];
    expect(batter?.runs).toBe(11);
    expect(batter?.balls).toBe(6);
    expect(batter?.fours).toBe(1);
    expect(batter?.sixes).toBe(1);
    expect(batter?.strikeRate).toBeCloseTo(183.33, 1);

    const bowler = result.bowling[0];
    expect(bowler?.legalBalls).toBe(6);
    // 11 off the bat + 1 wide; the two leg byes are not charged to the bowler.
    expect(bowler?.runsConceded).toBe(12);
    expect(bowler?.wides).toBe(1);
    expect(bowler?.economy).toBe(12);
    expect(bowler?.maidens).toBe(0);
  });

  it("credits bowler wickets but not run-outs", () => {
    const events: BallEvent[] = [
      event({ overNumber: 1, ballNumber: 1, wicketType: "bowled", dismissedPlayerId: "bat-1" }),
      event({ overNumber: 1, ballNumber: 2, runsBatter: 1, totalRuns: 1, batterId: "bat-2" }),
      event({
        overNumber: 1,
        ballNumber: 3,
        wicketType: "run_out",
        dismissedPlayerId: "bat-2",
        batterId: "bat-2",
      }),
    ];
    const result = computeInnings(innings, events);
    expect(result.wickets).toBe(2);
    expect(result.fallOfWickets).toHaveLength(2);
    expect(result.bowling[0]?.wickets).toBe(1);
    expect(result.batting.find((row) => row.playerId === "bat-1")?.out).toBe(true);
    expect(result.batting.find((row) => row.playerId === "bat-2")?.out).toBe(true);
  });

  it("counts maidens correctly", () => {
    const events: BallEvent[] = Array.from({ length: 6 }, (_, index) =>
      event({ overNumber: 1, ballNumber: index + 1 }),
    );
    const result = computeInnings(innings, events);
    expect(result.bowling[0]?.maidens).toBe(1);
    expect(result.runs).toBe(0);
  });

  it("tracks partnerships and fall of wickets", () => {
    const events: BallEvent[] = [
      event({ overNumber: 1, ballNumber: 1, runsBatter: 4, totalRuns: 4 }),
      event({ overNumber: 1, ballNumber: 2, runsBatter: 1, totalRuns: 1 }),
      event({ overNumber: 1, ballNumber: 3, batterId: "bat-2", runsBatter: 0 }),
      event({
        overNumber: 1,
        ballNumber: 4,
        batterId: "bat-2",
        wicketType: "caught",
        dismissedPlayerId: "bat-2",
        fielderId: "field-1",
      }),
      event({ overNumber: 1, ballNumber: 5, batterId: "bat-3", runsBatter: 6, totalRuns: 6 }),
    ];
    const result = computeInnings(innings, events);
    expect(result.fallOfWickets[0]).toMatchObject({ wicketNumber: 1, runs: 5, over: "0.4" });
    expect(result.partnerships[0]?.runs).toBe(5);
    expect(result.partnerships[1]?.runs).toBe(6);
    expect(result.partnerships[1]?.unbroken).toBe(true);
  });

  it("excludes retired hurt from wickets", () => {
    const events: BallEvent[] = [
      event({
        overNumber: 1,
        ballNumber: 1,
        wicketType: "retired_hurt",
        dismissedPlayerId: "bat-1",
      }),
    ];
    const result = computeInnings(innings, events);
    expect(result.wickets).toBe(0);
    expect(result.fallOfWickets).toHaveLength(0);
  });
});
