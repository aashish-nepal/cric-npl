import type {
  InningsComputed,
  Match,
  MatchComputed,
  SeasonSettings,
  Team,
  Venue,
} from "@/types/cricket";
import { formatKathmanduDateTime, formatNumber, oversFromBalls } from "@/lib/utils";

export function computeMatch(
  match: Match,
  matchInnings: InningsComputed[],
  teams: Team[],
  venue: Venue,
  settings: Pick<SeasonSettings, "ballsPerInnings">,
): MatchComputed | null {
  const teamA = teams.find((team) => team.id === match.teamAId);
  const teamB = teams.find((team) => team.id === match.teamBId);
  if (!teamA || !teamB) return null;

  const innings = [...matchInnings].sort((a, b) => a.innings.inningsNumber - b.innings.inningsNumber);
  const first = innings[0] ?? null;
  const second = innings[1] ?? null;
  const currentInnings =
    match.status === "live"
      ? (innings.find((inn) => !inn.innings.closed) ?? second ?? first)
      : (second ?? first);

  const target = first ? first.runs + 1 : null;
  const isChasing = Boolean(second && target && currentInnings?.innings.inningsNumber === 2);
  const requiredRuns = isChasing && target && currentInnings ? Math.max(0, target - currentInnings.runs) : null;
  const ballsRemaining = currentInnings ? Math.max(0, settings.ballsPerInnings - currentInnings.legalBalls) : null;
  const requiredRunRate =
    requiredRuns !== null && ballsRemaining !== null && ballsRemaining > 0
      ? (requiredRuns * 6) / ballsRemaining
      : null;
  const currentRunRate = currentInnings ? currentInnings.runRate : null;
  const projectedScore =
    currentInnings && ballsRemaining !== null
      ? Math.round(currentInnings.runs + currentInnings.runRate * (ballsRemaining / 6))
      : null;

  const resultText = buildResultText(match, innings, teamA, teamB);
  const statusText = buildStatusText(match, currentInnings, teamA, teamB, target, requiredRuns, ballsRemaining);

  return {
    match,
    innings,
    currentInnings,
    target,
    requiredRuns,
    requiredRunRate,
    currentRunRate,
    projectedScore,
    statusText,
    resultText,
    teamA,
    teamB,
    venue,
  };
}

function buildStatusText(
  match: Match,
  current: InningsComputed | null,
  teamA: Team,
  teamB: Team,
  target: number | null,
  requiredRuns: number | null,
  ballsRemaining: number | null,
): string {
  if (match.status === "scheduled") {
    return `${formatKathmanduDateTime(match.scheduledAt)} NPT`;
  }
  if (match.status === "cancelled") return "Match cancelled";
  if (match.status === "abandoned") return "No result";
  if (match.status === "completed") {
    return match.resultSummary ?? "Match completed";
  }
  if (!current) return "Awaiting first ball";

  const battingTeam = current.innings.battingTeamId === teamA.id ? teamA : teamB;
  const score = `${battingTeam.shortName} ${current.runs}/${current.wickets} (${current.overs})`;
  if (target && requiredRuns !== null && ballsRemaining !== null) {
    return `${score} · need ${requiredRuns} from ${ballsRemaining} balls`;
  }
  return `${score} · in progress`;
}

function buildResultText(
  match: Match,
  innings: InningsComputed[],
  teamA: Team,
  teamB: Team,
): string | null {
  if (match.status !== "completed" && match.status !== "abandoned") return null;
  if (match.status === "abandoned") return "No result";
  if (match.resultSummary) return match.resultSummary;
  if (!match.winnerId) {
    const first = innings[0];
    const second = innings[1];
    if (first && second && first.runs === second.runs) return "Match tied";
    return null;
  }

  const winner = match.winnerId === teamA.id ? teamA : teamB;
  const loser = winner.id === teamA.id ? teamB : teamA;
  const first = innings[0];
  const second = innings[1];
  if (!first || !second) return `${winner.name} won`;

  const winnerInnings = innings.find((inn) => inn.innings.battingTeamId === winner.id);
  const loserInnings = innings.find((inn) => inn.innings.battingTeamId === loser.id);
  if (!winnerInnings || !loserInnings) return `${winner.name} won`;

  if (winnerInnings.innings.inningsNumber === 2) {
    const wicketsInHand = 10 - winnerInnings.wickets;
    return `${winner.name} won by ${wicketsInHand} wicket${wicketsInHand === 1 ? "" : "s"}`;
  }
  const margin = winnerInnings.runs - loserInnings.runs;
  return `${winner.name} won by ${margin} run${margin === 1 ? "" : "s"}`;
}

export function scoreLine(computed: InningsComputed): string {
  return `${computed.runs}/${computed.wickets} (${computed.overs})`;
}

export function matchMetaLine(match: MatchComputed): string {
  const toss = match.match.tossWinnerId
    ? `${match.match.tossWinnerId === match.teamA.id ? match.teamA.shortName : match.teamB.shortName} won the toss and chose to ${match.match.tossDecision ?? "bat"}`
    : "Toss not yet decided";
  return `Match ${match.match.matchNumber} · ${match.venue.name} · ${toss}`;
}

export function projectedEstimate(computed: MatchComputed, ballsPerInnings = 120): string | null {
  if (!computed.currentInnings || computed.match.status !== "live") return null;
  const remaining = Math.max(0, ballsPerInnings - computed.currentInnings.legalBalls);
  if (remaining === 0) return null;
  const projected = computed.currentInnings.runs + computed.currentInnings.runRate * (remaining / 6);
  return `${formatNumber(projected, 0)} at ${oversFromBalls(ballsPerInnings)} overs (estimate)`;
}
