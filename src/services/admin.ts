import { cache } from "react";
import type { BallEvent, MatchComputed, Player, Season, Team } from "@/types/cricket";
import type { Comment, NewsArticle, NewsCategory, UserProfile } from "@/types/content";
import type { AuditLogEntry, SyncLogEntry } from "@/lib/data/repository";
import { getRepository } from "@/lib/data";
import { loadSite, type SiteContext } from "./cricket";

export interface AdminOverview {
  site: SiteContext;
  live: MatchComputed[];
  scheduled: MatchComputed[];
  completed: MatchComputed[];
  articles: NewsArticle[];
  categories: NewsCategory[];
  pendingComments: Array<Comment & { articleTitle: string; articleSlug: string }>;
  users: UserProfile[];
  auditLogs: AuditLogEntry[];
  syncLogs: SyncLogEntry[];
  demo: boolean;
}

export const getAdminOverview = cache(async (): Promise<AdminOverview> => {
  const site = await loadSite();
  const repository = getRepository();
  const [articles, categories, users, auditLogs, syncLogs] = await Promise.all([
    repository.getArticles({ includeDrafts: true, limit: 100 }),
    repository.getNewsCategories(),
    repository.getUsers(),
    repository.getAuditLogs(20),
    repository.getSyncLogs(10),
  ]);

  const commentGroups = await Promise.all(
    articles.map(async (article) => {
      const comments = await repository.getComments(article.id, true);
      return comments
        .filter((comment) => comment.status === "pending")
        .map((comment) => ({ ...comment, articleTitle: article.title, articleSlug: article.slug }));
    }),
  );
  const pendingComments = commentGroups.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const matches = [...site.analytics.matches];
  return {
    site,
    live: matches.filter((row) => row.match.status === "live"),
    scheduled: matches.filter((row) => row.match.status === "scheduled"),
    completed: matches.filter((row) => row.match.status === "completed"),
    articles,
    categories,
    pendingComments,
    users,
    auditLogs,
    syncLogs,
    demo: repository.isDemo,
  };
});

export interface AdminCommentRow extends Comment {
  articleTitle: string;
  articleSlug: string;
}

export const getAdminComments = cache(async (): Promise<AdminCommentRow[]> => {
  const repository = getRepository();
  const articles = await repository.getArticles({ includeDrafts: true, limit: 200 });
  const groups = await Promise.all(
    articles.map(async (article) => {
      const comments = await repository.getComments(article.id, true);
      return comments.map((comment) => ({
        ...comment,
        articleTitle: article.title,
        articleSlug: article.slug,
      }));
    }),
  );
  return groups.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});

export const getAdminArticle = cache(async (articleId: string): Promise<NewsArticle | null> => {
  const repository = getRepository();
  const articles = await repository.getArticles({ includeDrafts: true, limit: 200 });
  return articles.find((article) => article.id === articleId) ?? null;
});

export interface AdminMatchData {
  site: SiteContext;
  season: Season;
  computed: MatchComputed;
  current: MatchComputed["currentInnings"];
  battingTeam: Team | null;
  bowlingTeam: Team | null;
  battingPlayers: Player[];
  bowlingPlayers: Player[];
  allPlayers: Player[];
  recentEvents: Array<BallEvent & { batterName: string; bowlerName: string }>;
  strikerId: string | null;
  nonStrikerId: string | null;
}

export const getAdminMatch = cache(async (matchId: string): Promise<AdminMatchData | null> => {
  const site = await loadSite();
  for (const bundle of site.bundles) {
    const match = bundle.matches.find((row) => row.id === matchId);
    if (!match) continue;
    const analytics = site.analyticsBySeason.get(bundle.season.id);
    const computed = analytics?.matchById.get(match.id);
    if (!analytics || !computed) continue;

    const playerById = new Map(bundle.players.map((player) => [player.id, player]));
    const teamById = new Map(bundle.teams.map((team) => [team.id, team]));
    const squad = bundle.squads.filter((row) => row.seasonId === bundle.season.id);
    const current = computed.currentInnings;
    const battingTeamId = current?.innings.battingTeamId ?? match.teamAId;
    const bowlingTeamId = current?.innings.bowlingTeamId ?? match.teamBId;
    const battingPlayers = squad
      .filter((row) => row.teamId === battingTeamId)
      .map((row) => playerById.get(row.playerId))
      .filter((player): player is Player => Boolean(player));
    const bowlingPlayers = squad
      .filter((row) => row.teamId === bowlingTeamId)
      .map((row) => playerById.get(row.playerId))
      .filter((player): player is Player => Boolean(player));
    const allPlayers = squad
      .filter((row) => row.teamId === battingTeamId || row.teamId === bowlingTeamId)
      .map((row) => playerById.get(row.playerId))
      .filter((player): player is Player => Boolean(player));

    const inningsIds = new Set(bundle.innings.filter((row) => row.matchId === match.id).map((row) => row.id));
    const recentEvents = bundle.ballEvents
      .filter((event) => inningsIds.has(event.inningsId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 15)
      .map((event) => ({
        ...event,
        batterName: playerById.get(event.batterId)?.fullName ?? "Unknown batter",
        bowlerName: playerById.get(event.bowlerId)?.fullName ?? "Unknown bowler",
      }));

    const batting = current?.batting ?? [];
    const strikerId = batting.find((row) => !row.out)?.playerId ?? null;
    const nonStrikerId = batting.filter((row) => !row.out)[1]?.playerId ?? null;

    return {
      site,
      season: bundle.season,
      computed,
      current,
      battingTeam: teamById.get(battingTeamId) ?? null,
      bowlingTeam: teamById.get(bowlingTeamId) ?? null,
      battingPlayers,
      bowlingPlayers,
      allPlayers,
      recentEvents,
      strikerId,
      nonStrikerId,
    };
  }
  return null;
});
