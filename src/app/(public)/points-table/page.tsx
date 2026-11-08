import type { Metadata } from "next";
import Link from "next/link";
import { getSeasonContext, loadSite } from "@/services/cricket";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { StandingsTable } from "@/components/cricket/standings-table";
import { FormBadge } from "@/components/cricket/badges";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "NPL points table",
  description:
    "The latest Nepal Premier League points table with wins, losses, no results, points and net run rate, calculated from ball-by-ball data.",
  alternates: { canonical: "/points-table", languages: { en: "/points-table", ne: "/ne/points-table" } },
};

export default async function PointsTablePage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const { season: seasonSlug } = await searchParams;
  const [{ season, bundle, analytics }, site] = await Promise.all([getSeasonContext(seasonSlug), loadSite()]);

  const form = new Map<string, Array<"W" | "L" | "T" | "NR">>();
  for (const team of bundle.teams) form.set(team.id, []);
  const completed = [...analytics.matches]
    .filter((row) => row.match.status === "completed" || row.match.status === "abandoned")
    .sort((a, b) => new Date(a.match.scheduledAt).getTime() - new Date(b.match.scheduledAt).getTime());
  for (const row of completed) {
    const a = form.get(row.match.teamAId);
    const b = form.get(row.match.teamBId);
    if (!a || !b) continue;
    if (row.match.status === "abandoned" || !row.match.winnerId) {
      a.push("NR");
      b.push("NR");
      continue;
    }
    if (row.match.winnerId === row.match.teamAId) {
      a.push("W");
      b.push("L");
    } else {
      a.push("L");
      b.push("W");
    }
  }

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Points table", path: "/points-table" }])} />
      <PageHeader
        eyebrow={season.name}
        title="Points table"
        description="Two points for a win, one for a tie or no-result. Net run rate separates teams level on points. The table is recalculated from every recorded innings."
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Points table" }]} />
      </div>
      <div className="container-page py-4">
        <div className="flex flex-wrap gap-1.5" role="navigation" aria-label="Season filter">
          {site.seasons.map((row) => (
            <Link
              key={row.id}
              href={`/points-table?season=${row.slug}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                row.id === season.id
                  ? "border-primary bg-primary text-white"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
              )}
            >
              {row.name}
            </Link>
          ))}
        </div>
      </div>
      <div className="container-page grid gap-6 py-6 sm:py-8 lg:grid-cols-[1fr_300px]">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <StandingsTable standings={analytics.standings} teamById={analytics.teamById} />
        </section>
        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-bold tracking-tight">Recent form</h2>
            <ul className="mt-3 space-y-3">
              {analytics.standings.map((row) => {
                const team = analytics.teamById.get(row.teamId);
                if (!team) return null;
                const results = (form.get(row.teamId) ?? []).slice(-5);
                return (
                  <li key={row.teamId} className="flex items-center justify-between gap-2">
                    <Link href={`/teams/${team.slug}`} className="truncate text-xs font-medium hover:text-primary">
                      {team.shortName}
                    </Link>
                    <span className="flex gap-1">
                      {results.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      ) : (
                        results.map((result, index) => <FormBadge key={`${row.teamId}-${index}`} result={result} />)
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="rounded-lg border border-border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
            <h2 className="font-semibold text-foreground">How net run rate works</h2>
            <p className="mt-1.5">
              NRR is runs scored per over minus runs conceded per over. A side bowled out is treated as having faced its
              full quota. No-results are excluded entirely.
            </p>
            <Link href="/guides/cricket-statistics-explained" className="mt-2 inline-flex font-semibold text-primary hover:underline">
              Read the full explainer →
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
