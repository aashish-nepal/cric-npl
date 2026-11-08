import type { Metadata } from "next";
import Link from "next/link";
import { getStatisticsData, loadSite } from "@/services/cricket";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LeaderBarChart } from "@/components/statistics/leader-chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/statistics/stat-card";
import { StatisticsSubnav } from "@/components/statistics/leaderboard-tables";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { cn, formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "NPL statistics and leaderboards",
  description:
    "Nepal Premier League batting and bowling leaderboards, team records and season statistics, computed from ball-by-ball data.",
  alternates: { canonical: "/statistics", languages: { en: "/statistics", ne: "/ne/statistics" } },
};

export default async function StatisticsPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const { season: seasonSlug } = await searchParams;
  const [data, site] = await Promise.all([getStatisticsData(seasonSlug), loadSite()]);
  const { analytics, records, teamById, playerById, batting, bowling, teams, season } = data;
  const nameOf = (playerId: string) => playerById.get(playerId)?.fullName ?? "—";
  const slugOf = (playerId: string) => playerById.get(playerId)?.slug ?? "";
  const teamOf = (teamId: string) => teamById.get(teamId)?.shortName ?? "—";
  const topBatting = batting.slice(0, 10).map((row) => ({ name: nameOf(row.playerId).split(" ").slice(-1)[0] ?? "", value: row.runs }));
  const topBowling = bowling.slice(0, 10).map((row) => ({ name: nameOf(row.playerId).split(" ").slice(-1)[0] ?? "", value: row.wickets }));

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Statistics", path: "/statistics" }])} />
      <PageHeader
        eyebrow={season.name}
        title="Statistics"
        description="Batting, bowling and team records for the selected season. Every aggregate is derived from the recorded ball events, not entered by hand."
        actions={
          <Link href="/compare" className="text-xs font-semibold text-primary hover:underline">
            Compare players →
          </Link>
        }
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Statistics" }]} />
      </div>
      <div className="container-page space-y-3 pb-2">
        <StatisticsSubnav current="/statistics" />
        <div className="flex flex-wrap gap-1.5" role="navigation" aria-label="Season filter">
          {site.seasons.map((row) => (
            <Link
              key={row.id}
              href={`/statistics?season=${row.slug}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                row.id === season.id
                  ? "border-primary bg-primary text-white"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
              )}
            >
              {row.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="container-page space-y-10 py-6 sm:py-8">
        <section>
          <h2 className="mb-3 text-lg font-bold tracking-tight">Season records</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {records.leadingRunScorer ? (
              <StatCard
                eyebrow="Leading run scorer"
                title={nameOf(records.leadingRunScorer.playerId)}
                value={`${records.leadingRunScorer.runs} runs`}
                subtitle={`${records.leadingRunScorer.innings} inns · ${teamOf(records.leadingRunScorer.teamId)}`}
                href={`/players/${slugOf(records.leadingRunScorer.playerId)}`}
              />
            ) : null}
            {records.leadingWicketTaker ? (
              <StatCard
                eyebrow="Leading wicket taker"
                title={nameOf(records.leadingWicketTaker.playerId)}
                value={`${records.leadingWicketTaker.wickets} wickets`}
                subtitle={`${records.leadingWicketTaker.innings} inns · ${teamOf(records.leadingWicketTaker.teamId)}`}
                href={`/players/${slugOf(records.leadingWicketTaker.playerId)}`}
              />
            ) : null}
            {records.highestIndividualScore ? (
              <StatCard
                eyebrow="Highest score"
                title={nameOf(records.highestIndividualScore.playerId)}
                value={`${records.highestIndividualScore.highScore}${records.highestIndividualScore.highScoreNotOut ? "*" : ""}`}
                subtitle={`${records.highestIndividualScore.balls} balls · ${teamOf(records.highestIndividualScore.teamId)}`}
                href={`/players/${slugOf(records.highestIndividualScore.playerId)}`}
              />
            ) : null}
            {records.bestBowling ? (
              <StatCard
                eyebrow="Best bowling"
                title={nameOf(records.bestBowling.playerId)}
                value={`${records.bestBowling.bestWickets}/${records.bestBowling.bestRuns}`}
                subtitle={`${teamOf(records.bestBowling.teamId)} · ${records.bestBowling.innings} inns`}
                href={`/players/${slugOf(records.bestBowling.playerId)}`}
              />
            ) : null}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-bold tracking-tight">Top run scorers</h2>
            <LeaderBarChart data={topBatting} valueLabel="Runs" />
          </section>
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-bold tracking-tight">Top wicket takers</h2>
            <LeaderBarChart data={topBowling} color="#b45309" valueLabel="Wickets" />
          </section>
        </div>

        <section id="batting" className="scroll-mt-24">
          <h2 className="mb-3 text-lg font-bold tracking-tight">Batting</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="hidden sm:table-cell">Team</TableHead>
                  <TableHead className="text-center">Inns</TableHead>
                  <TableHead className="text-center">Runs</TableHead>
                  <TableHead className="hidden text-center sm:table-cell">HS</TableHead>
                  <TableHead className="text-center">Avg</TableHead>
                  <TableHead className="text-center">SR</TableHead>
                  <TableHead className="hidden text-center md:table-cell">4s</TableHead>
                  <TableHead className="hidden text-center md:table-cell">6s</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batting.slice(0, 40).map((row) => (
                  <TableRow key={row.playerId}>
                    <TableCell>
                      <Link href={`/players/${slugOf(row.playerId)}`} className="font-medium hover:text-primary">
                        {nameOf(row.playerId)}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{teamOf(row.teamId)}</TableCell>
                    <TableCell className="text-center tabular">{row.innings}</TableCell>
                    <TableCell className="text-center font-semibold tabular">{row.runs}</TableCell>
                    <TableCell className="hidden text-center tabular sm:table-cell">
                      {row.highScore}
                      {row.highScoreNotOut ? "*" : ""}
                    </TableCell>
                    <TableCell className="text-center tabular">{formatNumber(row.average, 2)}</TableCell>
                    <TableCell className="text-center tabular">{formatNumber(row.strikeRate, 1)}</TableCell>
                    <TableCell className="hidden text-center tabular md:table-cell">{row.fours}</TableCell>
                    <TableCell className="hidden text-center tabular md:table-cell">{row.sixes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section id="bowling" className="scroll-mt-24">
          <h2 className="mb-3 text-lg font-bold tracking-tight">Bowling</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="hidden sm:table-cell">Team</TableHead>
                  <TableHead className="text-center">Inns</TableHead>
                  <TableHead className="text-center">Wkts</TableHead>
                  <TableHead className="text-center">Econ</TableHead>
                  <TableHead className="hidden text-center sm:table-cell">Avg</TableHead>
                  <TableHead className="hidden text-center sm:table-cell">SR</TableHead>
                  <TableHead className="hidden text-center md:table-cell">Best</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bowling.slice(0, 40).map((row) => (
                  <TableRow key={row.playerId}>
                    <TableCell>
                      <Link href={`/players/${slugOf(row.playerId)}`} className="font-medium hover:text-primary">
                        {nameOf(row.playerId)}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{teamOf(row.teamId)}</TableCell>
                    <TableCell className="text-center tabular">{row.innings}</TableCell>
                    <TableCell className="text-center font-semibold tabular">{row.wickets}</TableCell>
                    <TableCell className="text-center tabular">{formatNumber(row.economy, 2)}</TableCell>
                    <TableCell className="hidden text-center tabular sm:table-cell">{formatNumber(row.average, 2)}</TableCell>
                    <TableCell className="hidden text-center tabular sm:table-cell">{formatNumber(row.strikeRate, 1)}</TableCell>
                    <TableCell className="hidden text-center tabular md:table-cell">
                      {row.bestWickets}/{row.bestRuns}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section id="teams" className="scroll-mt-24">
          <h2 className="mb-3 text-lg font-bold tracking-tight">Team statistics</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">L</TableHead>
                  <TableHead className="hidden text-center sm:table-cell">NR</TableHead>
                  <TableHead className="hidden text-center sm:table-cell">Highest</TableHead>
                  <TableHead className="hidden text-center md:table-cell">Lowest</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Best chase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...teams]
                  .sort((a, b) => b.won - a.won || b.played - a.played)
                  .map((row) => {
                    const team = teamById.get(row.teamId);
                    return (
                      <TableRow key={row.teamId}>
                        <TableCell>
                          {team ? (
                            <Link href={`/teams/${team.slug}`} className="font-medium hover:text-primary">
                              {team.name}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-center tabular">{row.played}</TableCell>
                        <TableCell className="text-center tabular">{row.won}</TableCell>
                        <TableCell className="text-center tabular">{row.lost}</TableCell>
                        <TableCell className="hidden text-center tabular sm:table-cell">{row.noResult}</TableCell>
                        <TableCell className="hidden text-center tabular sm:table-cell">{row.highestScore || "—"}</TableCell>
                        <TableCell className="hidden text-center tabular md:table-cell">{row.lowestScore || "—"}</TableCell>
                        <TableCell className="hidden text-right tabular md:table-cell">{row.highestSuccessfulChase ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
          <p className="font-semibold text-foreground">About these statistics</p>
          <p className="mt-1.5">
            Batting average is runs divided by dismissals; strike rate is runs per 100 balls; economy is runs conceded per
            over. Minimum-innings filters are applied to the average, strike-rate and economy record cards. Figures are
            computed for {analytics.matches.length} matches in {season.name}.
          </p>
        </section>
      </div>
    </>
  );
}
