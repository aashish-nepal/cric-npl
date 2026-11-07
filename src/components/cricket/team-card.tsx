import Link from "next/link";
import { MapPin } from "lucide-react";
import type { StandingRow, Team } from "@/types/cricket";
import { TeamLogo } from "./identity";
import { cn } from "@/lib/utils";

export function TeamCard({
  team,
  standing,
  className,
}: {
  team: Team;
  standing?: StandingRow | null;
  className?: string;
}) {
  return (
    <Link
      href={`/teams/${team.slug}`}
      className={cn(
        "group flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.02]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <TeamLogo team={team} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold tracking-tight group-hover:text-primary">{team.name}</h3>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {team.homeCity}
          </p>
          {standing ? (
            <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
              <span className="text-foreground">{standing.position}</span> on the table · {standing.points} pts
            </p>
          ) : null}
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-xs leading-5 text-muted-foreground">{team.description}</p>
    </Link>
  );
}
