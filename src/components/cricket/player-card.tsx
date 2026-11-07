import Link from "next/link";
import type { BattingAggregate, BowlingAggregate, Player, Team } from "@/types/cricket";
import { PlayerAvatar, TeamLogo } from "./identity";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/types/content";
import { cn, formatNumber } from "@/lib/utils";

export function PlayerCard({
  player,
  team,
  batting,
  bowling,
  className,
}: {
  player: Player;
  team?: Team | null;
  batting?: BattingAggregate | null;
  bowling?: BowlingAggregate | null;
  className?: string;
}) {
  return (
    <Link
      href={`/players/${player.slug}`}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40",
        className,
      )}
    >
      <PlayerAvatar player={player} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold group-hover:text-primary">{player.fullName}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {team ? (
            <span className="inline-flex items-center gap-1">
              <TeamLogo team={team} size="xs" className="h-4 w-4 text-[7px]" />
              {team.shortName}
            </span>
          ) : null}
          <span aria-hidden="true">·</span>
          <span>{ROLE_LABELS[player.playingRole]}</span>
        </p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          {batting ? (
            <span>
              <strong className="font-semibold text-foreground">{batting.runs}</strong> runs
            </span>
          ) : null}
          {bowling ? (
            <span>
              <strong className="font-semibold text-foreground">{bowling.wickets}</strong> wkts
            </span>
          ) : null}
        </div>
      </div>
      {batting ? (
        <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
          SR {formatNumber(batting.strikeRate, 1)}
        </Badge>
      ) : null}
    </Link>
  );
}
