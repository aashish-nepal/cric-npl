import Link from "next/link";
import type { InningsComputed, Player, Team } from "@/types/cricket";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamLogo } from "@/components/cricket/identity";
import { cn } from "@/lib/utils";

export function PartnershipsTable({
  innings,
  playerById,
}: {
  innings: InningsComputed;
  playerById: Map<string, Player>;
}) {
  const name = (id: string) => playerById.get(id)?.fullName ?? "Unknown";
  if (innings.partnerships.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">No partnerships recorded.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Wicket</TableHead>
          <TableHead>Pair</TableHead>
          <TableHead className="text-right">Runs</TableHead>
          <TableHead className="text-right">Balls</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {innings.partnerships.map((partnership) => (
          <TableRow key={`${partnership.wicketNumber}-${partnership.batterAId}`}>
            <TableCell className="tabular text-muted-foreground">{partnership.wicketNumber}</TableCell>
            <TableCell>
              <span className="font-medium">{name(partnership.batterAId)}</span>
              <span className="text-muted-foreground"> & </span>
              <span className="font-medium">{name(partnership.batterBId)}</span>
            </TableCell>
            <TableCell className="text-right font-semibold tabular">{partnership.runs}</TableCell>
            <TableCell className="text-right tabular">{partnership.legalBalls}</TableCell>
            <TableCell className="text-right">
              <span className={cn("text-xs font-semibold", partnership.unbroken ? "text-success" : "text-muted-foreground")}>
                {partnership.unbroken ? "Unbroken" : "Broken"}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function FallOfWickets({
  innings,
  playerById,
}: {
  innings: InningsComputed;
  playerById: Map<string, Player>;
}) {
  if (innings.fallOfWickets.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">No wickets have fallen.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2 p-4">
      {innings.fallOfWickets.map((wicket) => (
        <span
          key={wicket.wicketNumber}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs"
        >
          <span className="font-bold tabular">
            {wicket.wicketNumber}-{wicket.runs}
          </span>
          <span className="text-muted-foreground">{playerById.get(wicket.batterId)?.fullName ?? "Unknown"}</span>
          <span className="tabular text-[11px] text-muted-foreground">({wicket.over})</span>
        </span>
      ))}
    </div>
  );
}

export function PlayingXILists({
  entries,
  teamA,
  teamB,
  playerById,
}: {
  entries: Array<{ teamId: string; playerId: string; battingOrder: number; isCaptain: boolean; isWicketkeeper: boolean }>;
  teamA: Team;
  teamB: Team;
  playerById: Map<string, Player>;
}) {
  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2">
      {[teamA, teamB].map((team) => (
        <div key={team.id}>
          <div className="mb-2 flex items-center gap-2">
            <TeamLogo team={team} size="xs" />
            <h3 className="text-sm font-semibold">{team.name}</h3>
          </div>
          <ol className="space-y-1.5">
            {entries
              .filter((row) => row.teamId === team.id)
              .sort((a, b) => a.battingOrder - b.battingOrder)
              .map((row) => {
                const player = playerById.get(row.playerId);
                return (
                  <li key={row.playerId} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      <span className="mr-2 tabular text-[11px] text-muted-foreground">{row.battingOrder}</span>
                      {player?.slug ? (
                        <Link href={`/players/${player.slug}`} className="hover:text-primary">
                          {player.fullName}
                        </Link>
                      ) : (
                        "Unknown player"
                      )}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {row.isCaptain ? "C" : ""}
                      {row.isCaptain && row.isWicketkeeper ? " · " : ""}
                      {row.isWicketkeeper ? "WK" : ""}
                    </span>
                  </li>
                );
              })}
          </ol>
        </div>
      ))}
    </div>
  );
}
