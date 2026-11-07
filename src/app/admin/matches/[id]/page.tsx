import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin, Radio, Settings2, Trophy } from "lucide-react";
import { getAdminMatch } from "@/services/admin";
import { requirePermission } from "@/lib/auth/session";
import { updateMatchAction } from "@/app/actions/admin";
import { AdminPageHeading, FlashMessages } from "@/components/admin/page-heading";
import { SubmitButton } from "@/components/admin/submit-button";
import { ScoringConsole } from "@/components/admin/scoring-console";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Label, Select, Textarea } from "@/components/ui/form";
import { LiveBadge } from "@/components/cricket/badges";
import { TeamLogo } from "@/components/cricket/identity";
import { buttonVariants } from "@/components/ui/button";
import { formatKathmanduDateTime } from "@/lib/utils";

export default async function AdminMatchConsolePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  await requirePermission("scores.manage");
  const [{ id }, { message, error }] = await Promise.all([params, searchParams]);
  const data = await getAdminMatch(id);
  if (!data) notFound();

  const { computed, current, season, site } = data;
  const match = computed.match;
  const bundle = site.bundles.find((row) => row.season.id === season.id) ?? site.bundle;
  const firstInnings = computed.innings[0] ?? null;
  const secondInnings = computed.innings[1] ?? null;
  const canStartSecond =
    match.status === "live" && Boolean(firstInnings?.innings.closed) && !secondInnings;
  const currentScore = current ? `${current.runs}/${current.wickets} (${current.overs} ov)` : null;
  const dismissed = new Set(current?.batting.filter((entry) => entry.out).map((entry) => entry.playerId) ?? []);
  const availableBatters = data.battingPlayers.filter(
    (player) => !dismissed.has(player.id) || player.id === data.strikerId || player.id === data.nonStrikerId,
  );

  return (
    <>
      <AdminPageHeading
        title={`${computed.teamA.shortName} vs ${computed.teamB.shortName}`}
        description={`${season.name} · Match ${match.matchNumber} · ${formatKathmanduDateTime(match.scheduledAt)} NPT`}
        backHref="/admin/matches"
        backLabel="Matches"
        actions={
          <>
            <Link href={`/matches/${match.slug}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Public page
            </Link>
          </>
        }
      />
      <FlashMessages message={message} error={error} />

      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          {match.status === "live" ? <LiveBadge /> : <Badge variant="secondary">{match.status.replaceAll("_", " ")}</Badge>}
          <Badge variant="outline">Manual scoring</Badge>
          {match.dataSource === "demo" ? <Badge variant="accent">Demo data</Badge> : null}
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {computed.venue.name}
          </span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="flex items-center gap-2">
            <TeamLogo team={computed.teamA} size="md" />
            <div>
              <p className="text-sm font-bold">{computed.teamA.name}</p>
              <p className="tabular text-xs text-muted-foreground">
                {computed.innings.find((row) => row.innings.battingTeamId === computed.teamA.id)
                  ? (() => {
                      const row = computed.innings.find((inningsRow) => inningsRow.innings.battingTeamId === computed.teamA.id);
                      return row ? `${row.runs}/${row.wickets} (${row.overs})` : "Yet to bat";
                    })()
                  : "Yet to bat"}
              </p>
            </div>
          </div>
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground sm:block">vs</span>
          <div className="flex items-center gap-2 sm:justify-end sm:text-right">
            <div className="sm:order-2">
              <TeamLogo team={computed.teamB} size="md" />
            </div>
            <div>
              <p className="text-sm font-bold">{computed.teamB.name}</p>
              <p className="tabular text-xs text-muted-foreground">
                {computed.innings.find((row) => row.innings.battingTeamId === computed.teamB.id)
                  ? (() => {
                      const row = computed.innings.find((inningsRow) => inningsRow.innings.battingTeamId === computed.teamB.id);
                      return row ? `${row.runs}/${row.wickets} (${row.overs})` : "Yet to bat";
                    })()
                  : "Yet to bat"}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs font-medium">
          {match.resultSummary ?? computed.statusText}
        </p>
      </div>

      <ScoringConsole
        matchId={match.id}
        matchStatus={match.status}
        teamA={{ id: computed.teamA.id, name: computed.teamA.name, shortName: computed.teamA.shortName }}
        teamB={{ id: computed.teamB.id, name: computed.teamB.name, shortName: computed.teamB.shortName }}
        battingTeamName={data.battingTeam?.name ?? computed.teamA.name}
        bowlingTeamName={data.bowlingTeam?.name ?? computed.teamB.name}
        batters={availableBatters}
        bowlers={data.bowlingPlayers}
        strikerId={data.strikerId}
        nonStrikerId={data.nonStrikerId}
        currentInningsNumber={current?.innings.inningsNumber ?? null}
        currentScore={currentScore}
        target={computed.target}
        requiredRuns={computed.requiredRuns}
        requiredRunRate={computed.requiredRunRate}
        currentRunRate={computed.currentRunRate}
        recentEvents={data.recentEvents}
        firstInningsClosed={Boolean(firstInnings?.innings.closed)}
        secondInningsExists={Boolean(secondInnings)}
        currentInningsClosed={Boolean(current?.innings.closed)}
        canStartSecond={canStartSecond}
        ballsPerInnings={season.settings.ballsPerInnings}
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex-row items-center gap-2 border-b border-border">
            <Settings2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle>Match setup</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form action={updateMatchAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="matchId" value={match.id} />
              <input type="hidden" name="returnTo" value={`/admin/matches/${match.id}`} />
              <Field>
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue={match.status}>
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                  <option value="abandoned">Abandoned</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="venueId">Venue</Label>
                <Select id="venueId" name="venueId" defaultValue={match.venueId}>
                  {bundle.venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <Label htmlFor="tossWinnerId">Toss winner</Label>
                <Select id="tossWinnerId" name="tossWinnerId" defaultValue={match.tossWinnerId ?? ""}>
                  <option value="">Not decided</option>
                  <option value={computed.teamA.id}>{computed.teamA.name}</option>
                  <option value={computed.teamB.id}>{computed.teamB.name}</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="tossDecision">Toss decision</Label>
                <Select id="tossDecision" name="tossDecision" defaultValue={match.tossDecision ?? ""}>
                  <option value="">Not decided</option>
                  <option value="bat">Bat first</option>
                  <option value="bowl">Bowl first</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="winnerId">Winner</Label>
                <Select id="winnerId" name="winnerId" defaultValue={match.winnerId ?? ""}>
                  <option value="">No result / tie</option>
                  <option value={computed.teamA.id}>{computed.teamA.name}</option>
                  <option value={computed.teamB.id}>{computed.teamB.name}</option>
                </Select>
              </Field>
              <Field className="sm:col-span-2">
                <Label htmlFor="resultSummary">Result summary</Label>
                <Textarea
                  id="resultSummary"
                  name="resultSummary"
                  rows={2}
                  defaultValue={match.resultSummary ?? ""}
                  maxLength={500}
                  className="min-h-16"
                  placeholder="Optional until the match is complete"
                />
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton size="sm" pendingLabel="Updating…">
                  Save match setup
                </SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="rounded-lg border border-border bg-surface p-4 text-[11px] leading-relaxed text-muted-foreground">
          <p className="flex items-center gap-1.5 font-semibold text-foreground">
            <Radio className="h-3.5 w-3.5 text-live" aria-hidden="true" />
            Live scoring rules
          </p>
          <p className="mt-1.5">
            A match must be <strong>live</strong> before deliveries can be recorded. Toss and venue changes are audited. Results
            become visible on the public site immediately after revalidation.
          </p>
          {match.status === "completed" ? (
            <p className="mt-2 flex items-center gap-1.5 font-semibold text-green-700">
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> Result published
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
