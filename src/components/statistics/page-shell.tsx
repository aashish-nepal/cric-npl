import Link from "next/link";
import type { ReactNode } from "react";
import type { Season, Team } from "@/types/cricket";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SeasonFilter, StatisticsSubnav, TeamFilter } from "@/components/statistics/leaderboard-tables";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatisticsPageShell({
  title,
  description,
  path,
  seasons,
  season,
  teams,
  teamId,
  children,
}: {
  title: string;
  description: string;
  path: string;
  seasons: Season[];
  season: Season;
  teams: Team[];
  teamId?: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader eyebrow={season.name} title={title} description={description} />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Statistics", href: "/statistics" }, { label: title }]} />
      </div>
      <div className="container-page space-y-4 pb-10">
        <StatisticsSubnav current={path} />
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
          <SeasonFilter seasons={seasons} currentSlug={season.slug} basePath={path} teamId={teamId} />
          <TeamFilter teams={teams} currentTeamId={teamId} basePath={path} seasonSlug={season.slug} />
        </div>
        {children}
        <p className="text-xs text-muted-foreground">
          Aggregates are derived from recorded ball events.{" "}
          <Link href="/statistics/records" className="font-semibold text-primary hover:underline">
            View season records →
          </Link>
        </p>
      </div>
    </>
  );
}

export function LeaderboardCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="overflow-x-auto pt-0">{children}</CardContent>
    </Card>
  );
}
