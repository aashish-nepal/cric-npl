import type { Metadata } from "next";
import { loadStatisticsBoard } from "@/services/statistics";
import { StatisticsPageShell, LeaderboardCard } from "@/components/statistics/page-shell";
import { BattingTable } from "@/components/statistics/leaderboard-tables";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "NPL most sixes",
  description: "Nepal Premier League batters with the most sixes in the selected season, plus runs, strike rate and fours.",
  alternates: { canonical: "/statistics/most-sixes", languages: { en: "/statistics/most-sixes", ne: "/ne/statistics" } },
};

export default async function MostSixesPage({
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
          { name: "Most sixes", path: "/statistics/most-sixes" },
        ])}
      />
      <StatisticsPageShell
        title="Most sixes"
        description="The biggest hitters of the season, ranked by sixes. Ties are broken by total runs."
        path="/statistics/most-sixes"
        seasons={data.site.seasons}
        season={data.season}
        teams={data.site.bundle.teams}
        teamId={data.selectedTeam?.id}
      >
        <LeaderboardCard title="Most sixes" description="Top 25 batters by sixes.">
          <BattingTable rows={data.batting} playerById={data.playerById} teamById={data.teamById} metric="sixes" limit={25} />
        </LeaderboardCard>
      </StatisticsPageShell>
    </>
  );
}
