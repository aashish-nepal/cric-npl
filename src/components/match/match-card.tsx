import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { MatchComputed } from "@/types/cricket";
import { TeamLogo } from "@/components/cricket/identity";
import { LiveBadge } from "@/components/cricket/badges";
import { Badge } from "@/components/ui/badge";
import { cn, formatKathmanduDate, formatKathmanduTime } from "@/lib/utils";

function hrefFor(match: MatchComputed): string {
  return match.match.status === "live" ? `/live/${match.match.slug}` : `/matches/${match.match.slug}`;
}

function scoreLine(match: MatchComputed, teamId: string): string | null {
  const innings = match.innings.find((row) => row.innings.battingTeamId === teamId);
  if (!innings) return null;
  return `${innings.runs}/${innings.wickets} (${innings.overs})`;
}

function TeamRow({
  match,
  side,
  dark,
}: {
  match: MatchComputed;
  side: "a" | "b";
  dark?: boolean;
}) {
  const team = side === "a" ? match.teamA : match.teamB;
  const score = scoreLine(match, team.id);
  const batting = match.currentInnings?.innings.battingTeamId === team.id && match.match.status === "live";
  return (
    <div className="flex items-center gap-3">
      <TeamLogo team={team} size="md" />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-semibold", dark ? "text-white" : "text-foreground")}>{team.name}</p>
        <p className={cn("text-[11px]", dark ? "text-white/55" : "text-muted-foreground")}>{team.shortName}</p>
      </div>
      <div className="text-right">
        {score ? (
          <p className={cn("tabular text-sm font-bold", dark ? "text-white" : "text-foreground")}>
            {score}
            {batting ? <span className="ml-1 text-accent">*</span> : null}
          </p>
        ) : (
          <p className={cn("text-xs", dark ? "text-white/50" : "text-muted-foreground")}>Yet to bat</p>
        )}
      </div>
    </div>
  );
}

export function MatchCard({
  match,
  seasonName,
  variant = "default",
  className,
}: {
  match: MatchComputed;
  seasonName?: string;
  variant?: "default" | "featured" | "compact";
  className?: string;
}) {
  const live = match.match.status === "live";
  const completed = match.match.status === "completed";
  const scheduled = match.match.status === "scheduled";
  const dark = variant === "featured";

  if (variant === "compact") {
    return (
      <Link
        href={hrefFor(match)}
        className={cn(
          "group flex w-[290px] shrink-0 flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {seasonName ? `${seasonName} · ` : ""}Match {match.match.matchNumber}
          </span>
          {live ? <LiveBadge /> : <Badge variant="secondary">{completed ? "Result" : "Upcoming"}</Badge>}
        </div>
        <div className="space-y-2.5">
          <TeamRow match={match} side="a" />
          <TeamRow match={match} side="b" />
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {live || completed ? (match.resultText ?? match.statusText) : `${formatKathmanduDate(match.match.scheduledAt)} · ${formatKathmanduTime(match.match.scheduledAt)} NPT`}
        </p>
      </Link>
    );
  }

  if (dark) {
    return (
      <Link
        href={hrefFor(match)}
        className={cn(
          "dark-panel group relative block overflow-hidden rounded-xl border border-white/10 p-5 shadow-lg sm:p-7",
          className,
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {live ? <LiveBadge /> : <Badge variant="dark">{scheduled ? "Next match" : completed ? "Final" : "Match"}</Badge>}
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
              {seasonName ?? "NPL"} · Match {match.match.matchNumber}
            </span>
          </div>
          <span className="text-[11px] text-white/60">
            {formatKathmanduDate(match.match.scheduledAt)} · {formatKathmanduTime(match.match.scheduledAt)} NPT
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="space-y-3">
            <TeamRow match={match} side="a" dark />
            <TeamRow match={match} side="b" dark />
          </div>
          <div className="hidden h-16 w-px bg-white/10 sm:block" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">
              {live ? "In progress" : completed ? "Result" : "Fixture"}
            </p>
            <p className="mt-1 text-sm leading-6 text-white/90">
              {live || completed ? (match.resultText ?? match.statusText) : `${match.teamA.name} vs ${match.teamB.name}`}
            </p>
            {live && match.requiredRuns !== null && match.requiredRunRate !== null ? (
              <p className="mt-1 text-xs text-white/60">
                Need {match.requiredRuns} runs · RRR {match.requiredRunRate.toFixed(2)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs text-white/65">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {match.venue.name}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-white group-hover:text-accent">
            {live ? "Open match centre" : "View match"}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={hrefFor(match)}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {seasonName ? `${seasonName} · ` : ""}Match {match.match.matchNumber}
        </span>
        {live ? <LiveBadge /> : <Badge variant="secondary">{completed ? "Result" : "Upcoming"}</Badge>}
      </div>
      <div className="space-y-2.5">
        <TeamRow match={match} side="a" />
        <TeamRow match={match} side="b" />
      </div>
      <div className="border-t border-border pt-2.5">
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {live || completed
            ? (match.resultText ?? match.statusText)
            : `${formatKathmanduDate(match.match.scheduledAt)} · ${formatKathmanduTime(match.match.scheduledAt)} NPT`}
        </p>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">{match.venue.name}</p>
      </div>
    </Link>
  );
}
