import type { Metadata } from "next";
import { loadStatisticsBoard } from "@/services/statistics";
import { StatisticsPageShell, LeaderboardCard } from "@/components/statistics/page-shell";
import { BattingTable } from "@/components/statistics/leaderboard-tables";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "NPL batting statistics",
  description:
    "Full Nepal Premier League batting statistics: runs, average, strike rate, highest score, fours and sixes, derived from recorded ball-by-ball data.",
  alternates: { canonical: "/statistics/batting", languages: { en: "/statistics/batting", ne: "/ne/statistics" } },
};

export default async function BattingStatisticsPage({
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
          { name: "Batting", path: "/statistics/batting" },
        ])}
      />
      <StatisticsPageShell
        title="Batting statistics"
        description="Every batting aggregate for the selected season and team. Averages treat not-out innings correctly; strike rate uses balls faced."
        path="/statistics/batting"
        seasons={data.site.seasons}
        season={data.season}
        teams={data.site.bundle.teams}
        teamId={data.selectedTeam?.id}
      >
        <LeaderboardCard
          title={data.selectedTeam ? `${data.selectedTeam.name} batting` : "All batters"}
          description="Minimum values are not applied to totals; averages are shown for every batter with an innings."
        >
          <BattingTable rows={data.batting} playerById={data.playerById} teamById={data.teamById} />
        </LeaderboardCard>
      </StatisticsPageShell>
    </>
  );
}
