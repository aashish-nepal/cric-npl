import type { Metadata } from "next";
import { loadStatisticsBoard } from "@/services/statistics";
import { StatisticsPageShell, LeaderboardCard } from "@/components/statistics/page-shell";
import { BowlingTable } from "@/components/statistics/leaderboard-tables";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "NPL most wickets",
  description: "Nepal Premier League leading wicket takers for the selected season, with economy, average, strike rate and best figures.",
  alternates: { canonical: "/statistics/most-wickets", languages: { en: "/statistics/most-wickets", ne: "/ne/statistics" } },
};

export default async function MostWicketsPage({
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
          { name: "Most wickets", path: "/statistics/most-wickets" },
        ])}
      />
      <StatisticsPageShell
        title="Most wickets"
        description="The leading wicket takers of the season, ranked by wickets with economy as the tie-breaker."
        path="/statistics/most-wickets"
        seasons={data.site.seasons}
        season={data.season}
        teams={data.site.bundle.teams}
        teamId={data.selectedTeam?.id}
      >
        <LeaderboardCard title="Leading wicket takers" description="Top 25 bowlers by wickets.">
          <BowlingTable rows={data.bowling} playerById={data.playerById} teamById={data.teamById} limit={25} />
        </LeaderboardCard>
      </StatisticsPageShell>
    </>
  );
}
