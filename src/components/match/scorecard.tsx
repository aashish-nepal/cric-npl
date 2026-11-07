import Link from "next/link";
import type { BattingEntry, BowlingEntry, InningsComputed, Player, Team } from "@/types/cricket";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamLogo } from "@/components/cricket/identity";
import { cn, formatNumber } from "@/lib/utils";

export function formatDismissal(entry: BattingEntry, playerById: Map<string, Player>): string {
  const dismissal = entry.dismissal;
  if (!dismissal) return "not out";
  if (dismissal.type === "not_out") return "not out";
  if (dismissal.type === "retired_hurt") return "retired hurt";
  if (dismissal.type === "obstructing_field") return "obstructing the field";
  if (dismissal.type === "timed_out") return "timed out";

  const surname = (id: string | null) => {
    if (!id) return null;
    const name = playerById.get(id)?.fullName;
    if (!name) return null;
    return name.split(" ").slice(-1)[0] ?? name;
  };
  const bowler = surname(dismissal.bowlerId);
  const fielder = surname(dismissal.fielderId);

  switch (dismissal.type) {
    case "bowled":
      return bowler ? `b ${bowler}` : "bowled";
    case "caught":
      return fielder && bowler ? `c ${fielder} b ${bowler}` : bowler ? `c b ${bowler}` : "caught";
    case "caught_and_bowled":
      return bowler ? `c & b ${bowler}` : "caught and bowled";
    case "lbw":
      return bowler ? `lbw b ${bowler}` : "lbw";
    case "stumped":
      return fielder && bowler ? `st ${fielder} b ${bowler}` : bowler ? `st b ${bowler}` : "stumped";
    case "run_out":
      return fielder ? `run out (${fielder})` : "run out";
    case "hit_wicket":
      return bowler ? `hit wicket b ${bowler}` : "hit wicket";
    default:
      return String(dismissal.type).replaceAll("_", " ");
  }
}

export function InningsScoreHeader({ innings, team }: { innings: InningsComputed; team: Team }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <TeamLogo team={team} size="sm" />
        <div>
          <p className="text-sm font-semibold">{team.name}</p>
          <p className="text-[11px] text-muted-foreground">Innings {innings.innings.inningsNumber}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="tabular text-lg font-bold">
          {innings.runs}/{innings.wickets}
          <span className="ml-1.5 text-xs font-medium text-muted-foreground">({innings.overs} ov)</span>
        </p>
        <p className="text-[11px] text-muted-foreground">
          RR {formatNumber(innings.runRate)} · Extras {innings.extras.total}
        </p>
      </div>
    </div>
  );
}

export function BattingTable({
  innings,
  playerById,
}: {
  innings: InningsComputed;
  playerById: Map<string, Player>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Batter</TableHead>
          <TableHead className="hidden sm:table-cell">Dismissal</TableHead>
          <TableHead className="text-right">R</TableHead>
          <TableHead className="text-right">B</TableHead>
          <TableHead className="hidden text-right sm:table-cell">4s</TableHead>
          <TableHead className="hidden text-right sm:table-cell">6s</TableHead>
          <TableHead className="text-right">SR</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {innings.batting.map((entry) => {
          const player = playerById.get(entry.playerId);
          return (
            <TableRow key={entry.playerId}>
              <TableCell>
                <div className="flex min-w-[120px] flex-col">
                  {player ? (
                    <Link href={`/players/${player.slug}`} className="font-medium hover:text-primary">
                      {player.fullName}
                      {!entry.out ? <span className="ml-0.5 text-primary">*</span> : null}
                    </Link>
                  ) : (
                    <span>Unknown batter</span>
                  )}
                  <span className="text-[11px] text-muted-foreground sm:hidden">{formatDismissal(entry, playerById)}</span>
                </div>
              </TableCell>
              <TableCell className="hidden max-w-[240px] truncate text-xs text-muted-foreground sm:table-cell">
                {formatDismissal(entry, playerById)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular">{entry.runs}</TableCell>
              <TableCell className="text-right tabular">{entry.balls}</TableCell>
              <TableCell className="hidden text-right tabular sm:table-cell">{entry.fours}</TableCell>
              <TableCell className="hidden text-right tabular sm:table-cell">{entry.sixes}</TableCell>
              <TableCell className="text-right tabular text-xs">{formatNumber(entry.strikeRate, 1)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function ExtrasLine({ innings }: { innings: InningsComputed }) {
  const extras = innings.extras;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs">
      <span className="text-muted-foreground">
        Extras <strong className="text-foreground">{extras.total}</strong>
        <span className="ml-1.5">
          (wd {extras.wides}, nb {extras.noBalls}, b {extras.byes}, lb {extras.legByes}
          {extras.penalty > 0 ? `, pen ${extras.penalty}` : ""})
        </span>
      </span>
      <span className="font-semibold tabular">
        Total {innings.runs}/{innings.wickets} ({innings.overs} ov)
      </span>
    </div>
  );
}

export function BowlingTable({
  innings,
  playerById,
}: {
  innings: InningsComputed;
  playerById: Map<string, Player>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bowler</TableHead>
          <TableHead className="text-right">O</TableHead>
          <TableHead className="text-right">M</TableHead>
          <TableHead className="text-right">R</TableHead>
          <TableHead className="text-right">W</TableHead>
          <TableHead className="text-right">Econ</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Wd</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Nb</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {innings.bowling.map((entry) => {
          const player = playerById.get(entry.playerId);
          return (
            <TableRow key={entry.playerId}>
              <TableCell>
                {player ? (
                  <Link href={`/players/${player.slug}`} className="font-medium hover:text-primary">
                    {player.fullName}
                  </Link>
                ) : (
                  "Unknown bowler"
                )}
              </TableCell>
              <TableCell className="text-right tabular">{entry.overs}</TableCell>
              <TableCell className="text-right tabular">{entry.maidens}</TableCell>
              <TableCell className="text-right tabular">{entry.runsConceded}</TableCell>
              <TableCell className="text-right font-semibold tabular">{entry.wickets}</TableCell>
              <TableCell className="text-right tabular text-xs">{formatNumber(entry.economy, 2)}</TableCell>
              <TableCell className="hidden text-right tabular sm:table-cell">{entry.wides}</TableCell>
              <TableCell className="hidden text-right tabular sm:table-cell">{entry.noBalls}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function BowlingSummary({ bowling }: { bowling: BowlingEntry[] }) {
  const best = bowling[0];
  if (!best) return null;
  return (
    <p className="px-4 py-2 text-xs text-muted-foreground">
      Best figures: {best.wickets}/{best.runsConceded} ({best.overs} ov)
    </p>
  );
}

export function ScorecardBlock({
  innings,
  team,
  playerById,
  className,
}: {
  innings: InningsComputed;
  team: Team;
  playerById: Map<string, Player>;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
      <InningsScoreHeader innings={innings} team={team} />
      <BattingTable innings={innings} playerById={playerById} />
      <ExtrasLine innings={innings} />
      <div className="border-t border-border">
        <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bowling</p>
        <BowlingTable innings={innings} playerById={playerById} />
        <BowlingSummary bowling={innings.bowling} />
      </div>
    </section>
  );
}
