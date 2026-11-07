import type { Match, SeasonSettings, StandingRow, Team } from "@/types/cricket";

interface InningsLike {
  matchId: string;
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  wickets: number;
  legalBalls: number;
}

const DEFAULT_SETTINGS: SeasonSettings = {
  pointsWin: 2,
  pointsTie: 1,
  pointsNoResult: 1,
  ballsPerInnings: 120,
  allOutUsesFullQuota: true,
};

interface MutableRow {
  teamId: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  runsFor: number;
  runsAgainst: number;
  ballsFaced: number;
  ballsBowled: number;
}

/**
 * Effective balls faced for NRR. Official short-form convention: a side bowled out
 * before its quota is treated as having faced the full quota.
 */
export function effectiveNrrBalls(innings: InningsLike, settings: SeasonSettings): number {
  const quota = settings.ballsPerInnings;
  if (settings.allOutUsesFullQuota && innings.wickets >= 10 && innings.legalBalls < quota) {
    return quota;
  }
  return innings.legalBalls;
}

export function netRunRate(runsFor: number, ballsFaced: number, runsAgainst: number, ballsBowled: number): number {
  const facedOvers = ballsFaced / 6;
  const bowledOvers = ballsBowled / 6;
  const scored = facedOvers > 0 ? runsFor / facedOvers : 0;
  const conceded = bowledOvers > 0 ? runsAgainst / bowledOvers : 0;
  return scored - conceded;
}

export type MatchOutcome =
  | { kind: "win"; winnerId: string; loserId: string }
  | { kind: "tie" }
  | { kind: "no_result" }
  | { kind: "unfinished" };

export function determineOutcome(match: Match, innings: InningsLike[]): MatchOutcome {
  if (match.status === "scheduled" || match.status === "live" || match.status === "cancelled") {
    return { kind: "unfinished" };
  }
  if (match.status === "abandoned") return { kind: "no_result" };

  const matchInnings = innings.filter((row) => row.matchId === match.id);
  if (match.winnerId) {
    const loserId = match.winnerId === match.teamAId ? match.teamBId : match.teamAId;
    return { kind: "win", winnerId: match.winnerId, loserId };
  }
  if (matchInnings.length < 2) return { kind: "no_result" };

  const first = matchInnings.find((row) => row.battingTeamId === match.teamAId) ?? matchInnings[0];
  const second = matchInnings.find((row) => row !== first);
  if (!first || !second) return { kind: "no_result" };
  if (first.totalRuns === second.totalRuns) return { kind: "tie" };
  const winnerId = first.totalRuns > second.totalRuns ? first.battingTeamId : second.battingTeamId;
  const loserId = winnerId === match.teamAId ? match.teamBId : match.teamAId;
  return { kind: "win", winnerId, loserId };
}

/**
 * Compute a season standings table from match results and innings totals.
 * NRR uses effective balls (all-out sides receive the full quota) and excludes
 * no-result matches.
 */
export function computeStandings(
  matches: Match[],
  innings: InningsLike[],
  teams: Team[],
  settingsInput: Partial<SeasonSettings> = {},
): StandingRow[] {
  const settings: SeasonSettings = { ...DEFAULT_SETTINGS, ...settingsInput };
  const rows = new Map<string, MutableRow>();
  for (const team of teams) {
    rows.set(team.id, {
      teamId: team.id,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      noResult: 0,
      points: 0,
      runsFor: 0,
      runsAgainst: 0,
      ballsFaced: 0,
      ballsBowled: 0,
    });
  }

  for (const match of matches) {
    const outcome = determineOutcome(match, innings);
    const rowA = rows.get(match.teamAId);
    const rowB = rows.get(match.teamBId);
    if (!rowA || !rowB) continue;

    if (outcome.kind === "unfinished") continue;

    rowA.played += 1;
    rowB.played += 1;

    if (outcome.kind === "no_result") {
      rowA.noResult += 1;
      rowB.noResult += 1;
      rowA.points += settings.pointsNoResult;
      rowB.points += settings.pointsNoResult;
      continue;
    }

    if (outcome.kind === "tie") {
      rowA.tied += 1;
      rowB.tied += 1;
      rowA.points += settings.pointsTie;
      rowB.points += settings.pointsTie;
    } else {
      const winner = outcome.winnerId === match.teamAId ? rowA : rowB;
      const loser = outcome.winnerId === match.teamAId ? rowB : rowA;
      winner.won += 1;
      loser.lost += 1;
      winner.points += settings.pointsWin;
    }

    const matchInnings = innings.filter((row) => row.matchId === match.id);
    for (const inn of matchInnings) {
      const battingRow = rows.get(inn.battingTeamId);
      const bowlingRow = rows.get(inn.bowlingTeamId);
      if (!battingRow || !bowlingRow) continue;
      const effectiveBalls = effectiveNrrBalls(inn, settings);
      battingRow.runsFor += inn.totalRuns;
      battingRow.ballsFaced += effectiveBalls;
      bowlingRow.runsAgainst += inn.totalRuns;
      bowlingRow.ballsBowled += effectiveBalls;
    }
  }

  const table: StandingRow[] = Array.from(rows.values()).map((row) => ({
    position: 0,
    teamId: row.teamId,
    played: row.played,
    won: row.won,
    lost: row.lost,
    tied: row.tied,
    noResult: row.noResult,
    points: row.points,
    runsFor: row.runsFor,
    runsAgainst: row.runsAgainst,
    ballsFaced: row.ballsFaced,
    ballsBowled: row.ballsBowled,
    nrr: netRunRate(row.runsFor, row.ballsFaced, row.runsAgainst, row.ballsBowled),
  }));

  table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.nrr !== a.nrr) return b.nrr - a.nrr;
    if (b.won !== a.won) return b.won - a.won;
    return a.teamId.localeCompare(b.teamId);
  });
  table.forEach((row, index) => {
    row.position = index + 1;
  });
  return table;
}

export function standingsForTeam(table: StandingRow[], teamId: string): StandingRow | null {
  return table.find((row) => row.teamId === teamId) ?? null;
}

export type { InningsLike };
