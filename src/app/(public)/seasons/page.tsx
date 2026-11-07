import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { getSeasonPage } from "@/services/content";
import { loadSite } from "@/services/cricket";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TeamLogo } from "@/components/cricket/identity";

export const metadata: Metadata = {
  title: "NPL seasons",
  description: "Browse Nepal Premier League seasons, final standings, champions and season-leading players.",
  alternates: { canonical: "/seasons" },
};

export default async function SeasonsPage() {
  const site = await loadSite();
  const pages = await Promise.all(site.seasons.map((season) => getSeasonPage(season.slug)));

  return (
    <>
      <PageHeader
        eyebrow="Archive"
        title="Seasons"
        description="Every NPL season on the platform, with final standings, leading run scorer and leading wicket taker."
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Seasons" }]} />
      </div>
      <div className="container-page grid gap-4 py-6 sm:py-8 lg:grid-cols-2">
        {pages.map((data) => {
          if (!data) return null;
          const season = site.seasons.find((row) => row.name === data.seasonName);
          return (
            <section key={data.seasonName} className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{data.seasonName}</h2>
                  <p className="text-xs text-muted-foreground">
                    {season?.startDate} – {season?.endDate} · {season?.status}
                  </p>
                </div>
                <Link href={`/seasons/${season?.slug ?? ""}`} className="text-xs font-semibold text-primary hover:underline">
                  Season hub →
                </Link>
              </div>

              {data.champion ? (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/[0.06] px-3 py-2">
                  <Trophy className="h-4 w-4 text-accent" aria-hidden="true" />
                  <TeamLogo team={data.champion} size="xs" />
                  <p className="text-xs font-semibold">
                    Table-topper: {data.champion.name}
                  </p>
                </div>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-2">
                {data.topScorer ? (
                  <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Most runs</p>
                    <p className="mt-0.5 truncate text-xs font-semibold">{data.topScorer.name}</p>
                    <p className="text-[11px] text-muted-foreground">{data.topScorer.value}</p>
                  </div>
                ) : null}
                {data.topWicketTaker ? (
                  <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Most wickets</p>
                    <p className="mt-0.5 truncate text-xs font-semibold">{data.topWicketTaker.name}</p>
                    <p className="text-[11px] text-muted-foreground">{data.topWicketTaker.value}</p>
                  </div>
                ) : null}
              </div>

              <ol className="mt-4 space-y-1.5">
                {data.standings.slice(0, 4).map((row) => {
                  const team = data.teamById.get(row.teamId);
                  return team ? (
                    <li key={row.teamId} className="flex items-center gap-2 text-xs">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold tabular">{row.position}</span>
                      <TeamLogo team={team} size="xs" />
                      <span className="flex-1 truncate font-medium">{team.name}</span>
                      <span className="tabular text-muted-foreground">{row.points} pts</span>
                    </li>
                  ) : null;
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </>
  );
}
