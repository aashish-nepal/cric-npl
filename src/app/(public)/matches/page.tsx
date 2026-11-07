import type { Metadata } from "next";
import Link from "next/link";
import { getMatchList, loadSite } from "@/services/cricket";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MatchCard } from "@/components/match/match-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All NPL matches",
  description: "Browse every Nepal Premier League match across seasons, including fixtures, live games and results.",
  alternates: { canonical: "/matches" },
};

export default async function MatchesPage({ searchParams }: { searchParams: Promise<{ season?: string; status?: string }> }) {
  const { season: seasonSlug, status } = await searchParams;
  const [data, site] = await Promise.all([getMatchList("all", seasonSlug), loadSite()]);
  const filter = status && ["scheduled", "live", "completed", "abandoned"].includes(status) ? status : "all";
  const matches = filter === "all" ? data.matches : data.matches.filter((match) => match.match.status === filter);
  const tabs = [
    { value: "all", label: "All" },
    { value: "scheduled", label: "Scheduled" },
    { value: "live", label: "Live" },
    { value: "completed", label: "Completed" },
    { value: "abandoned", label: "Abandoned" },
  ];

  return (
    <>
      <PageHeader eyebrow="Archive" title="All matches" description="Every match in the selected season. Filter by status or open a match centre." />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Matches" }]} />
      </div>
      <div className="container-page space-y-3 py-4">
        <div className="flex flex-wrap gap-1.5" role="navigation" aria-label="Season filter">
          {site.seasons.map((season) => (
            <Link
              key={season.id}
              href={`/matches?season=${season.slug}${filter !== "all" ? `&status=${filter}` : ""}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                season.id === data.season.id
                  ? "border-primary bg-primary text-white"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
              )}
            >
              {season.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="navigation" aria-label="Status filter">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/matches?season=${data.season.slug}${tab.value !== "all" ? `&status=${tab.value}` : ""}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                filter === tab.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="container-page py-6 sm:py-8">
        {matches.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            No matches match this filter.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map((match) => (
              <MatchCard key={match.match.id} match={match} seasonName={data.season.name} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
