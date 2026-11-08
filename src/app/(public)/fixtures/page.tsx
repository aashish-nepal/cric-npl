import type { Metadata } from "next";
import Link from "next/link";
import { getMatchList, loadSite } from "@/services/cricket";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MatchCard } from "@/components/match/match-card";
import { EmptyState } from "@/components/ui/feedback";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatKathmanduDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "NPL fixtures and schedule",
  description: "The full Nepal Premier League fixture list, grouped by date, with venues and Nepal Standard Time kick-offs.",
  alternates: { canonical: "/fixtures", languages: { en: "/fixtures", ne: "/ne/fixtures" } },
};

export default async function FixturesPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const { season: seasonSlug } = await searchParams;
  const [data, site] = await Promise.all([getMatchList("fixtures", seasonSlug), loadSite()]);
  const groups = new Map<string, typeof data.matches>();
  for (const match of data.matches) {
    const key = formatKathmanduDate(match.match.scheduledAt);
    const list = groups.get(key);
    if (list) list.push(match);
    else groups.set(key, [match]);
  }

  return (
    <>
      <PageHeader
        eyebrow={data.season.name}
        title="Fixtures & schedule"
        description="Every remaining fixture in the league phase. Match times are shown in Nepal Standard Time (UTC+05:45)."
        actions={
          <Link href="/results" className={buttonVariants({ variant: "outline", size: "sm" })}>
            View results
          </Link>
        }
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Fixtures" }]} />
      </div>
      <div className="container-page py-4">
        <div className="flex flex-wrap gap-1.5" role="navigation" aria-label="Season filter">
          {site.seasons.map((season) => (
            <Link
              key={season.id}
              href={`/fixtures?season=${season.slug}`}
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
      <div className="container-page space-y-8 py-6 sm:py-8">
        {data.matches.length === 0 ? (
          <EmptyState
            title="No fixtures scheduled"
            description="This season has no scheduled matches. Completed matches are listed under results."
            action={
              <Link href="/results" className={buttonVariants({ size: "sm" })}>
                View results
              </Link>
            }
          />
        ) : (
          [...groups.entries()].map(([date, matches]) => (
            <section key={date}>
              <h2 className="mb-3 border-b border-border pb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {date}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {matches.map((match) => (
                  <MatchCard key={match.match.id} match={match} seasonName={data.season.name} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
