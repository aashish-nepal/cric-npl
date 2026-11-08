import type { Metadata } from "next";
import Link from "next/link";
import { getMatchList, loadSite } from "@/services/cricket";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MatchCard } from "@/components/match/match-card";
import { EmptyState } from "@/components/ui/feedback";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "NPL results",
  description: "Completed Nepal Premier League matches with result summaries, scorecards and post-match statistics.",
  alternates: { canonical: "/results", languages: { en: "/results", ne: "/ne/results" } },
};

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const { season: seasonSlug } = await searchParams;
  const [data, site] = await Promise.all([getMatchList("results", seasonSlug), loadSite()]);

  return (
    <>
      <PageHeader
        eyebrow={data.season.name}
        title="Results"
        description="Every completed match, newest first. Open a match for the full scorecard, partnerships and commentary."
        actions={
          <Link href="/fixtures" className={buttonVariants({ variant: "outline", size: "sm" })}>
            View fixtures
          </Link>
        }
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Results" }]} />
      </div>
      <div className="container-page py-4">
        <div className="flex flex-wrap gap-1.5" role="navigation" aria-label="Season filter">
          {site.seasons.map((season) => (
            <Link
              key={season.id}
              href={`/results?season=${season.slug}`}
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
      </div>
      <div className="container-page py-6 sm:py-8">
        {data.matches.length === 0 ? (
          <EmptyState title="No completed matches" description="Results will appear here after the first match is completed." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.matches.map((match) => (
              <MatchCard key={match.match.id} match={match} seasonName={data.season.name} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
