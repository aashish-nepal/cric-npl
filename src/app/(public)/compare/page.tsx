import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSite } from "@/services/cricket";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PlayerAvatar, TeamLogo } from "@/components/cricket/identity";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";
import { ROLE_LABELS } from "@/types/content";
import { formatNumber } from "@/lib/utils";
import type { Player } from "@/types/cricket";

export const metadata: Metadata = {
  title: "Compare NPL players",
  description: "Compare two Nepal Premier League players side by side: runs, average, strike rate, wickets, economy and more.",
  alternates: { canonical: "/compare", languages: { en: "/compare", ne: "/ne/statistics" } },
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; season?: string }>;
}) {
  const { a, b, season: seasonSlug } = await searchParams;
  const site = await loadSite();
  const season = seasonSlug ? site.seasons.find((row) => row.slug === seasonSlug) : site.activeSeason;
  const analytics = season ? site.analyticsBySeason.get(season.id) : undefined;
  const bundle = season ? site.bundles.find((row) => row.season.id === season.id) : undefined;
  if (!season || !analytics || !bundle) notFound();
  const squadByPlayer = new Map(bundle.squads.map((row) => [row.playerId, row]));
  const teamById = analytics.teamById;
  const battingByPlayer = new Map(analytics.batting.map((row) => [row.playerId, row]));
  const bowlingByPlayer = new Map(analytics.bowling.map((row) => [row.playerId, row]));
  const players = bundle.players.filter((player) => squadByPlayer.has(player.id));
  const playerA = players.find((player) => player.slug === a) ?? null;
  const playerB = players.find((player) => player.slug === b) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Analysis"
        title="Compare players"
        description="Put two players side by side using the same ball-by-ball dataset that powers the scorecards and leaderboards."
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Compare players" }]} />
      </div>
      <div className="container-page py-6 sm:py-8">
        <form action="/compare" method="get" className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <PlayerSelect name="a" label="Player A" players={players} defaultValue={a ?? ""} />
          <PlayerSelect name="b" label="Player B" players={players} defaultValue={b ?? ""} />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Season</span>
            <select
              name="season"
              defaultValue={season.slug}
              className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {site.seasons.map((row) => (
                <option key={row.id} value={row.slug}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark">
            Compare
          </button>
        </form>

        {!playerA || !playerB ? (
          <div className="mt-6">
            <EmptyState
              title="Choose two players"
              description="Select a player in each column to see a side-by-side statistical comparison."
            />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {[playerA, playerB].map((player) => {
                const squad = squadByPlayer.get(player.id);
                const team = squad ? (teamById.get(squad.teamId) ?? null) : null;
                return (
                  <div key={player.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                    <PlayerAvatar player={player} size="md" />
                    <div className="min-w-0">
                      <Link href={`/players/${player.slug}`} className="truncate text-sm font-bold hover:text-primary">
                        {player.fullName}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {team ? <TeamLogo team={team} size="xs" className="h-4 w-4 text-[7px]" /> : null}
                        {team?.shortName ?? "NPL"} · {ROLE_LABELS[player.playingRole]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Metric</TableHead>
                    <TableHead className="text-right">{playerA.fullName.split(" ").slice(-1)[0]}</TableHead>
                    <TableHead className="text-right">{playerB.fullName.split(" ").slice(-1)[0]}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <CompareRow
                    label="Matches"
                    a={analytics.matches.filter((match) => match.innings.some((innings) => innings.batting.some((row) => row.playerId === playerA.id) || innings.bowling.some((row) => row.playerId === playerA.id))).length}
                    b={analytics.matches.filter((match) => match.innings.some((innings) => innings.batting.some((row) => row.playerId === playerB.id) || innings.bowling.some((row) => row.playerId === playerB.id))).length}
                  />
                  <CompareRow label="Innings batted" a={battingByPlayer.get(playerA.id)?.innings ?? 0} b={battingByPlayer.get(playerB.id)?.innings ?? 0} />
                  <CompareRow label="Runs" a={battingByPlayer.get(playerA.id)?.runs ?? 0} b={battingByPlayer.get(playerB.id)?.runs ?? 0} highlight />
                  <CompareRow label="Balls faced" a={battingByPlayer.get(playerA.id)?.balls ?? 0} b={battingByPlayer.get(playerB.id)?.balls ?? 0} />
                  <CompareRow label="High score" a={`${battingByPlayer.get(playerA.id)?.highScore ?? 0}${battingByPlayer.get(playerA.id)?.highScoreNotOut ? "*" : ""}`} b={`${battingByPlayer.get(playerB.id)?.highScore ?? 0}${battingByPlayer.get(playerB.id)?.highScoreNotOut ? "*" : ""}`} />
                  <CompareRow label="Average" a={formatNumber(battingByPlayer.get(playerA.id)?.average ?? 0, 2)} b={formatNumber(battingByPlayer.get(playerB.id)?.average ?? 0, 2)} />
                  <CompareRow label="Strike rate" a={formatNumber(battingByPlayer.get(playerA.id)?.strikeRate ?? 0, 1)} b={formatNumber(battingByPlayer.get(playerB.id)?.strikeRate ?? 0, 1)} />
                  <CompareRow label="Fours" a={battingByPlayer.get(playerA.id)?.fours ?? 0} b={battingByPlayer.get(playerB.id)?.fours ?? 0} />
                  <CompareRow label="Sixes" a={battingByPlayer.get(playerA.id)?.sixes ?? 0} b={battingByPlayer.get(playerB.id)?.sixes ?? 0} />
                  <CompareRow label="Wickets" a={bowlingByPlayer.get(playerA.id)?.wickets ?? 0} b={bowlingByPlayer.get(playerB.id)?.wickets ?? 0} highlight />
                  <CompareRow label="Economy" a={formatNumber(bowlingByPlayer.get(playerA.id)?.economy ?? 0, 2)} b={formatNumber(bowlingByPlayer.get(playerB.id)?.economy ?? 0, 2)} />
                  <CompareRow label="Bowling average" a={formatNumber(bowlingByPlayer.get(playerA.id)?.average ?? 0, 2)} b={formatNumber(bowlingByPlayer.get(playerB.id)?.average ?? 0, 2)} />
                  <CompareRow label="Best bowling" a={`${bowlingByPlayer.get(playerA.id)?.bestWickets ?? 0}/${bowlingByPlayer.get(playerA.id)?.bestRuns ?? 0}`} b={`${bowlingByPlayer.get(playerB.id)?.bestWickets ?? 0}/${bowlingByPlayer.get(playerB.id)?.bestRuns ?? 0}`} />
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              All figures are for {season.name} and are computed from recorded ball events. Small samples can
              be misleading; check innings and balls alongside the headline numbers.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function PlayerSelect({
  name,
  label,
  players,
  defaultValue,
}: {
  name: string;
  label: string;
  players: Player[];
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        required
        className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Select a player</option>
        {players.map((player) => (
          <option key={player.id} value={player.slug}>
            {player.fullName}
          </option>
        ))}
      </select>
    </label>
  );
}

function CompareRow({ label, a, b, highlight = false }: { label: string; a: string | number; b: string | number; highlight?: boolean }) {
  return (
    <TableRow className={highlight ? "bg-primary/[0.03]" : undefined}>
      <TableCell className="text-xs font-medium text-muted-foreground">{label}</TableCell>
      <TableCell className="text-right font-semibold tabular">{a}</TableCell>
      <TableCell className="text-right font-semibold tabular">{b}</TableCell>
    </TableRow>
  );
}
