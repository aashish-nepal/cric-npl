import type { Metadata } from "next";
import { loadStatisticsBoard } from "@/services/statistics";
import { StatisticsPageShell, LeaderboardCard } from "@/components/statistics/page-shell";
import { BattingTable } from "@/components/statistics/leaderboard-tables";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "NPL best batting average",
  description:
    "Nepal Premier League batting averages for the selected season. The leaderboard includes every dismissed batter; use the minimum-runs note when judging small samples.",
  alternates: { canonical: "/statistics/best-average", languages: { en: "/statistics/best-average", ne: "/ne/statistics" } },
};

export default async function BestAveragePage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; team?: string }>;
}) {
  const { season: seasonSlug, team: teamId } = await searchParams;
  const data = await loadStatisticsBoard(seasonSlug, teamId);
  const qualified = data.batting.filter((row) => row.innings > row.notOuts);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Statistics", path: "/statistics" },
          { name: "Best average", path: "/statistics/best-average" },
        ])}
      />
      <StatisticsPageShell
        title="Best batting average"
        description="Batting average is runs divided by dismissals. Not-out innings are counted as innings but not as dismissals."
        path="/statistics/best-average"
        seasons={data.site.seasons}
        season={data.season}
        teams={data.site.bundle.teams}
        teamId={data.selectedTeam?.id}
      >
        <LeaderboardCard
          title="Best averages"
          description="Batters with at least one dismissal, ranked by average. Small samples are shown honestly rather than hidden."
        >
          <BattingTable rows={qualified} playerById={data.playerById} teamById={data.teamById} metric="average" limit={25} />
        </LeaderboardCard>
      </StatisticsPageShell>
    </>
  );
}
