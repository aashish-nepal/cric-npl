import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Radio, Trophy, Users } from "lucide-react";
import { getHomeData } from "@/services/cricket";
import { getRepository } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { SectionHeader } from "@/components/layout/section-header";
import { MatchCard } from "@/components/match/match-card";
import { MatchTicker } from "@/components/match/match-ticker";
import { StandingsTable } from "@/components/cricket/standings-table";
import { ArticleCard } from "@/components/news/article-card";
import { StatCard } from "@/components/statistics/stat-card";
import { TeamCard } from "@/components/cricket/team-card";
import { PollCard } from "@/components/fan/poll-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { formatKathmanduDateTime, formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "NPL Cricket Hub — Live NPL scores, stats and news",
  description:
    "Live Nepal Premier League scores, ball-by-ball commentary, fixtures, results, points table, team and player statistics, analysis and fan polls.",
  alternates: { canonical: "/", languages: { en: "/", ne: "/ne" } },
};

export default async function HomePage() {
  const [data, session] = await Promise.all([getHomeData(), getSession()]);
  const repository = getRepository();
  const [categories, votes] = await Promise.all([
    repository.getNewsCategories(),
    session ? repository.getFanVotes(session.id) : Promise.resolve([]),
  ]);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const featuredArticle = data.articles.find((article) => article.featured) ?? data.articles[0] ?? null;
  const secondaryArticles = data.articles.filter((article) => article.id !== featuredArticle?.id).slice(0, 3);
  const topRunScorer = data.site.analytics.records.leadingRunScorer;
  const topWicketTaker = data.site.analytics.records.leadingWicketTaker;
  const nextMatch = data.upcoming[0] ?? null;
  const poll = data.polls[0] ?? null;
  const pollVote = poll ? (votes.find((vote) => vote.pollId === poll.id)?.optionId ?? null) : null;

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />

      <section className="dark-panel border-b border-white/10">
        <div className="container-page grid gap-8 py-8 lg:grid-cols-[1.55fr_1fr] lg:items-start lg:py-12">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="dark" className="gap-1.5">
                <Radio className="h-3 w-3 text-accent" aria-hidden="true" />
                {data.site.activeSeason.name}
              </Badge>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                Live scores · Stats · Independent coverage
              </span>
            </div>
            <h1 className="mt-3 max-w-3xl text-balance text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
              The NPL, ball by ball.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              Live scores, full scorecards, season statistics and independent reporting on the Nepal Premier League.
              Every number on this site traces back to a recorded delivery.
            </p>

            {data.featured ? (
              <div className="mt-6">
                <MatchCard match={data.featured} seasonName={data.site.activeSeason.name} variant="featured" />
              </div>
            ) : (
              <p className="mt-6 rounded-lg border border-white/15 p-4 text-sm text-white/70">
                No fixtures are published for this season yet.
              </p>
            )}
          </div>

          <aside className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">Latest headlines</h2>
              <Link href="/news" className="text-[11px] font-semibold text-accent hover:underline">
                All news
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-white/10">
              {data.articles.slice(0, 5).map((article) => (
                <li key={article.id}>
                  <Link href={`/news/${article.slug}`} className="group block py-3">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-white/90 group-hover:text-accent">
                      {article.title}
                    </p>
                    <p className="mt-1 text-[11px] text-white/45">
                      {categoryById.get(article.categoryId)?.name ?? "News"} · {article.readingMinutes} min read
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Live now</p>
                <p className="mt-1 text-2xl font-bold tabular">{data.live.length}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Upcoming</p>
                <p className="mt-1 text-2xl font-bold tabular">{data.upcoming.length}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <MatchTicker
        matches={data.live.length > 0 ? data.live : data.upcoming}
        seasonName={data.site.activeSeason.name}
        title={data.live.length > 0 ? "Live now" : "Next matches"}
        emptyLabel="No live matches right now."
      />

      <div className="container-page py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-10">
            <section aria-labelledby="news-heading">
              <SectionHeader eyebrow="Editorial" title="Latest from the NPL" href="/news" linkLabel="All stories" />
              {featuredArticle ? (
                <div className="space-y-4">
                  <ArticleCard
                    article={featuredArticle}
                    category={categoryById.get(featuredArticle.categoryId)}
                    variant="featured"
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    {secondaryArticles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        category={categoryById.get(article.categoryId)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No articles have been published yet.</p>
              )}
            </section>

            <section aria-labelledby="fixtures-heading">
              <SectionHeader eyebrow="Fixtures" title="Coming up" href="/fixtures" linkLabel="Full schedule" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {data.upcoming.slice(0, 6).map((match) => (
                  <MatchCard key={match.match.id} match={match} seasonName={data.site.activeSeason.name} />
                ))}
              </div>
              {data.upcoming.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  The league phase is complete. Check the results page for completed fixtures.
                </p>
              ) : null}
            </section>

            <section aria-labelledby="teams-heading">
              <SectionHeader eyebrow="Franchises" title="The teams" href="/teams" linkLabel="All teams" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {data.site.bundle.teams.slice(0, 6).map((team) => (
                  <TeamCard key={team.id} team={team} standing={data.standings.find((row) => row.teamId === team.id)} />
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <h2 className="text-sm font-bold tracking-tight">Points table</h2>
                <Link href="/points-table" className="text-[11px] font-semibold text-primary hover:underline">
                  Full table
                </Link>
              </div>
              <StandingsTable standings={data.standings} teamById={data.teamById} compact />
            </section>

            <section>
              <h2 className="mb-3 text-sm font-bold tracking-tight">Season leaders</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {topRunScorer ? (
                  <StatCard
                    eyebrow="Most runs"
                    title={data.playerById.get(topRunScorer.playerId)?.fullName ?? "—"}
                    value={`${topRunScorer.runs} runs`}
                    subtitle={`${topRunScorer.innings} inns · SR ${formatNumber(topRunScorer.strikeRate, 1)}`}
                    href="/statistics#batting"
                  />
                ) : null}
                {topWicketTaker ? (
                  <StatCard
                    eyebrow="Most wickets"
                    title={data.playerById.get(topWicketTaker.playerId)?.fullName ?? "—"}
                    value={`${topWicketTaker.wickets} wickets`}
                    subtitle={`${topWicketTaker.innings} inns · Econ ${formatNumber(topWicketTaker.economy, 2)}`}
                    href="/statistics#bowling"
                  />
                ) : null}
              </div>
            </section>

            {nextMatch ? (
              <section className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  Next fixture
                </div>
                <p className="mt-2 text-sm font-semibold">
                  {nextMatch.teamA.name} vs {nextMatch.teamB.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatKathmanduDateTime(nextMatch.match.scheduledAt)} NPT · {nextMatch.venue.name}
                </p>
                <Link href={`/matches/${nextMatch.match.slug}`} className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline">
                  Match preview →
                </Link>
              </section>
            ) : null}

            {poll ? (
              <section>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold tracking-tight">Fan poll</h2>
                  <Link href="/polls" className="text-[11px] font-semibold text-primary hover:underline">
                    All polls
                  </Link>
                </div>
                <PollCard poll={poll} userVoteOptionId={pollVote} signedIn={Boolean(session)} compact />
              </section>
            ) : null}

            <section className="rounded-lg border border-primary/20 bg-primary/[0.04] p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary">
                <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                Fan zone
              </div>
              <p className="mt-2 text-sm leading-6 text-foreground/80">
                Predict match winners, vote in polls and climb the supporter leaderboard.
              </p>
              <Link href="/fan-zone" className={buttonVariants({ size: "sm", className: "mt-3 w-full" })}>
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Enter fan zone
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
