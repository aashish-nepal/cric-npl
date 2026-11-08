import Link from "next/link";
import { CalendarDays, Database, MapPin, Radio } from "lucide-react";
import type { MatchCentreData } from "@/services/cricket";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { TeamLogo } from "@/components/cricket/identity";
import { LiveBadge } from "@/components/cricket/badges";
import { ScorecardBlock } from "./scorecard";
import { CommentaryList } from "./commentary";
import { FallOfWickets, PartnershipsTable, PlayingXILists } from "./partnerships";
import { LiveMatchUpdates } from "./live-match-updates";
import { JsonLd } from "@/components/seo/json-ld";
import { sportsEventJsonLd } from "@/lib/seo";
import { cn, formatKathmanduDateTime, formatNumber } from "@/lib/utils";

function InningsSummary({ data }: { data: MatchCentreData }) {
  const { computed } = data;
  if (computed.innings.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        This match has not started. The scorecard will populate once the first ball is recorded.
      </p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {computed.innings.map((innings) => {
        const team = innings.innings.battingTeamId === computed.teamA.id ? computed.teamA : computed.teamB;
        const current = computed.currentInnings?.innings.id === innings.innings.id && computed.match.status === "live";
        return (
          <div key={innings.innings.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <TeamLogo team={team} size="sm" />
              <p className="text-sm font-semibold">{team.name}</p>
              {current ? <LiveBadge label="BATTING" /> : null}
            </div>
            <p className="mt-2 tabular text-2xl font-extrabold tracking-tight">
              {innings.runs}/{innings.wickets}
              <span className="ml-2 text-xs font-medium text-muted-foreground">({innings.overs} ov)</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              RR {formatNumber(innings.runRate)} · Extras {innings.extras.total} · {innings.batting.length} batters used
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function MatchCentre({ data }: { data: MatchCentreData }) {
  const { computed, season } = data;
  const match = computed.match;
  const live = match.status === "live";
  const statusLabel =
    match.status === "live"
      ? "Live"
      : match.status === "completed"
        ? "Completed"
        : match.status === "abandoned"
          ? "Abandoned"
          : match.status === "cancelled"
            ? "Cancelled"
            : "Scheduled";

  const event = sportsEventJsonLd({
    name: `${computed.teamA.name} vs ${computed.teamB.name} — ${season.name}`,
    startDate: match.scheduledAt,
    url: `/matches/${match.slug}`,
    venueName: computed.venue.name,
    city: computed.venue.city,
    homeName: computed.teamA.name,
    awayName: computed.teamB.name,
    status: match.status,
  });

  return (
    <>
      <JsonLd data={event} />
      <div className="border-b border-border bg-surface">
        <div className="container-page py-4">
          <Breadcrumbs
            items={[
              { label: "Matches", href: "/matches" },
              { label: `${computed.teamA.shortName} vs ${computed.teamB.shortName}` },
            ]}
          />
        </div>
      </div>

      <header className="border-b border-border bg-surface">
        <div className="container-page py-6 sm:py-8">
          <div className="flex flex-wrap items-center gap-2">
            {live ? <LiveBadge /> : <Badge variant="secondary">{statusLabel}</Badge>}
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {season.name} · Match {match.matchNumber}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Database className="h-3 w-3" aria-hidden="true" />
              {match.dataSource === "demo" ? "Demo data" : match.dataSource === "provider" ? "Provider data" : "Manual scoring"}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <TeamSide team={computed.teamA} score={scoreFor(computed, computed.teamA.id)} />
            <span className="hidden text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground sm:block">vs</span>
            <TeamSide team={computed.teamB} score={scoreFor(computed, computed.teamB.id)} align="right" />
          </div>

          <div className="mt-4 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              {match.resultSummary ?? computed.statusText}
            </p>
            {live && computed.requiredRuns !== null && computed.requiredRunRate !== null ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {computed.currentInnings
                  ? `${computed.teamA.id === computed.currentInnings.innings.battingTeamId ? computed.teamA.shortName : computed.teamB.shortName} need ${computed.requiredRuns} runs from ${remainingBalls(computed)} balls · RRR ${formatNumber(computed.requiredRunRate)}`
                  : null}
              </p>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              <Link href={`/venues/${computed.venue.slug}`} className="hover:text-primary">
                {computed.venue.name}
              </Link>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {formatKathmanduDateTime(match.scheduledAt)} NPT
            </span>
            {match.tossWinnerId ? (
              <span>
                Toss: {match.tossWinnerId === computed.teamA.id ? computed.teamA.name : computed.teamB.name} chose to{" "}
                {match.tossDecision}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5" aria-hidden="true" />
              Updated {formatKathmanduDateTime(match.lastUpdated)} NPT
            </span>
            {live ? <LiveMatchUpdates matchId={match.id} live={live} /> : null}
          </div>
        </div>
      </header>

      <div className="container-page grid gap-6 py-6 lg:grid-cols-[1fr_300px] lg:py-8">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="mb-3 text-lg font-bold tracking-tight">
              Innings summary
            </h2>
            <InningsSummary data={data} />
          </section>

          {computed.innings.map((innings) => {
            const team = innings.innings.battingTeamId === computed.teamA.id ? computed.teamA : computed.teamB;
            return (
              <section key={innings.innings.id} aria-label={`${team.name} innings scorecard`} className="space-y-4">
                <h2 className="text-lg font-bold tracking-tight">Scorecard</h2>
                <ScorecardBlock innings={innings} team={team} playerById={data.playerById} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <p className="border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Fall of wickets
                    </p>
                    <FallOfWickets innings={innings} playerById={data.playerById} />
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <p className="border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Partnerships
                    </p>
                    <PartnershipsTable innings={innings} playerById={data.playerById} />
                  </div>
                </div>
              </section>
            );
          })}

          <section aria-labelledby="commentary-heading" className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h2 id="commentary-heading" className="text-sm font-bold tracking-tight">
                Ball-by-ball commentary
              </h2>
              {live ? <span className="text-[10px] font-semibold uppercase tracking-wider text-live">Live updates</span> : null}
            </div>
            <CommentaryList items={data.commentary} />
          </section>

          {data.playingXI.length > 0 ? (
            <section aria-labelledby="xi-heading" className="overflow-hidden rounded-lg border border-border bg-card">
              <h2 id="xi-heading" className="border-b border-border px-4 py-3 text-sm font-bold tracking-tight">
                Playing XI
              </h2>
              <PlayingXILists
                entries={data.playingXI}
                teamA={computed.teamA}
                teamB={computed.teamB}
                playerById={data.playerById}
              />
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-bold tracking-tight">Head to head</h2>
            {data.h2h.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No completed meetings in this dataset.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {data.h2h.map(({ match: previous, result }) => (
                  <li key={previous.match.id} className="py-2.5">
                    <Link href={`/matches/${previous.match.slug}`} className="text-xs font-medium hover:text-primary">
                      {result}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {formatKathmanduDateTime(previous.match.scheduledAt)} NPT
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-bold tracking-tight">League position</h2>
            <div className="mt-2 space-y-2">
              {[data.standingsRowA, data.standingsRowB].map((row, index) => {
                const team = index === 0 ? computed.teamA : computed.teamB;
                return row ? (
                  <div key={team.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">{team.shortName}</span>
                    <span className="tabular text-muted-foreground">
                      {row.position} · {row.points} pts · {row.nrr > 0 ? "+" : ""}
                      {row.nrr.toFixed(3)}
                    </span>
                  </div>
                ) : null;
              })}
            </div>
            <Link href="/points-table" className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline">
              Full points table →
            </Link>
          </section>

          <section className="rounded-lg border border-border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
            <p className="font-semibold text-foreground">About this data</p>
            <p className="mt-1">
              {match.dataSource === "demo"
                ? "This match is generated from the platform's deterministic demo dataset. It is not an official NPL record."
                : match.dataSource === "provider"
                  ? "This match was ingested from a licensed data provider and is attributed on this page."
                  : "This match was recorded manually by an authorised scorer."}
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}

function scoreFor(computed: MatchCentreData["computed"], teamId: string): string | null {
  const innings = computed.innings.find((row) => row.innings.battingTeamId === teamId);
  if (!innings) return null;
  return `${innings.runs}/${innings.wickets} (${innings.overs})`;
}

function remainingBalls(computed: MatchCentreData["computed"]): number {
  const current = computed.currentInnings;
  if (!current) return 0;
  return Math.max(0, 120 - current.legalBalls);
}

function TeamSide({
  team,
  score,
  align = "left",
}: {
  team: MatchCentreData["computed"]["teamA"];
  score: string | null;
  align?: "left" | "right";
}) {
  return (
    <div className={cn("flex items-center gap-3", align === "right" && "sm:flex-row-reverse sm:text-right")}>
      <TeamLogo team={team} size="xl" />
      <div className="min-w-0">
        <p className="truncate text-lg font-bold tracking-tight">{team.name}</p>
        <p className="text-xs text-muted-foreground">{team.shortName}</p>
        {score ? <p className="mt-1 tabular text-xl font-extrabold">{score}</p> : <p className="mt-1 text-xs text-muted-foreground">Yet to bat</p>}
      </div>
    </div>
  );
}
