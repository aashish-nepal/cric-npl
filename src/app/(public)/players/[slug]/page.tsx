import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayerProfile } from "@/services/cricket";
import { loadSite } from "@/services/cricket";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PlayerAvatar, TeamLogo } from "@/components/cricket/identity";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { formatKathmanduDate, formatNumber } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPlayerProfile(slug);
  if (!data) return { title: "Player not found" };
  return {
    title: `${data.player.fullName} — profile and statistics`,
    description: `${data.player.fullName}, ${data.roleLabel}${data.currentTeam ? ` for ${data.currentTeam.name}` : ""}. Career statistics, recent innings and bowling figures.`,
    alternates: { canonical: `/players/${slug}` },
  };
}

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, site] = await Promise.all([getPlayerProfile(slug), loadSite()]);
  if (!data) notFound();
  const { player, teams, currentTeam, career, recentBatting, recentBowling, roleLabel } = data;
  const batting = site.analytics.batting.find((row) => row.playerId === player.id) ?? null;
  const bowling = site.analytics.bowling.find((row) => row.playerId === player.id) ?? null;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Players", path: "/players" },
          { name: player.fullName, path: `/players/${player.slug}` },
        ])}
      />
      <section className="border-b border-border bg-surface">
        <div className="container-page py-4">
          <Breadcrumbs items={[{ label: "Players", href: "/players" }, { label: player.fullName }]} />
        </div>
        <div className="container-page flex flex-wrap items-center gap-5 pb-6 sm:pb-8">
          <PlayerAvatar player={player} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{player.fullName}</h1>
              <Badge variant="default">{roleLabel}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {player.battingStyle} · {player.bowlingStyle === "None" ? "Does not bowl" : player.bowlingStyle} · {player.nationality}
            </p>
            {currentTeam ? (
              <Link href={`/teams/${currentTeam.slug}`} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <TeamLogo team={currentTeam} size="xs" />
                {currentTeam.name}
              </Link>
            ) : null}
          </div>
          {batting ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Runs" value={batting.runs} />
              <Metric label="Average" value={formatNumber(batting.average, 2)} />
              <Metric label="Strike rate" value={formatNumber(batting.strikeRate, 1)} />
            </div>
          ) : null}
        </div>
      </section>

      <div className="container-page grid gap-6 py-6 sm:py-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          {player.biography ? (
            <section>
              <h2 className="mb-2 text-lg font-bold tracking-tight">Profile</h2>
              <p className="prose-editorial max-w-3xl text-sm">{player.biography}</p>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <h2 className="border-b border-border px-4 py-3 text-sm font-bold tracking-tight">Career by season</h2>
            {career.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted-foreground">No career records yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Season</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-center">M</TableHead>
                    <TableHead className="text-center">Runs</TableHead>
                    <TableHead className="text-center">HS</TableHead>
                    <TableHead className="text-center">Wkts</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Bowl econ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {career.map((row) => (
                    <TableRow key={row.seasonId}>
                      <TableCell className="font-medium">{row.seasonName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.teamName}</TableCell>
                      <TableCell className="text-center tabular">{row.matches}</TableCell>
                      <TableCell className="text-center font-semibold tabular">{row.runs}</TableCell>
                      <TableCell className="text-center tabular">{row.highScore}</TableCell>
                      <TableCell className="text-center tabular">{row.wickets}</TableCell>
                      <TableCell className="hidden text-right tabular text-xs sm:table-cell">
                        {row.bowlingBalls > 0 ? formatNumber((row.runsConceded * 6) / row.bowlingBalls, 2) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="overflow-hidden rounded-lg border border-border bg-card">
              <h2 className="border-b border-border px-4 py-3 text-sm font-bold tracking-tight">Recent batting</h2>
              {recentBatting.length === 0 ? (
                <p className="px-4 py-5 text-sm text-muted-foreground">No innings recorded.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {recentBatting.map((row) => (
                    <li key={row.matchId} className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs">
                      <span className="min-w-0">
                        <Link href={`/matches/${row.matchSlug}`} className="block truncate font-medium hover:text-primary">
                          vs {row.opponent}
                        </Link>
                        <span className="text-muted-foreground">{formatKathmanduDate(row.date)}</span>
                      </span>
                      <span className="shrink-0 tabular font-semibold">
                        {row.runs} ({row.balls}){row.out ? "" : "*"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="overflow-hidden rounded-lg border border-border bg-card">
              <h2 className="border-b border-border px-4 py-3 text-sm font-bold tracking-tight">Recent bowling</h2>
              {recentBowling.length === 0 ? (
                <p className="px-4 py-5 text-sm text-muted-foreground">No bowling spells recorded.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {recentBowling.map((row) => (
                    <li key={row.matchId} className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs">
                      <span className="min-w-0">
                        <Link href={`/matches/${row.matchSlug}`} className="block truncate font-medium hover:text-primary">
                          vs {row.opponent}
                        </Link>
                        <span className="text-muted-foreground">{formatKathmanduDate(row.date)}</span>
                      </span>
                      <span className="shrink-0 tabular font-semibold">
                        {row.wickets}/{row.runs} ({row.overs})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <aside className="space-y-4">
          {batting ? (
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-bold tracking-tight">Batting · {site.activeSeason.name}</h2>
              <dl className="mt-3 space-y-2 text-xs">
                <Row label="Innings" value={batting.innings} />
                <Row label="Runs" value={batting.runs} />
                <Row label="Balls" value={batting.balls} />
                <Row label="Average" value={formatNumber(batting.average, 2)} />
                <Row label="Strike rate" value={formatNumber(batting.strikeRate, 1)} />
                <Row label="Fours" value={batting.fours} />
                <Row label="Sixes" value={batting.sixes} />
                <Row label="High score" value={`${batting.highScore}${batting.highScoreNotOut ? "*" : ""}`} />
              </dl>
            </section>
          ) : null}
          {bowling ? (
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-bold tracking-tight">Bowling · {site.activeSeason.name}</h2>
              <dl className="mt-3 space-y-2 text-xs">
                <Row label="Innings" value={bowling.innings} />
                <Row label="Wickets" value={bowling.wickets} />
                <Row label="Economy" value={formatNumber(bowling.economy, 2)} />
                <Row label="Average" value={formatNumber(bowling.average, 2)} />
                <Row label="Strike rate" value={formatNumber(bowling.strikeRate, 1)} />
                <Row label="Best" value={`${bowling.bestWickets}/${bowling.bestRuns}`} />
              </dl>
            </section>
          ) : null}
          {teams.length > 0 ? (
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-bold tracking-tight">Teams</h2>
              <ul className="mt-2 space-y-1.5">
                {teams.map((team) => (
                  <li key={team.id}>
                    <Link href={`/teams/${team.slug}`} className="flex items-center gap-2 text-xs font-medium hover:text-primary">
                      <TeamLogo team={team} size="xs" />
                      {team.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <Link href={`/compare?a=${player.slug}`} className="inline-flex text-xs font-semibold text-primary hover:underline">
            Compare this player →
          </Link>
        </aside>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular">{value}</dd>
    </div>
  );
}
