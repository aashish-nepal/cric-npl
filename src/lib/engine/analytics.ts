import type {
  BattingAggregate,
  BowlingAggregate,
  InningsComputed,
  MatchComputed,
  Player,
  SeasonBundle,
  StandingRow,
  Team,
  TeamAggregate,
} from "@/types/cricket";
import { computeInnings } from "./innings";
import { computeMatch } from "./match";
import { computeStandings, determineOutcome, type InningsLike } from "./standings";
import { average, economy, strikeRate } from "@/lib/utils";

export interface SeasonRecords {
  leadingRunScorer: BattingAggregate | null;
  leadingWicketTaker: BowlingAggregate | null;
  highestIndividualScore: BattingAggregate | null;
  bestBowling: BowlingAggregate | null;
  mostSixes: BattingAggregate | null;
  highestTeamTotal: {
    teamId: string;
    opponentId: string;
    matchId: string;
    runs: number;
    wickets: number;
    overs: string;
  } | null;
  bestAverage: BattingAggregate | null;
  bestStrikeRate: BattingAggregate | null;
  bestEconomy: BowlingAggregate | null;
}

export interface SeasonAnalytics {
  bundle: SeasonBundle;
  teamById: Map<string, Team>;
  playerById: Map<string, Player>;
  inningsById: Map<string, InningsComputed>;
  inningsByMatch: Map<string, InningsComputed[]>;
  matches: MatchComputed[];
  matchById: Map<string, MatchComputed>;
  standings: StandingRow[];
  batting: BattingAggregate[];
  bowling: BowlingAggregate[];
  teams: TeamAggregate[];
  records: SeasonRecords;
}

export function computeSeasonAnalytics(bundle: SeasonBundle): SeasonAnalytics {
  const teamById = new Map(bundle.teams.map((team) => [team.id, team]));
  const playerById = new Map(bundle.players.map((player) => [player.id, player]));
  const venueById = new Map(bundle.venues.map((venue) => [venue.id, venue]));

  const eventsByInnings = new Map<string, typeof bundle.ballEvents>();
  for (const event of bundle.ballEvents) {
    const list = eventsByInnings.get(event.inningsId);
    if (list) list.push(event);
    else eventsByInnings.set(event.inningsId, [event]);
  }

  const inningsById = new Map<string, InningsComputed>();
  const inningsByMatch = new Map<string, InningsComputed[]>();
  for (const innings of bundle.innings) {
    const computed = computeInnings(innings, eventsByInnings.get(innings.id) ?? []);
    inningsById.set(innings.id, computed);
    const list = inningsByMatch.get(innings.matchId);
    if (list) list.push(computed);
    else inningsByMatch.set(innings.matchId, [computed]);
  }

  const matches: MatchComputed[] = [];
  for (const match of bundle.matches) {
    const venue = venueById.get(match.venueId);
    if (!venue) continue;
    const computed = computeMatch(
      match,
      inningsByMatch.get(match.id) ?? [],
      bundle.teams,
      venue,
      bundle.season.settings,
    );
    if (computed) matches.push(computed);
  }
  const matchById = new Map(matches.map((match) => [match.match.id, match]));

  const inningsLikes: InningsLike[] = Array.from(inningsById.values()).map((computed) => ({
    matchId: computed.innings.matchId,
    battingTeamId: computed.innings.battingTeamId,
    bowlingTeamId: computed.innings.bowlingTeamId,
    totalRuns: computed.runs,
    wickets: computed.wickets,
    legalBalls: computed.legalBalls,
  }));

  const standings = computeStandings(bundle.matches, inningsLikes, bundle.teams, bundle.season.settings);
  const batting = computeBattingAggregates(inningsById);
  const bowling = computeBowlingAggregates(inningsById);
  const teams = computeTeamAggregates(bundle, standings, inningsById);
  const records = computeRecords(batting, bowling, inningsById);

  return {
    bundle,
    teamById,
    playerById,
    inningsById,
    inningsByMatch,
    matches,
    matchById,
    standings,
    batting,
    bowling,
    teams,
    records,
  };
}

export function computeBattingAggregates(inningsById: Map<string, InningsComputed>): BattingAggregate[] {
  const map = new Map<string, BattingAggregate>();

  for (const computed of inningsById.values()) {
    const teamId = computed.innings.battingTeamId;
    for (const entry of computed.batting) {
      const existing = map.get(entry.playerId);
      const aggregate: BattingAggregate =
        existing ??
        {
          playerId: entry.playerId,
          teamId,
          innings: 0,
          notOuts: 0,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          highScore: 0,
          highScoreNotOut: false,
          fifties: 0,
          hundreds: 0,
          average: 0,
          strikeRate: 0,
        };

      aggregate.innings += 1;
      aggregate.runs += entry.runs;
      aggregate.balls += entry.balls;
      aggregate.fours += entry.fours;
      aggregate.sixes += entry.sixes;
      if (!entry.out) aggregate.notOuts += 1;
      if (entry.runs >= 100) aggregate.hundreds += 1;
      else if (entry.runs >= 50) aggregate.fifties += 1;
      if (entry.runs > aggregate.highScore || (entry.runs === aggregate.highScore && !entry.out)) {
        aggregate.highScore = entry.runs;
        aggregate.highScoreNotOut = !entry.out;
      }
      map.set(entry.playerId, aggregate);
    }
  }

  const rows = Array.from(map.values());
  for (const row of rows) {
    const dismissals = row.innings - row.notOuts;
    row.average = dismissals > 0 ? average(row.runs, dismissals) : row.runs;
    row.strikeRate = strikeRate(row.runs, row.balls);
  }
  return rows.sort((a, b) => b.runs - a.runs || b.average - a.average);
}

export function computeBowlingAggregates(inningsById: Map<string, InningsComputed>): BowlingAggregate[] {
  const map = new Map<string, BowlingAggregate>();

  for (const computed of inningsById.values()) {
    const teamId = computed.innings.bowlingTeamId;
    for (const entry of computed.bowling) {
      if (entry.legalBalls === 0) continue;
      const existing = map.get(entry.playerId);
      const aggregate: BowlingAggregate =
        existing ??
        {
          playerId: entry.playerId,
          teamId,
          innings: 0,
          legalBalls: 0,
          maidens: 0,
          runsConceded: 0,
          wickets: 0,
          average: 0,
          economy: 0,
          strikeRate: 0,
          bestWickets: 0,
          bestRuns: 0,
          fourWicketHauls: 0,
          fiveWicketHauls: 0,
        };

      aggregate.innings += 1;
      aggregate.legalBalls += entry.legalBalls;
      aggregate.maidens += entry.maidens;
      aggregate.runsConceded += entry.runsConceded;
      aggregate.wickets += entry.wickets;
      if (entry.wickets >= 5) aggregate.fiveWicketHauls += 1;
      else if (entry.wickets >= 4) aggregate.fourWicketHauls += 1;
      if (entry.wickets > aggregate.bestWickets || (entry.wickets === aggregate.bestWickets && entry.runsConceded < aggregate.bestRuns)) {
        aggregate.bestWickets = entry.wickets;
        aggregate.bestRuns = entry.runsConceded;
      }
      map.set(entry.playerId, aggregate);
    }
  }

  const rows = Array.from(map.values());
  for (const row of rows) {
    row.average = row.wickets > 0 ? average(row.runsConceded, row.wickets) : 0;
    row.economy = economy(row.runsConceded, row.legalBalls);
    row.strikeRate = row.wickets > 0 ? row.legalBalls / row.wickets : 0;
  }
  return rows.sort((a, b) => b.wickets - a.wickets || a.economy - b.economy);
}

export function computeTeamAggregates(
  bundle: SeasonBundle,
  standings: StandingRow[],
  inningsById: Map<string, InningsComputed>,
): TeamAggregate[] {
  const map = new Map<string, TeamAggregate>();
  for (const team of bundle.teams) {
    map.set(team.id, {
      teamId: team.id,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      noResult: 0,
      highestScore: 0,
      lowestScore: 0,
      highestScoreAgainst: 0,
      highestSuccessfulChase: null,
      biggestWinByRuns: null,
      biggestWinByWickets: null,
    });
  }

  for (const row of standings) {
    const aggregate = map.get(row.teamId);
    if (!aggregate) continue;
    aggregate.played = row.played;
    aggregate.won = row.won;
    aggregate.lost = row.lost;
    aggregate.tied = row.tied;
    aggregate.noResult = row.noResult;
  }

  for (const computed of inningsById.values()) {
    if (computed.legalBalls === 0) continue;
    const batting = map.get(computed.innings.battingTeamId);
    const bowling = map.get(computed.innings.bowlingTeamId);
    if (batting) {
      if (batting.highestScore === 0 || computed.runs > batting.highestScore) batting.highestScore = computed.runs;
      if (batting.lowestScore === 0 || computed.runs < batting.lowestScore) batting.lowestScore = computed.runs;
    }
    if (bowling && computed.runs > bowling.highestScoreAgainst) {
      bowling.highestScoreAgainst = computed.runs;
    }
  }

  const allInnings = Array.from(inningsById.values());
  const inningsLikes = allInnings.map((computed) => ({
    matchId: computed.innings.matchId,
    battingTeamId: computed.innings.battingTeamId,
    bowlingTeamId: computed.innings.bowlingTeamId,
    totalRuns: computed.runs,
    wickets: computed.wickets,
    legalBalls: computed.legalBalls,
  }));

  for (const match of bundle.matches) {
    const outcome = determineOutcome(match, inningsLikes);
    if (outcome.kind !== "win") continue;
    const winnerInnings = allInnings.find(
      (computed) => computed.innings.matchId === match.id && computed.innings.battingTeamId === outcome.winnerId,
    );
    const loserInnings = allInnings.find(
      (computed) => computed.innings.matchId === match.id && computed.innings.battingTeamId === outcome.loserId,
    );
    if (!winnerInnings || !loserInnings) continue;
    const winnerAggregate = map.get(outcome.winnerId);
    if (!winnerAggregate) continue;
    if (winnerInnings.innings.inningsNumber === 2) {
      if (winnerAggregate.highestSuccessfulChase === null || winnerInnings.runs > winnerAggregate.highestSuccessfulChase) {
        winnerAggregate.highestSuccessfulChase = winnerInnings.runs;
      }
      const byWickets = 10 - winnerInnings.wickets;
      if (winnerAggregate.biggestWinByWickets === null || byWickets > winnerAggregate.biggestWinByWickets) {
        winnerAggregate.biggestWinByWickets = byWickets;
      }
    } else {
      const margin = winnerInnings.runs - loserInnings.runs;
      if (winnerAggregate.biggestWinByRuns === null || margin > winnerAggregate.biggestWinByRuns) {
        winnerAggregate.biggestWinByRuns = margin;
      }
    }
  }

  return Array.from(map.values());
}

export function computeRecords(
  batting: BattingAggregate[],
  bowling: BowlingAggregate[],
  inningsById: Map<string, InningsComputed>,
): SeasonRecords {
  const highestIndividualScore =
    [...batting].sort((a, b) => b.highScore - a.highScore || b.runs - a.runs)[0] ?? null;
  const bestBowling =
    [...bowling].sort((a, b) => b.bestWickets - a.bestWickets || a.bestRuns - b.bestRuns)[0] ?? null;

  let highestTeamTotal: SeasonRecords["highestTeamTotal"] = null;
  for (const computed of inningsById.values()) {
    if (!highestTeamTotal || computed.runs > highestTeamTotal.runs) {
      highestTeamTotal = {
        teamId: computed.innings.battingTeamId,
        opponentId: computed.innings.bowlingTeamId,
        matchId: computed.innings.matchId,
        runs: computed.runs,
        wickets: computed.wickets,
        overs: computed.overs,
      };
    }
  }

  const bestAverage =
    [...batting].filter((row) => row.runs >= 100 && row.innings > row.notOuts).sort((a, b) => b.average - a.average)[0] ?? null;
  const bestStrikeRate =
    [...batting].filter((row) => row.balls >= 60).sort((a, b) => b.strikeRate - a.strikeRate)[0] ?? null;
  const bestEconomy =
    [...bowling].filter((row) => row.legalBalls >= 60).sort((a, b) => a.economy - b.economy)[0] ?? null;

  return {
    leadingRunScorer: batting[0] ?? null,
    leadingWicketTaker: bowling[0] ?? null,
    highestIndividualScore,
    bestBowling,
    mostSixes: [...batting].sort((a, b) => b.sixes - a.sixes)[0] ?? null,
    highestTeamTotal,
    bestAverage,
    bestStrikeRate,
    bestEconomy,
  };
}
