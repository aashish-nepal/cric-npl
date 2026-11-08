import type { Metadata } from "next";
import { loadStatisticsBoard } from "@/services/statistics";
import { StatisticsPageShell, LeaderboardCard } from "@/components/statistics/page-shell";
import { BattingTable } from "@/components/statistics/leaderboard-tables";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "NPL most runs",
  description: "Nepal Premier League leading run scorers for the selected season, with innings, average, strike rate and boundary counts.",
  alternates: { canonical: "/statistics/most-runs", languages: { en: "/statistics/most-runs", ne: "/ne/statistics" } },
};

export default async function MostRunsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; team?: string }>;
}) {
  const { season: seasonSlug, team: teamId } = await searchParams;
  const data = await loadStatisticsBoard(seasonSlug, teamId);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Statistics", path: "/statistics" },
          { name: "Most runs", path: "/statistics/most-runs" },
        ])}
      />
      <StatisticsPageShell
        title="Most runs"
        description="The leading run scorers of the season, ranked by total runs. Every total traces back to recorded deliveries."
        path="/statistics/most-runs"
        seasons={data.site.seasons}
        season={data.season}
        teams={data.site.bundle.teams}
        teamId={data.selectedTeam?.id}
      >
        <LeaderboardCard title="Leading run scorers" description="Top 25 batters by runs.">
          <BattingTable rows={data.batting} playerById={data.playerById} teamById={data.teamById} metric="runs" limit={25} />
        </LeaderboardCard>
      </StatisticsPageShell>
    </>
  );
}
