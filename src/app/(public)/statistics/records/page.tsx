import type { Metadata } from "next";
import Link from "next/link";
import { loadStatisticsBoard } from "@/services/statistics";
import { StatisticsPageShell, LeaderboardCard } from "@/components/statistics/page-shell";
import { TeamRecordsTable } from "@/components/statistics/leaderboard-tables";
import { StandingsTable } from "@/components/cricket/standings-table";
import { StatCard } from "@/components/statistics/stat-card";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "NPL season records",
  description:
    "Nepal Premier League season records: highest team total, best individual score, best bowling figures, best average, best economy and team records.",
  alternates: { canonical: "/statistics/records", languages: { en: "/statistics/records", ne: "/ne/statistics" } },
};

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; team?: string }>;
}) {
  const { season: seasonSlug, team: teamId } = await searchParams;
  const data = await loadStatisticsBoard(seasonSlug, teamId);
  const { records } = data;
  const playerName = (playerId: string | undefined) => (playerId ? (data.playerById.get(playerId)?.fullName ?? "—") : "—");
  const teamName = (id: string | undefined) => (id ? (data.teamById.get(id)?.shortName ?? "—") : "—");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Statistics", path: "/statistics" },
          { name: "Records", path: "/statistics/records" },
        ])}
      />
      <StatisticsPageShell
        title="Season records"
        description="Records are computed from verified ball events, not maintained by hand. Season records stay season-wide; the team filter applies to the team records and standings tables below."
        path="/statistics/records"
        seasons={data.site.seasons}
        season={data.season}
        teams={data.site.bundle.teams}
        teamId={data.selectedTeam?.id}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            eyebrow="Most runs"
            title={playerName(records.leadingRunScorer?.playerId)}
            value={records.leadingRunScorer ? `${records.leadingRunScorer.runs} runs` : "—"}
            subtitle={records.leadingRunScorer ? `${teamName(records.leadingRunScorer.teamId)} · ${records.leadingRunScorer.innings} inns` : undefined}
            href="/statistics/most-runs"
          />
          <StatCard
            eyebrow="Most wickets"
            title={playerName(records.leadingWicketTaker?.playerId)}
            value={records.leadingWicketTaker ? `${records.leadingWicketTaker.wickets} wickets` : "—"}
            subtitle={records.leadingWicketTaker ? `${teamName(records.leadingWicketTaker.teamId)} · econ ${records.leadingWicketTaker.economy.toFixed(2)}` : undefined}
            href="/statistics/most-wickets"
          />
          <StatCard
            eyebrow="Highest individual score"
            title={playerName(records.highestIndividualScore?.playerId)}
            value={records.highestIndividualScore ? `${records.highestIndividualScore.highScore}${records.highestIndividualScore.highScoreNotOut ? "*" : ""}` : "—"}
            subtitle={records.highestIndividualScore ? teamName(records.highestIndividualScore.teamId) : undefined}
            href="/statistics/batting"
          />
          <StatCard
            eyebrow="Best bowling"
            title={playerName(records.bestBowling?.playerId)}
            value={records.bestBowling ? `${records.bestBowling.bestWickets}/${records.bestBowling.bestRuns}` : "—"}
            subtitle={records.bestBowling ? teamName(records.bestBowling.teamId) : undefined}
            href="/statistics/bowling"
          />
          <StatCard
            eyebrow="Most sixes"
            title={playerName(records.mostSixes?.playerId)}
            value={records.mostSixes ? `${records.mostSixes.sixes} sixes` : "—"}
            subtitle={records.mostSixes ? teamName(records.mostSixes.teamId) : undefined}
            href="/statistics/most-sixes"
          />
          <StatCard
            eyebrow="Highest team total"
            title={teamName(records.highestTeamTotal?.teamId)}
            value={records.highestTeamTotal ? `${records.highestTeamTotal.runs}/${records.highestTeamTotal.wickets}` : "—"}
            subtitle={records.highestTeamTotal ? `vs ${teamName(records.highestTeamTotal.opponentId)} · ${records.highestTeamTotal.overs} ov` : undefined}
            href="/statistics/records"
          />
        </div>

        <LeaderboardCard title="Team records" description="Highest and lowest totals, best chases and biggest victories.">
          <TeamRecordsTable rows={data.teams} teamById={data.teamById} />
        </LeaderboardCard>

        <LeaderboardCard
          title="Standings"
          description={
            data.selectedTeam ? `Filtered to ${data.selectedTeam.name}.` : "The same derived table used across the site."
          }
        >
          <StandingsTable standings={data.standings} teamById={data.teamById} />
        </LeaderboardCard>

        <p className="text-xs text-muted-foreground">
          Looking for a player?{" "}
          <Link href="/players" className="font-semibold text-primary hover:underline">
            Browse all players
          </Link>{" "}
          or{" "}
          <Link href="/compare" className="font-semibold text-primary hover:underline">
            compare two players
          </Link>
          .
        </p>
      </StatisticsPageShell>
    </>
  );
}
