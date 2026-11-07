import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Trophy } from "lucide-react";
import { getTeamProfile } from "@/services/cricket";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TeamLogo, PlayerAvatar } from "@/components/cricket/identity";
import { MatchCard } from "@/components/match/match-card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { ROLE_LABELS } from "@/types/content";
import { formatNumber } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTeamProfile(slug);
  if (!data) return { title: "Team not found" };
  return {
    title: `${data.team.name} — squad, form and statistics`,
    description: data.team.description,
    alternates: { canonical: `/teams/${slug}` },
  };
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getTeamProfile(slug);
  if (!data) notFound();
  const { team, squad, standingsRow, recent, upcoming, aggregate, history, headToHead, topRunScorer, topWicketTaker } = data;
  const playerById = data.site.analytics.playerById;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Teams", path: "/teams" }, { name: team.name, path: `/teams/${team.slug}` }])} />
      <section className="border-b border-border bg-surface">
        <div className="container-page py-4">
          <Breadcrumbs items={[{ label: "Teams", href: "/teams" }, { label: team.name }]} />
        </div>
        <div className="container-page pb-6 sm:pb-8">
          <div className="flex flex-wrap items-start gap-4">
            <TeamLogo team={team} size="xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{team.name}</h1>
                {standingsRow ? <Badge variant="default">#{standingsRow.position} · {standingsRow.points} pts</Badge> : null}
              </div>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {team.homeCity} · {data.site.activeSeason.name}
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{team.description}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Played" value={standingsRow?.played ?? 0} />
            <Metric label="Won" value={standingsRow?.won ?? 0} />
            <Metric label="Points" value={standingsRow?.points ?? 0} />
            <Metric label="NRR" value={standingsRow ? `${standingsRow.nrr > 0 ? "+" : ""}${standingsRow.nrr.toFixed(3)}` : "—"} />
          </div>
        </div>
      </section>

      <div className="container-page grid gap-6 py-6 sm:py-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          <section>
            <div className="mb-3 flex items-end justify-between gap-2">
              <h2 className="text-lg font-bold tracking-tight">Squad</h2>
              <span className="text-xs text-muted-foreground">{squad.length} players</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden sm:table-cell">Batting</TableHead>
                    <TableHead className="hidden md:table-cell">Bowling</TableHead>
                    <TableHead className="text-right">No.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {squad.map(({ player, captain, viceCaptain, jerseyNumber }) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <Link href={`/players/${player.slug}`} className="flex items-center gap-2 font-medium hover:text-primary">
                          <PlayerAvatar player={player} size="xs" />
                          <span>
                            {player.fullName}
                            {captain ? <span className="ml-1.5 text-[10px] font-bold uppercase text-primary">C</span> : null}
                            {viceCaptain ? <span className="ml-1 text-[10px] font-bold uppercase text-muted-foreground">VC</span> : null}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ROLE_LABELS[player.playingRole]}</TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{player.battingStyle}</TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{player.bowlingStyle}</TableCell>
                      <TableCell className="text-right tabular text-muted-foreground">{jerseyNumber ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold tracking-tight">Recent & upcoming</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {recent.slice(0, 2).map((match) => (
                <MatchCard key={match.match.id} match={match} seasonName={data.site.activeSeason.name} />
              ))}
              {upcoming.slice(0, 2).map((match) => (
                <MatchCard key={match.match.id} match={match} seasonName={data.site.activeSeason.name} />
              ))}
            </div>
            {recent.length === 0 && upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matches recorded for this team in the selected season.</p>
            ) : null}
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <h2 className="border-b border-border px-4 py-3 text-sm font-bold tracking-tight">Season history</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Season</TableHead>
                  <TableHead className="text-center">Position</TableHead>
                  <TableHead className="text-center">Played</TableHead>
                  <TableHead className="text-center">Won</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.season.id}>
                    <TableCell>
                      <Link href={`/seasons/${row.season.slug}`} className="font-medium hover:text-primary">
                        {row.season.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center tabular">{row.position ?? "—"}</TableCell>
                    <TableCell className="text-center tabular">{row.played}</TableCell>
                    <TableCell className="text-center tabular">{row.won}</TableCell>
                    <TableCell className="text-right font-semibold tabular">{row.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
              <Trophy className="h-4 w-4 text-accent" aria-hidden="true" />
              Team records
            </h2>
            {aggregate ? (
              <dl className="mt-3 space-y-2 text-xs">
                <Row label="Highest score" value={aggregate.highestScore || "—"} />
                <Row label="Lowest score" value={aggregate.lowestScore || "—"} />
                <Row label="Highest successful chase" value={aggregate.highestSuccessfulChase ?? "—"} />
                <Row label="Biggest win by runs" value={aggregate.biggestWinByRuns ?? "—"} />
                <Row label="Biggest win by wickets" value={aggregate.biggestWinByWickets ?? "—"} />
              </dl>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No aggregate data yet.</p>
            )}
          </section>

          {topRunScorer || topWicketTaker ? (
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-bold tracking-tight">Top performers</h2>
              <div className="mt-3 space-y-3 text-xs">
                {topRunScorer ? (
                  <div>
                    <p className="font-semibold text-muted-foreground">Most runs</p>
                    <Link href={`/players/${playerById.get(topRunScorer.playerId)?.slug ?? ""}`} className="font-bold hover:text-primary">
                      {playerById.get(topRunScorer.playerId)?.fullName ?? "—"}
                    </Link>
                    <p className="text-muted-foreground">
                      {topRunScorer.runs} runs · SR {formatNumber(topRunScorer.strikeRate, 1)}
                    </p>
                  </div>
                ) : null}
                {topWicketTaker ? (
                  <div>
                    <p className="font-semibold text-muted-foreground">Most wickets</p>
                    <Link href={`/players/${playerById.get(topWicketTaker.playerId)?.slug ?? ""}`} className="font-bold hover:text-primary">
                      {playerById.get(topWicketTaker.playerId)?.fullName ?? "—"}
                    </Link>
                    <p className="text-muted-foreground">
                      {topWicketTaker.wickets} wickets · Econ {formatNumber(topWicketTaker.economy, 2)}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-bold tracking-tight">Head to head</h2>
            {headToHead.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No completed meetings yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {headToHead.slice(0, 7).map((row) => (
                  <li key={row.team.id} className="flex items-center justify-between gap-2 py-2 text-xs">
                    <Link href={`/teams/${row.team.slug}`} className="truncate hover:text-primary">
                      {row.team.shortName}
                    </Link>
                    <span className="tabular shrink-0 text-muted-foreground">
                      {row.won}W · {row.lost}L · {row.played}P
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
            <p className="flex items-center gap-1.5 font-semibold text-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {data.site.activeSeason.name}
            </p>
            <p className="mt-1.5">Squad and match data on this build are illustrative demo records.</p>
          </section>
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
