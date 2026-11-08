import type { Metadata } from "next";
import { loadStatisticsBoard } from "@/services/statistics";
import { StatisticsPageShell, LeaderboardCard } from "@/components/statistics/page-shell";
import { BowlingTable } from "@/components/statistics/leaderboard-tables";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "NPL bowling statistics",
  description:
    "Nepal Premier League bowling statistics: wickets, economy, average, strike rate, best figures and maidens, derived from ball-by-ball data.",
  alternates: { canonical: "/statistics/bowling", languages: { en: "/statistics/bowling", ne: "/ne/statistics" } },
};

export default async function BowlingStatisticsPage({
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
          { name: "Bowling", path: "/statistics/bowling" },
        ])}
      />
      <StatisticsPageShell
        title="Bowling statistics"
        description="Wickets, economy and strike rate for every bowler in the selected season. Best figures use the fewest runs as the tie-breaker."
        path="/statistics/bowling"
        seasons={data.site.seasons}
        season={data.season}
        teams={data.site.bundle.teams}
        teamId={data.selectedTeam?.id}
      >
        <LeaderboardCard
          title={data.selectedTeam ? `${data.selectedTeam.name} bowling` : "All bowlers"}
          description="Economy is runs conceded per over; bowling strike rate is balls per wicket."
        >
          <BowlingTable rows={data.bowling} playerById={data.playerById} teamById={data.teamById} />
        </LeaderboardCard>
      </StatisticsPageShell>
    </>
  );
}
