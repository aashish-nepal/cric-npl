import Link from "next/link";
import type { StandingRow, Team } from "@/types/cricket";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamLogo } from "./identity";
import { cn, formatNrr } from "@/lib/utils";

export function StandingsTable({
  standings,
  teamById,
  compact = false,
  highlightTop = 4,
}: {
  standings: StandingRow[];
  teamById: Map<string, Team>;
  compact?: boolean;
  highlightTop?: number;
}) {
  if (standings.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">No completed matches yet.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8">#</TableHead>
          <TableHead>Team</TableHead>
          <TableHead className="text-center">P</TableHead>
          <TableHead className="text-center">W</TableHead>
          {!compact ? <TableHead className="hidden text-center sm:table-cell">L</TableHead> : null}
          {!compact ? <TableHead className="hidden text-center md:table-cell">T</TableHead> : null}
          {!compact ? <TableHead className="hidden text-center md:table-cell">NR</TableHead> : null}
          <TableHead className="text-center">Pts</TableHead>
          <TableHead className="text-right">NRR</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {standings.map((row) => {
          const team = teamById.get(row.teamId);
          const qualified = row.position <= highlightTop;
          return (
            <TableRow key={row.teamId} className={cn(qualified && "bg-primary/[0.03]")}>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold tabular",
                    qualified ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  {row.position}
                </span>
              </TableCell>
              <TableCell>
                {team ? (
                  <Link href={`/teams/${team.slug}`} className="flex items-center gap-2 font-medium hover:text-primary">
                    <TeamLogo team={team} size="xs" />
                    <span className="whitespace-nowrap">{compact ? team.shortName : team.name}</span>
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-center tabular">{row.played}</TableCell>
              <TableCell className="text-center tabular">{row.won}</TableCell>
              {!compact ? <TableCell className="hidden text-center tabular sm:table-cell">{row.lost}</TableCell> : null}
              {!compact ? <TableCell className="hidden text-center tabular md:table-cell">{row.tied}</TableCell> : null}
              {!compact ? <TableCell className="hidden text-center tabular md:table-cell">{row.noResult}</TableCell> : null}
              <TableCell className="text-center font-bold tabular">{row.points}</TableCell>
              <TableCell
                className={cn(
                  "text-right tabular text-xs font-medium",
                  row.nrr > 0 ? "text-green-700" : row.nrr < 0 ? "text-red-700" : "text-muted-foreground",
                )}
              >
                {formatNrr(row.nrr)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
