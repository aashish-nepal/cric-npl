import Link from "next/link";
import type { BattingAggregate, BowlingAggregate, Player, Season, Team, TeamAggregate } from "@/types/cricket";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatNumber } from "@/lib/utils";

export type BattingMetric = "runs" | "sixes" | "average" | "strikeRate";

const BATTING_HEADINGS: Record<BattingMetric, string> = {
  runs: "Runs",
  sixes: "Sixes",
  average: "Average",
  strikeRate: "Strike rate",
};

export function StatisticsSubnav({ current }: { current: string }) {
  const links = [
    { href: "/statistics", label: "Overview" },
    { href: "/statistics/batting", label: "Batting" },
    { href: "/statistics/bowling", label: "Bowling" },
    { href: "/statistics/most-runs", label: "Most runs" },
    { href: "/statistics/most-wickets", label: "Most wickets" },
    { href: "/statistics/most-sixes", label: "Most sixes" },
    { href: "/statistics/best-average", label: "Best average" },
    { href: "/statistics/records", label: "Records" },
  ];
  return (
    <nav aria-label="Statistics sections" className="flex flex-wrap gap-1.5">
      {links.map((link) => {
        const active = link.href === current;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "border-primary bg-primary text-white"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SeasonFilter({
  seasons,
  currentSlug,
  basePath,
  teamId,
}: {
  seasons: Season[];
  currentSlug: string;
  basePath: string;
  teamId?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="navigation" aria-label="Season filter">
      {seasons.map((season) => {
        const params = new URLSearchParams();
        params.set("season", season.slug);
        if (teamId) params.set("team", teamId);
        return (
          <Link
            key={season.id}
            href={`${basePath}?${params.toString()}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold",
              season.slug === currentSlug
                ? "border-primary bg-primary text-white"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
            )}
          >
            {season.name}
          </Link>
        );
      })}
    </div>
  );
}

export function TeamFilter({
  teams,
  currentTeamId,
  basePath,
  seasonSlug,
}: {
  teams: Team[];
  currentTeamId?: string;
  basePath: string;
  seasonSlug: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="navigation" aria-label="Team filter">
      <Link
        href={`${basePath}?season=${seasonSlug}`}
        className={cn(
          "rounded-full border px-3 py-1.5 text-xs font-semibold",
          !currentTeamId
            ? "border-primary bg-primary text-white"
            : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
        )}
      >
        All teams
      </Link>
      {teams.map((team) => (
        <Link
          key={team.id}
          href={`${basePath}?season=${seasonSlug}&team=${team.id}`}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-semibold",
            team.id === currentTeamId
              ? "border-primary bg-primary text-white"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
          )}
        >
          {team.shortName}
        </Link>
      ))}
    </div>
  );
}

function PlayerCell({ player, team }: { player: Player | undefined; team: Team | undefined }) {
  if (!player) return <span className="text-muted-foreground">Unknown player</span>;
  return (
    <div className="min-w-0">
      <Link href={`/players/${player.slug}`} className="block truncate font-semibold hover:text-primary">
        {player.fullName}
      </Link>
      <span className="text-[11px] text-muted-foreground">{team?.shortName ?? "—"}</span>
    </div>
  );
}

export function BattingTable({
  rows,
  playerById,
  teamById,
  metric = "runs",
  limit,
}: {
  rows: BattingAggregate[];
  playerById: Map<string, Player>;
  teamById: Map<string, Team>;
  metric?: BattingMetric;
  limit?: number;
}) {
  const sorted = [...rows].sort((a, b) => {
    if (metric === "sixes") return b.sixes - a.sixes || b.runs - a.runs;
    if (metric === "average") return b.average - a.average || b.runs - a.runs;
    if (metric === "strikeRate") return b.strikeRate - a.strikeRate || b.runs - a.runs;
    return b.runs - a.runs || b.average - a.average;
  });
  const visible = limit ? sorted.slice(0, limit) : sorted;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Player</TableHead>
          <TableHead className="text-right">Inns</TableHead>
          <TableHead className="text-right">{BATTING_HEADINGS[metric]}</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Runs</TableHead>
          <TableHead className="hidden text-right sm:table-cell">HS</TableHead>
          <TableHead className="hidden text-right md:table-cell">Avg</TableHead>
          <TableHead className="hidden text-right md:table-cell">SR</TableHead>
          <TableHead className="hidden text-right lg:table-cell">4s</TableHead>
          <TableHead className="hidden text-right lg:table-cell">6s</TableHead>
          <TableHead className="hidden text-right lg:table-cell">50/100</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visible.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11} className="py-8 text-center text-sm text-muted-foreground">
              No batting data recorded for this filter.
            </TableCell>
          </TableRow>
        ) : (
          visible.map((row, index) => {
            const player = playerById.get(row.playerId);
            const value =
              metric === "sixes"
                ? formatNumber(row.sixes)
                : metric === "average"
                  ? row.average.toFixed(2)
                  : metric === "strikeRate"
                    ? row.strikeRate.toFixed(2)
                    : formatNumber(row.runs);
            return (
              <TableRow key={row.playerId}>
                <TableCell className="text-xs tabular text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <PlayerCell player={player} team={teamById.get(row.teamId)} />
                </TableCell>
                <TableCell className="text-right text-xs tabular">{row.innings}</TableCell>
                <TableCell className="text-right text-xs font-bold tabular">{value}</TableCell>
                <TableCell className="hidden text-right text-xs tabular sm:table-cell">{formatNumber(row.runs)}</TableCell>
                <TableCell className="hidden text-right text-xs tabular sm:table-cell">
                  {row.highScore}
                  {row.highScoreNotOut ? "*" : ""}
                </TableCell>
                <TableCell className="hidden text-right text-xs tabular md:table-cell">{row.average.toFixed(2)}</TableCell>
                <TableCell className="hidden text-right text-xs tabular md:table-cell">{row.strikeRate.toFixed(2)}</TableCell>
                <TableCell className="hidden text-right text-xs tabular lg:table-cell">{row.fours}</TableCell>
                <TableCell className="hidden text-right text-xs tabular lg:table-cell">{row.sixes}</TableCell>
                <TableCell className="hidden text-right text-xs tabular lg:table-cell">
                  {row.fifties}/{row.hundreds}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

export function BowlingTable({
  rows,
  playerById,
  teamById,
  limit,
}: {
  rows: BowlingAggregate[];
  playerById: Map<string, Player>;
  teamById: Map<string, Team>;
  limit?: number;
}) {
  const sorted = [...rows].sort((a, b) => b.wickets - a.wickets || a.economy - b.economy);
  const visible = limit ? sorted.slice(0, limit) : sorted;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Player</TableHead>
          <TableHead className="text-right">Inns</TableHead>
          <TableHead className="text-right">Wkts</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Overs</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Avg</TableHead>
          <TableHead className="text-right">Econ</TableHead>
          <TableHead className="hidden text-right md:table-cell">SR</TableHead>
          <TableHead className="hidden text-right md:table-cell">Best</TableHead>
          <TableHead className="hidden text-right lg:table-cell">Maidens</TableHead>
          <TableHead className="hidden text-right lg:table-cell">4w/5w</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visible.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11} className="py-8 text-center text-sm text-muted-foreground">
              No bowling data recorded for this filter.
            </TableCell>
          </TableRow>
        ) : (
          visible.map((row, index) => (
            <TableRow key={row.playerId}>
              <TableCell className="text-xs tabular text-muted-foreground">{index + 1}</TableCell>
              <TableCell>
                <PlayerCell player={playerById.get(row.playerId)} team={teamById.get(row.teamId)} />
              </TableCell>
              <TableCell className="text-right text-xs tabular">{row.innings}</TableCell>
              <TableCell className="text-right text-xs font-bold tabular">{row.wickets}</TableCell>
              <TableCell className="hidden text-right text-xs tabular sm:table-cell">
                {Math.floor(row.legalBalls / 6)}.{row.legalBalls % 6}
              </TableCell>
              <TableCell className="hidden text-right text-xs tabular sm:table-cell">{row.average.toFixed(2)}</TableCell>
              <TableCell className="text-right text-xs tabular">{row.economy.toFixed(2)}</TableCell>
              <TableCell className="hidden text-right text-xs tabular md:table-cell">{row.strikeRate.toFixed(1)}</TableCell>
              <TableCell className="hidden text-right text-xs tabular md:table-cell">
                {row.bestWickets}/{row.bestRuns}
              </TableCell>
              <TableCell className="hidden text-right text-xs tabular lg:table-cell">{row.maidens}</TableCell>
              <TableCell className="hidden text-right text-xs tabular lg:table-cell">
                {row.fourWicketHauls}/{row.fiveWicketHauls}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export function TeamRecordsTable({ rows, teamById }: { rows: TeamAggregate[]; teamById: Map<string, Team> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team</TableHead>
          <TableHead className="text-right">P</TableHead>
          <TableHead className="text-right">W</TableHead>
          <TableHead className="text-right">L</TableHead>
          <TableHead className="text-right">NR</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Highest</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Lowest</TableHead>
          <TableHead className="hidden text-right md:table-cell">Best chase</TableHead>
          <TableHead className="hidden text-right md:table-cell">Biggest win</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const team = teamById.get(row.teamId);
          return (
            <TableRow key={row.teamId}>
              <TableCell>
                {team ? (
                  <Link href={`/teams/${team.slug}`} className="font-semibold hover:text-primary">
                    {team.name}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-right text-xs tabular">{row.played}</TableCell>
              <TableCell className="text-right text-xs tabular">{row.won}</TableCell>
              <TableCell className="text-right text-xs tabular">{row.lost}</TableCell>
              <TableCell className="text-right text-xs tabular">{row.noResult}</TableCell>
              <TableCell className="hidden text-right text-xs tabular sm:table-cell">{row.highestScore || "—"}</TableCell>
              <TableCell className="hidden text-right text-xs tabular sm:table-cell">{row.lowestScore || "—"}</TableCell>
              <TableCell className="hidden text-right text-xs tabular md:table-cell">{row.highestSuccessfulChase ?? "—"}</TableCell>
              <TableCell className="hidden text-right text-xs tabular md:table-cell">
                {row.biggestWinByRuns !== null
                  ? `${row.biggestWinByRuns} runs`
                  : row.biggestWinByWickets !== null
                    ? `${row.biggestWinByWickets} wkts`
                    : "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
