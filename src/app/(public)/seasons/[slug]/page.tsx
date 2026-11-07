import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeasonPage } from "@/services/content";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { StandingsTable } from "@/components/cricket/standings-table";
import { MatchCard } from "@/components/match/match-card";
import { StatCard } from "@/components/statistics/stat-card";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSeasonPage(slug);
  if (!data) return { title: "Season not found" };
  return {
    title: `${data.seasonName} — standings, results and statistics`,
    description: `Final standings, results and leading players for ${data.seasonName}.`,
    alternates: { canonical: `/seasons/${slug}` },
  };
}

export default async function SeasonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getSeasonPage(slug);
  if (!data) notFound();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Seasons", path: "/seasons" }, { name: data.seasonName, path: `/seasons/${slug}` }])} />
      <section className="border-b border-border bg-surface">
        <div className="container-page py-4">
          <Breadcrumbs items={[{ label: "Seasons", href: "/seasons" }, { label: data.seasonName }]} />
        </div>
        <div className="container-page pb-6 sm:pb-8">
          <p className="eyebrow">Season hub</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{data.seasonName}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {data.champion ? `${data.champion.name} finished top of the table.` : "Season in progress."} Standings are
            calculated from completed matches only.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-6 py-6 sm:py-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-8">
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <h2 className="border-b border-border px-4 py-3 text-sm font-bold tracking-tight">Standings</h2>
            <StandingsTable standings={data.standings} teamById={data.teamById} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold tracking-tight">Matches</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.matches.slice(0, 12).map((match) => (
                <MatchCard key={match.match.id} match={match} seasonName={data.seasonName} />
              ))}
            </div>
            <Link href={`/results?season=${slug}`} className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline">
              All results →
            </Link>
          </section>
        </div>

        <aside className="space-y-3">
          {data.topScorer ? (
            <StatCard eyebrow="Most runs" title={data.topScorer.name} value={data.topScorer.value} subtitle={data.topScorer.team} href="/statistics" />
          ) : null}
          {data.topWicketTaker ? (
            <StatCard eyebrow="Most wickets" title={data.topWicketTaker.name} value={data.topWicketTaker.value} subtitle={data.topWicketTaker.team} href="/statistics" />
          ) : null}
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-bold tracking-tight">Season links</h2>
            <ul className="mt-2 space-y-1.5 text-xs">
              <li><Link href={`/points-table?season=${slug}`} className="text-primary hover:underline">Points table</Link></li>
              <li><Link href={`/fixtures?season=${slug}`} className="text-primary hover:underline">Fixtures</Link></li>
              <li><Link href={`/results?season=${slug}`} className="text-primary hover:underline">Results</Link></li>
              <li><Link href={`/statistics?season=${slug}`} className="text-primary hover:underline">Statistics</Link></li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
