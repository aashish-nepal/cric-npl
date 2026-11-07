import { cache } from "react";
import type {
  BallEvent,
  BattingAggregate,
  BowlingAggregate,
  InningsComputed,
  Match,
  MatchComputed,
  Player,
  PlayingXIEntry,
  Season,
  SeasonBundle,
  StandingRow,
  Team,
  TeamAggregate,
  Venue,
} from "@/types/cricket";
import type { PlayerCareerSeason, PlayerProfileData } from "@/types/content";
import type { CricketRepository } from "@/lib/data/repository";
import { getRepository } from "@/lib/data";
import { computeSeasonAnalytics, type SeasonAnalytics, type SeasonRecords } from "@/lib/engine/analytics";
import { formatKathmanduDate } from "@/lib/utils";

export interface SiteContext {
  repository: CricketRepository;
  seasons: Season[];
  activeSeason: Season;
  bundle: SeasonBundle;
  analytics: SeasonAnalytics;
  bundles: SeasonBundle[];
  analyticsBySeason: Map<string, SeasonAnalytics>;
}

export const loadSite = cache(async (): Promise<SiteContext> => {
  const repository = getRepository();
  const seasons = await repository.getSeasons();
  const bundles = await repository.getAllBundles();
  const activeSeason = seasons.find((season) => season.status === "active") ?? seasons[0];
  if (!activeSeason) {
    throw new Error("No cricket season is configured. Run the database seed or create a season in the admin dashboard.");
  }
  const analyticsBySeason = new Map<string, SeasonAnalytics>();
  for (const bundle of bundles) {
    analyticsBySeason.set(bundle.season.id, computeSeasonAnalytics(bundle));
  }
  const bundle = bundles.find((row) => row.season.id === activeSeason.id) ?? bundles[0];
  const analytics = analyticsBySeason.get(activeSeason.id);
  if (!bundle || !analytics) {
    throw new Error("The active season has no data bundle.");
  }
  return { repository, seasons, activeSeason, bundle, analytics, bundles, analyticsBySeason };
});

export const getSeasonContext = cache(async (seasonSlug?: string): Promise<{
  season: Season;
  bundle: SeasonBundle;
  analytics: SeasonAnalytics;
}> => {
  const site = await loadSite();
  if (!seasonSlug) {
    return { season: site.activeSeason, bundle: site.bundle, analytics: site.analytics };
  }
  const season = site.seasons.find((row) => row.slug === seasonSlug);
  const bundle = site.bundles.find((row) => row.season.slug === seasonSlug);
  const analytics = season ? site.analyticsBySeason.get(season.id) : null;
  if (!season || !bundle || !analytics) {
    throw new Error("Season not found");
  }
  return { season, bundle, analytics };
});

export function playerMapOf(bundle: SeasonBundle): Map<string, Player> {
  return new Map(bundle.players.map((player) => [player.id, player]));
}

export function teamMapOf(bundle: SeasonBundle): Map<string, Team> {
  return new Map(bundle.teams.map((team) => [team.id, team]));
}

export function venueMapOf(bundle: SeasonBundle): Map<string, Venue> {
  return new Map(bundle.venues.map((venue) => [venue.id, venue]));
}

export function teamNameMapOf(bundle: SeasonBundle): Map<string, string> {
  return new Map(bundle.teams.map((team) => [team.id, team.name]));
}

export function matchTeam(computed: MatchComputed, teamId: string): Team {
  return computed.teamA.id === teamId ? computed.teamA : computed.teamB;
}

export function opponentOf(computed: MatchComputed, teamId: string): Team {
  return computed.teamA.id === teamId ? computed.teamB : computed.teamA;
}

/* ------------------------------ Home ------------------------------ */

export interface HomeData {
  site: SiteContext;
  live: MatchComputed[];
  upcoming: MatchComputed[];
  recent: MatchComputed[];
  featured: MatchComputed | null;
  standings: StandingRow[];
  teamById: Map<string, Team>;
  playerById: Map<string, Player>;
  articles: Awaited<ReturnType<CricketRepository["getArticles"]>>;
  polls: Awaited<ReturnType<CricketRepository["getPolls"]>>;
  predictions: Awaited<ReturnType<CricketRepository["getPredictions"]>>;
}

export async function getHomeData(): Promise<HomeData> {
  const site = await loadSite();
  const matches = [...site.analytics.matches].sort(
    (a, b) => new Date(a.match.scheduledAt).getTime() - new Date(b.match.scheduledAt).getTime(),
  );
  const live = matches.filter((row) => row.match.status === "live");
  const upcoming = matches.filter((row) => row.match.status === "scheduled");
  const recent = matches
    .filter((row) => row.match.status === "completed" || row.match.status === "abandoned")
    .sort((a, b) => new Date(b.match.scheduledAt).getTime() - new Date(a.match.scheduledAt).getTime());
  const featured = live[0] ?? upcoming[0] ?? recent[0] ?? null;
  const [articles, polls, predictions] = await Promise.all([
    site.repository.getArticles({ limit: 7 }),
    site.repository.getPolls(),
    site.repository.getPredictions(site.activeSeason.id),
  ]);

  return {
    site,
    live,
    upcoming,
    recent,
    featured,
    standings: site.analytics.standings,
    teamById: teamMapOf(site.bundle),
    playerById: playerMapOf(site.bundle),
    articles,
    polls,
    predictions,
  };
}

/* ------------------------------ Match centre ------------------------------ */

export interface CommentaryItem {
  event: BallEvent;
  batterName: string;
  bowlerName: string;
  dismissedName: string | null;
}

export interface MatchCentreData {
  site: SiteContext;
  computed: MatchComputed;
  season: Season;
  innings: InningsComputed[];
  commentary: CommentaryItem[];
  playingXI: Array<PlayingXIEntry & { player: Player; team: Team }>;
  playerById: Map<string, Player>;
  teamById: Map<string, Team>;
  venue: Venue;
  h2h: Array<{ match: MatchComputed; result: string }>;
  standingsRowA: StandingRow | null;
  standingsRowB: StandingRow | null;
}

export const getMatchCentre = cache(async (slug: string): Promise<MatchCentreData | null> => {
  const site = await loadSite();
  for (const bundle of site.bundles) {
    const match = bundle.matches.find((row) => row.slug === slug);
    if (!match) continue;
    const analytics = site.analyticsBySeason.get(bundle.season.id);
    const computed = analytics?.matchById.get(match.id);
    if (!analytics || !computed) continue;

    const playerById = playerMapOf(bundle);
    const teamById = teamMapOf(bundle);
    const venue = venueMapOf(bundle).get(match.venueId);
    if (!venue) continue;

    const inningsIds = new Set(bundle.innings.filter((row) => row.matchId === match.id).map((row) => row.id));
    const commentary: CommentaryItem[] = bundle.ballEvents
      .filter((event) => inningsIds.has(event.inningsId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((event) => ({
        event,
        batterName: playerById.get(event.batterId)?.fullName ?? "Unknown batter",
        bowlerName: playerById.get(event.bowlerId)?.fullName ?? "Unknown bowler",
        dismissedName: event.dismissedPlayerId ? (playerById.get(event.dismissedPlayerId)?.fullName ?? null) : null,
      }));

    const playingXI = bundle.playingXI
      .filter((row) => row.matchId === match.id)
      .map((row) => {
        const player = playerById.get(row.playerId);
        const team = teamById.get(row.teamId);
        return player && team ? { ...row, player, team } : null;
      })
      .filter((row): row is PlayingXIEntry & { player: Player; team: Team } => row !== null);

    const h2h = analytics.matches
      .filter(
        (row) =>
          row.match.id !== match.id &&
          row.match.status === "completed" &&
          ((row.match.teamAId === match.teamAId && row.match.teamBId === match.teamBId) ||
            (row.match.teamAId === match.teamBId && row.match.teamBId === match.teamAId)),
      )
      .slice(-5)
      .map((row) => ({ match: row, result: row.resultText ?? "Completed" }));

    return {
      site,
      computed,
      season: bundle.season,
      innings: computed.innings,
      commentary,
      playingXI,
      playerById,
      teamById,
      venue,
      h2h,
      standingsRowA: analytics.standings.find((row) => row.teamId === match.teamAId) ?? null,
      standingsRowB: analytics.standings.find((row) => row.teamId === match.teamBId) ?? null,
    };
  }
  return null;
});

/* ------------------------------ Teams ------------------------------ */

export interface TeamProfileData {
  site: SiteContext;
  team: Team;
  squad: Array<{ player: Player; captain: boolean; viceCaptain: boolean; jerseyNumber: number | null }>;
  standingsRow: StandingRow | null;
  recent: MatchComputed[];
  upcoming: MatchComputed[];
  aggregate: TeamAggregate | null;
  history: Array<{ season: Season; position: number | null; played: number; won: number; points: number }>;
  headToHead: Array<{ team: Team; played: number; won: number; lost: number }>;
  topRunScorer: BattingAggregate | null;
  topWicketTaker: BowlingAggregate | null;
}

export const getTeamProfile = cache(async (slug: string): Promise<TeamProfileData | null> => {
  const site = await loadSite();
  const bundle = site.bundle;
  const team = bundle.teams.find((row) => row.slug === slug);
  if (!team) return null;
  const analytics = site.analytics;
  const playerById = playerMapOf(bundle);

  const squad = bundle.squads
    .filter((row) => row.teamId === team.id)
    .map((row) => {
      const player = playerById.get(row.playerId);
      return player
        ? { player, captain: row.captain, viceCaptain: row.viceCaptain, jerseyNumber: row.jerseyNumber }
        : null;
    })
    .filter((row): row is { player: Player; captain: boolean; viceCaptain: boolean; jerseyNumber: number | null } => row !== null)
    .sort((a, b) => Number(b.captain) - Number(a.captain) || Number(b.viceCaptain) - Number(a.viceCaptain));

  const teamMatches = analytics.matches
    .filter((row) => row.match.teamAId === team.id || row.match.teamBId === team.id)
    .sort((a, b) => new Date(b.match.scheduledAt).getTime() - new Date(a.match.scheduledAt).getTime());

  const recent = teamMatches.filter((row) => row.match.status === "completed" || row.match.status === "live");
  const upcoming = teamMatches
    .filter((row) => row.match.status === "scheduled")
    .sort((a, b) => new Date(a.match.scheduledAt).getTime() - new Date(b.match.scheduledAt).getTime());

  const history = site.bundles.map((seasonBundle) => {
    const seasonAnalytics = site.analyticsBySeason.get(seasonBundle.season.id);
    const row = seasonAnalytics?.standings.find((standing) => standing.teamId === team.id) ?? null;
    return {
      season: seasonBundle.season,
      position: row?.position ?? null,
      played: row?.played ?? 0,
      won: row?.won ?? 0,
      points: row?.points ?? 0,
    };
  });

  const headToHead = bundle.teams
    .filter((other) => other.id !== team.id)
    .map((other) => {
      const meetings = analytics.matches.filter(
        (row) =>
          row.match.status === "completed" &&
          ((row.match.teamAId === team.id && row.match.teamBId === other.id) ||
            (row.match.teamAId === other.id && row.match.teamBId === team.id)),
      );
      const won = meetings.filter((row) => row.match.winnerId === team.id).length;
      const lost = meetings.filter((row) => row.match.winnerId === other.id).length;
      return { team: other, played: meetings.length, won, lost };
    })
    .filter((row) => row.played > 0)
    .sort((a, b) => b.played - a.played);

  const batting = analytics.batting.filter((row) => row.teamId === team.id);
  const bowling = analytics.bowling.filter((row) => row.teamId === team.id);

  return {
    site,
    team,
    squad,
    standingsRow: analytics.standings.find((row) => row.teamId === team.id) ?? null,
    recent,
    upcoming,
    aggregate: analytics.teams.find((row) => row.teamId === team.id) ?? null,
    history,
    headToHead,
    topRunScorer: batting[0] ?? null,
    topWicketTaker: bowling[0] ?? null,
  };
});

/* ------------------------------ Players ------------------------------ */

export const getPlayerProfile = cache(async (slug: string): Promise<PlayerProfileData | null> => {
  const site = await loadSite();
  const player = site.bundle.players.find((row) => row.slug === slug);
  if (!player) return null;

  const teamById = teamMapOf(site.bundle);
  const currentSquad = site.bundle.squads.find((row) => row.playerId === player.id);
  const currentTeam = currentSquad ? (teamById.get(currentSquad.teamId) ?? null) : null;
  const teamIds = new Set(
    site.bundles.flatMap((bundle) =>
      bundle.squads.filter((row) => row.playerId === player.id).map((row) => row.teamId),
    ),
  );
  const teams = site.bundle.teams.filter((team) => teamIds.has(team.id));

  const career: PlayerCareerSeason[] = [];
  for (const bundle of site.bundles) {
    const analytics = site.analyticsBySeason.get(bundle.season.id);
    if (!analytics) continue;
    const squad = bundle.squads.find((row) => row.playerId === player.id);
    if (!squad) continue;
    const batting = analytics.batting.find((row) => row.playerId === player.id);
    const bowling = analytics.bowling.find((row) => row.playerId === player.id);
    const matches = new Set(
      bundle.playingXI.filter((row) => row.playerId === player.id).map((row) => row.matchId),
    );
    career.push({
      seasonId: bundle.season.id,
      seasonName: bundle.season.name,
      teamId: squad.teamId,
      teamName: teamById.get(squad.teamId)?.name ?? "NPL",
      matches: matches.size,
      runs: batting?.runs ?? 0,
      balls: batting?.balls ?? 0,
      wickets: bowling?.wickets ?? 0,
      bowlingBalls: bowling?.legalBalls ?? 0,
      runsConceded: bowling?.runsConceded ?? 0,
      highScore: batting?.highScore ?? 0,
    });
  }

  const recentBatting: PlayerProfileData["recentBatting"] = [];
  const recentBowling: PlayerProfileData["recentBowling"] = [];
  for (const bundle of site.bundles) {
    const analytics = site.analyticsBySeason.get(bundle.season.id);
    if (!analytics) continue;
    const bundleTeams = teamMapOf(bundle);
    for (const computed of analytics.inningsById.values()) {
      const match = analytics.matchById.get(computed.innings.matchId);
      if (!match) continue;
      const opponent = opponentOf(match, computed.innings.battingTeamId);
      const batting = computed.batting.find((row) => row.playerId === player.id);
      if (batting) {
        recentBatting.push({
          matchId: match.match.id,
          matchSlug: match.match.slug,
          opponent: opponent.name,
          date: match.match.scheduledAt,
          runs: batting.runs,
          balls: batting.balls,
          out: batting.out,
        });
      }
      const bowling = computed.bowling.find((row) => row.playerId === player.id);
      if (bowling) {
        recentBowling.push({
          matchId: match.match.id,
          matchSlug: match.match.slug,
          opponent: bundleTeams.get(computed.innings.battingTeamId)?.name ?? "Opponent",
          date: match.match.scheduledAt,
          wickets: bowling.wickets,
          runs: bowling.runsConceded,
          overs: bowling.overs,
        });
      }
    }
  }
  recentBatting.sort((a, b) => b.date.localeCompare(a.date));
  recentBowling.sort((a, b) => b.date.localeCompare(a.date));

  const roleLabels: Record<Player["playingRole"], string> = {
    batter: "Batter",
    bowler: "Bowler",
    all_rounder: "All-rounder",
    wicketkeeper: "Wicketkeeper",
  };

  return {
    player,
    teams,
    currentTeam,
    career,
    recentBatting: recentBatting.slice(0, 8),
    recentBowling: recentBowling.slice(0, 8),
    roleLabel: roleLabels[player.playingRole],
  };
});

/* ------------------------------ Statistics ------------------------------ */

export interface StatisticsData {
  site: SiteContext;
  season: Season;
  analytics: SeasonAnalytics;
  records: SeasonRecords;
  teamById: Map<string, Team>;
  playerById: Map<string, Player>;
  batting: BattingAggregate[];
  bowling: BowlingAggregate[];
  teams: TeamAggregate[];
  standings: StandingRow[];
}

export const getStatisticsData = cache(async (seasonSlug?: string): Promise<StatisticsData> => {
  const site = await loadSite();
  const season = seasonSlug ? site.seasons.find((row) => row.slug === seasonSlug) : site.activeSeason;
  if (!season) throw new Error("Season not found");
  const bundle = site.bundles.find((row) => row.season.id === season.id);
  const analytics = site.analyticsBySeason.get(season.id);
  if (!bundle || !analytics) throw new Error("Season data not found");
  return {
    site,
    season,
    analytics,
    records: analytics.records,
    teamById: teamMapOf(bundle),
    playerById: playerMapOf(bundle),
    batting: analytics.batting,
    bowling: analytics.bowling,
    teams: analytics.teams,
    standings: analytics.standings,
  };
});

/* ------------------------------ Fixtures / results ------------------------------ */

export interface MatchListData {
  site: SiteContext;
  matches: MatchComputed[];
  teamById: Map<string, Team>;
  season: Season;
}

export async function getMatchList(kind: "fixtures" | "results" | "live" | "all", seasonSlug?: string): Promise<MatchListData> {
  const site = await loadSite();
  const season = seasonSlug ? site.seasons.find((row) => row.slug === seasonSlug) : site.activeSeason;
  if (!season) throw new Error("Season not found");
  const analytics = site.analyticsBySeason.get(season.id);
  const bundle = site.bundles.find((row) => row.season.id === season.id);
  if (!analytics || !bundle) throw new Error("Season data not found");
  let matches = [...analytics.matches];
  if (kind === "fixtures") matches = matches.filter((row) => row.match.status === "scheduled");
  if (kind === "results") matches = matches.filter((row) => row.match.status === "completed" || row.match.status === "abandoned");
  if (kind === "live") matches = matches.filter((row) => row.match.status === "live");
  matches.sort((a, b) =>
    kind === "results"
      ? new Date(b.match.scheduledAt).getTime() - new Date(a.match.scheduledAt).getTime()
      : new Date(a.match.scheduledAt).getTime() - new Date(b.match.scheduledAt).getTime(),
  );
  return { site, matches, teamById: teamMapOf(bundle), season };
}

export function matchDateLabel(match: Match): string {
  return formatKathmanduDate(match.scheduledAt);
}
