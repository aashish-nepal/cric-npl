import { describe, expect, it } from "vitest";
import type { Innings, Match, Team } from "@/types/cricket";
import {
  computeStandings,
  determineOutcome,
  effectiveNrrBalls,
  netRunRate,
} from "@/lib/engine/standings";

const teams: Team[] = [
  {
    id: "a",
    name: "Team A",
    slug: "team-a",
    shortName: "A",
    logoUrl: null,
    primaryColor: "#000",
    description: "",
    homeCity: "",
    active: true,
  },
  {
    id: "b",
    name: "Team B",
    slug: "team-b",
    shortName: "B",
    logoUrl: null,
    primaryColor: "#000",
    description: "",
    homeCity: "",
    active: true,
  },
  {
    id: "c",
    name: "Team C",
    slug: "team-c",
    shortName: "C",
    logoUrl: null,
    primaryColor: "#000",
    description: "",
    homeCity: "",
    active: true,
  },
];

function match(partial: Partial<Match> & Pick<Match, "id" | "teamAId" | "teamBId" | "status">): Match {
  return {
    seasonId: "s",
    tournamentId: "t",
    matchNumber: 1,
    slug: partial.id,
    venueId: "v",
    scheduledAt: "2026-01-01T00:00:00.000Z",
    tossWinnerId: null,
    tossDecision: null,
    winnerId: null,
    resultSummary: null,
    providerMatchId: null,
    dataSource: "manual",
    lastUpdated: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function innings(partial: Partial<Innings> & Pick<Innings, "id" | "matchId" | "battingTeamId" | "bowlingTeamId">): Innings {
  return {
    inningsNumber: 1,
    totalRuns: 0,
    wickets: 0,
    legalBalls: 120,
    extras: 0,
    declared: false,
    closed: true,
    ...partial,
  };
}

const settings = { pointsWin: 2, pointsTie: 1, pointsNoResult: 1, ballsPerInnings: 120, allOutUsesFullQuota: true };

describe("net run rate", () => {
  it("uses the full quota for an all-out side", () => {
    const allOut = innings({ id: "i1", matchId: "m1", battingTeamId: "a", bowlingTeamId: "b", totalRuns: 112, wickets: 10, legalBalls: 99 });
    expect(effectiveNrrBalls(allOut, settings)).toBe(120);
    expect(effectiveNrrBalls({ ...allOut, wickets: 6 }, settings)).toBe(99);
  });

  it("calculates the difference between scoring and conceding rates", () => {
    expect(netRunRate(160, 120, 120, 120)).toBeCloseTo(2, 5);
    expect(netRunRate(120, 120, 160, 120)).toBeCloseTo(-2, 5);
  });

  it("handles a completed chase", () => {
    const table = computeStandings(
      [
        match({ id: "m1", teamAId: "a", teamBId: "b", status: "completed", winnerId: "b" }),
      ],
      [
        innings({ id: "i1", matchId: "m1", battingTeamId: "a", bowlingTeamId: "b", totalRuns: 160, wickets: 6, legalBalls: 120 }),
        innings({ id: "i2", matchId: "m1", battingTeamId: "b", bowlingTeamId: "a", totalRuns: 161, wickets: 4, legalBalls: 110, inningsNumber: 2 }),
      ],
      teams,
      settings,
    );
    const a = table.find((row) => row.teamId === "a");
    const b = table.find((row) => row.teamId === "b");
    expect(b?.points).toBe(2);
    expect(b?.won).toBe(1);
    expect(a?.lost).toBe(1);
    // A: 160/20 - 161/(110/6) = 8 - 8.7818
    expect(a?.nrr).toBeCloseTo(8 - 161 / (110 / 6), 4);
    expect(b?.nrr).toBeCloseTo(161 / (110 / 6) - 8, 4);
    expect(table[0]?.teamId).toBe("b");
  });
});

describe("standings", () => {
  it("awards points for wins, ties and no-results", () => {
    const table = computeStandings(
      [
        match({ id: "m1", teamAId: "a", teamBId: "b", status: "completed", winnerId: "a" }),
        match({ id: "m2", teamAId: "a", teamBId: "c", status: "abandoned" }),
        match({ id: "m3", teamAId: "b", teamBId: "c", status: "completed", winnerId: "b" }),
      ],
      [
        innings({ id: "i1", matchId: "m1", battingTeamId: "a", bowlingTeamId: "b", totalRuns: 150 }),
        innings({ id: "i2", matchId: "m1", battingTeamId: "b", bowlingTeamId: "a", totalRuns: 140 }),
        innings({ id: "i3", matchId: "m3", battingTeamId: "b", bowlingTeamId: "c", totalRuns: 150 }),
        innings({ id: "i4", matchId: "m3", battingTeamId: "c", bowlingTeamId: "b", totalRuns: 140 }),
      ],
      teams,
      settings,
    );
    const a = table.find((row) => row.teamId === "a");
    const b = table.find((row) => row.teamId === "b");
    const c = table.find((row) => row.teamId === "c");
    expect(a?.points).toBe(3);
    expect(a?.played).toBe(2);
    expect(b?.points).toBe(2);
    expect(c?.points).toBe(1);
  });

  it("ignores scheduled and live matches", () => {
    const table = computeStandings(
      [
        match({ id: "m1", teamAId: "a", teamBId: "b", status: "scheduled" }),
        match({ id: "m2", teamAId: "a", teamBId: "c", status: "live" }),
      ],
      [],
      teams,
      settings,
    );
    expect(table.every((row) => row.played === 0)).toBe(true);
  });

  it("detects a tie when scores are level and no winner is recorded", () => {
    const result = determineOutcome(
      match({ id: "m1", teamAId: "a", teamBId: "b", status: "completed" }),
      [
        innings({ id: "i1", matchId: "m1", battingTeamId: "a", bowlingTeamId: "b", totalRuns: 150 }),
        innings({ id: "i2", matchId: "m1", battingTeamId: "b", bowlingTeamId: "a", totalRuns: 150 }),
      ],
    );
    expect(result.kind).toBe("tie");
  });

  it("sorts by points then NRR", () => {
    const table = computeStandings(
      [
        match({ id: "m1", teamAId: "a", teamBId: "c", status: "completed", winnerId: "a" }),
        match({ id: "m2", teamAId: "b", teamBId: "c", status: "completed", winnerId: "b" }),
      ],
      [
        innings({ id: "i1", matchId: "m1", battingTeamId: "a", bowlingTeamId: "c", totalRuns: 180 }),
        innings({ id: "i2", matchId: "m1", battingTeamId: "c", bowlingTeamId: "a", totalRuns: 100, wickets: 10, legalBalls: 80 }),
        innings({ id: "i3", matchId: "m2", battingTeamId: "b", bowlingTeamId: "c", totalRuns: 150 }),
        innings({ id: "i4", matchId: "m2", battingTeamId: "c", bowlingTeamId: "b", totalRuns: 149 }),
      ],
      teams,
      settings,
    );
    expect(table[0]?.teamId).toBe("a");
    expect(table[0]?.position).toBe(1);
  });
});
