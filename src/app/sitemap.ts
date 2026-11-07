import type { MetadataRoute } from "next";
import { getRepository } from "@/lib/data";
import { GUIDES } from "@/constants/guides";
import { siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const repository = getRepository();
  const [seasons, bundles, articles, venues] = await Promise.all([
    repository.getSeasons(),
    repository.getAllBundles(),
    repository.getArticles({ limit: 200 }),
    repository.getVenues(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/live`, changeFrequency: "always", priority: 0.95 },
    { url: `${base}/fixtures`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/results`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/points-table`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/teams`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/players`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/statistics`, changeFrequency: "daily", priority: 0.85 },
    { url: `${base}/compare`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/seasons`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/venues`, changeFrequency: "weekly", priority: 0.65 },
    { url: `${base}/news`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/polls`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/predictions`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/fan-zone`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/guides`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/ne`, changeFrequency: "hourly", priority: 0.7 },
  ];

  const seasonRoutes: MetadataRoute.Sitemap = seasons.map((season) => ({
    url: `${base}/seasons/${season.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const teamRoutes: MetadataRoute.Sitemap = (bundles[0]?.teams ?? []).map((team) => ({
    url: `${base}/teams/${team.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const playerRoutes: MetadataRoute.Sitemap = (bundles[0]?.players ?? []).map((player) => ({
    url: `${base}/players/${player.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const matchRoutes: MetadataRoute.Sitemap = bundles.flatMap((bundle) =>
    bundle.matches.map((match) => ({
      url: `${base}/matches/${match.slug}`,
      changeFrequency: match.status === "live" ? ("always" as const) : ("daily" as const),
      priority: match.status === "live" ? 0.95 : 0.65,
      lastModified: match.lastUpdated,
    })),
  );

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${base}/news/${article.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
    lastModified: article.updatedAt,
  }));

  const venueRoutes: MetadataRoute.Sitemap = venues.map((venue) => ({
    url: `${base}/venues/${venue.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: `${base}/guides/${guide.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...seasonRoutes, ...teamRoutes, ...playerRoutes, ...matchRoutes, ...articleRoutes, ...venueRoutes, ...guideRoutes];
}
