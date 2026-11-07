import { cache } from "react";
import type { MatchComputed, StandingRow, Team, Venue } from "@/types/cricket";
import type { Comment, NewsArticle, NewsCategory, UserProfile } from "@/types/content";
import { getRepository } from "@/lib/data";
import { loadSite, teamMapOf, venueMapOf, type SiteContext } from "./cricket";

export interface NewsIndexData {
  articles: NewsArticle[];
  categories: NewsCategory[];
  featured: NewsArticle | null;
  category: NewsCategory | null;
  page: number;
  totalPages: number;
}

const PAGE_SIZE = 9;

export async function getNewsIndex(params: { categorySlug?: string; tag?: string; page?: number } = {}): Promise<NewsIndexData> {
  const repository = getRepository();
  const [categories, all] = await Promise.all([
    repository.getNewsCategories(),
    repository.getArticles({ categorySlug: params.categorySlug, tag: params.tag }),
  ]);
  const page = Math.max(1, params.page ?? 1);
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const articles = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const category = params.categorySlug ? (categories.find((row) => row.slug === params.categorySlug) ?? null) : null;
  return {
    articles,
    categories,
    featured: all.find((article) => article.featured) ?? all[0] ?? null,
    category,
    page,
    totalPages,
  };
}

export interface ArticlePageData {
  article: NewsArticle;
  category: NewsCategory | null;
  author: UserProfile | null;
  related: NewsArticle[];
  comments: Comment[];
  newer: NewsArticle | null;
  older: NewsArticle | null;
}

export const getArticlePage = cache(async (slug: string): Promise<ArticlePageData | null> => {
  const repository = getRepository();
  const article = await repository.getArticleBySlug(slug);
  if (!article) return null;
  const [categories, author, related, comments, all] = await Promise.all([
    repository.getNewsCategories(),
    repository.getUserById(article.authorId),
    repository.getArticles({ categorySlug: undefined, limit: 20 }),
    repository.getComments(article.id),
    repository.getArticles({ limit: 50 }),
  ]);
  const category = categories.find((row) => row.id === article.categoryId) ?? null;
  const sorted = [...all].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  const index = sorted.findIndex((row) => row.id === article.id);
  return {
    article,
    category,
    author,
    related: related.filter((row) => row.id !== article.id && row.categoryId === article.categoryId).slice(0, 3),
    comments,
    newer: index > 0 ? (sorted[index - 1] ?? null) : null,
    older: index >= 0 && index < sorted.length - 1 ? (sorted[index + 1] ?? null) : null,
  };
});

export interface SeasonPageData {
  site: SiteContext;
  seasonName: string;
  standings: StandingRow[];
  matches: MatchComputed[];
  teamById: Map<string, Team>;
  champion: Team | null;
  topScorer: { name: string; team: string; value: string } | null;
  topWicketTaker: { name: string; team: string; value: string } | null;
}

export const getSeasonPage = cache(async (slug: string): Promise<SeasonPageData | null> => {
  const site = await loadSite();
  const bundle = site.bundles.find((row) => row.season.slug === slug);
  const analytics = bundle ? site.analyticsBySeason.get(bundle.season.id) : null;
  if (!bundle || !analytics) return null;
  const teamById = teamMapOf(bundle);
  const championId = analytics.standings[0]?.teamId ?? null;
  const topScorer = analytics.records.leadingRunScorer;
  const topBowler = analytics.records.leadingWicketTaker;
  const playerById = new Map(bundle.players.map((player) => [player.id, player]));

  return {
    site,
    seasonName: bundle.season.name,
    standings: analytics.standings,
    matches: [...analytics.matches].sort(
      (a, b) => new Date(b.match.scheduledAt).getTime() - new Date(a.match.scheduledAt).getTime(),
    ),
    teamById,
    champion: championId ? (teamById.get(championId) ?? null) : null,
    topScorer: topScorer
      ? {
          name: playerById.get(topScorer.playerId)?.fullName ?? "—",
          team: teamById.get(topScorer.teamId)?.shortName ?? "—",
          value: `${topScorer.runs} runs`,
        }
      : null,
    topWicketTaker: topBowler
      ? {
          name: playerById.get(topBowler.playerId)?.fullName ?? "—",
          team: teamById.get(topBowler.teamId)?.shortName ?? "—",
          value: `${topBowler.wickets} wickets`,
        }
      : null,
  };
});

export interface VenuePageData {
  venue: Venue;
  matches: MatchComputed[];
  teams: Map<string, Team>;
  stats: {
    matchesHosted: number;
    averageFirstInnings: number | null;
    highestTotal: number | null;
    lowestTotal: number | null;
  };
}

export const getVenuePage = cache(async (slug: string): Promise<VenuePageData | null> => {
  const site = await loadSite();
  const venues = venueMapOf(site.bundle);
  const venue = [...venues.values()].find((row) => row.slug === slug);
  if (!venue) return null;
  const matches: MatchComputed[] = [];
  const totals: number[] = [];
  let highest: number | null = null;
  let lowest: number | null = null;
  for (const bundle of site.bundles) {
    const analytics = site.analyticsBySeason.get(bundle.season.id);
    if (!analytics) continue;
    for (const computed of analytics.matches) {
      if (computed.venue.id !== venue.id) continue;
      matches.push(computed);
      for (const innings of computed.innings) {
        if (innings.innings.inningsNumber === 1 && innings.legalBalls > 0) totals.push(innings.runs);
        if (innings.legalBalls > 0) {
          highest = highest === null ? innings.runs : Math.max(highest, innings.runs);
          lowest = lowest === null ? innings.runs : Math.min(lowest, innings.runs);
        }
      }
    }
  }
  matches.sort((a, b) => new Date(b.match.scheduledAt).getTime() - new Date(a.match.scheduledAt).getTime());
  return {
    venue,
    matches,
    teams: teamMapOf(site.bundle),
    stats: {
      matchesHosted: matches.length,
      averageFirstInnings: totals.length > 0 ? Math.round(totals.reduce((sum, value) => sum + value, 0) / totals.length) : null,
      highestTotal: highest,
      lowestTotal: lowest,
    },
  };
});
