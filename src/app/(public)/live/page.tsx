import type { Metadata } from "next";
import Link from "next/link";
import { Radio } from "lucide-react";
import { getMatchList, loadSite } from "@/services/cricket";
import { PageHeader } from "@/components/layout/section-header";
import { MatchCard } from "@/components/match/match-card";
import { EmptyState } from "@/components/ui/feedback";
import { buttonVariants } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = {
  title: "Live NPL scores",
  description: "Live Nepal Premier League scores with ball-by-ball commentary, scorecards and match centres.",
  alternates: { canonical: "/live", languages: { en: "/live", ne: "/ne/live" } },
};

export default async function LivePage() {
  const [live, upcoming, site] = await Promise.all([getMatchList("live"), getMatchList("fixtures"), loadSite()]);

  return (
    <>
      <PageHeader
        eyebrow="Match centre"
        title="Live NPL scores"
        description="Every live match with a full scorecard, partnerships, fall of wickets and ball-by-ball commentary. Pages refresh automatically while play is in progress."
        actions={
          <Link href="/fixtures" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Full fixtures
          </Link>
        }
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Live scores" }]} />
      </div>
      <div className="container-page space-y-10 py-6 sm:py-8">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="live-dot h-2 w-2 rounded-full bg-live" aria-hidden="true" />
            <h2 className="text-lg font-bold tracking-tight">Live now</h2>
            <span className="text-xs text-muted-foreground">{live.matches.length} match(es)</span>
          </div>
          {live.matches.length === 0 ? (
            <EmptyState
              title="No match is live right now"
              description="When a match starts, the live scorecard and commentary appear here automatically."
              action={
                <Link href="/fixtures" className={buttonVariants({ size: "sm" })}>
                  View upcoming fixtures
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {live.matches.map((match) => (
                <MatchCard key={match.match.id} match={match} seasonName={site.activeSeason.name} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight">Next up</h2>
          {upcoming.matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scheduled fixtures remain in this season.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {upcoming.matches.slice(0, 6).map((match) => (
                <MatchCard key={match.match.id} match={match} seasonName={site.activeSeason.name} />
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <Radio className="h-4 w-4 text-live" aria-hidden="true" />
            How live updates work
          </p>
          <p className="mt-1.5 leading-6">
            Live pages refresh every 30 seconds in your browser. Scores are calculated from recorded ball events, so the
            scorecard, commentary and standings always agree. This build does not ingest an external live feed; matches
            are scored through the admin console.
          </p>
        </aside>
      </div>
    </>
  );
}
