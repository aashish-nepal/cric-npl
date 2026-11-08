import type { Metadata } from "next";
import Link from "next/link";
import { loadSite } from "@/services/cricket";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PlayerCard } from "@/components/cricket/player-card";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import type { PlayerRole } from "@/types/cricket";

export const metadata: Metadata = {
  title: "NPL players and squads",
  description: "Browse every Nepal Premier League player with roles, teams, season runs, wickets and profile pages.",
  alternates: { canonical: "/players", languages: { en: "/players", ne: "/ne/players" } },
};

const ROLES: Array<{ value: PlayerRole | "all"; label: string }> = [
  { value: "all", label: "All roles" },
  { value: "batter", label: "Batters" },
  { value: "bowler", label: "Bowlers" },
  { value: "all_rounder", label: "All-rounders" },
  { value: "wicketkeeper", label: "Wicketkeepers" },
];

export default async function PlayersPage({ searchParams }: { searchParams: Promise<{ role?: string; team?: string; q?: string }> }) {
  const { role, team, q } = await searchParams;
  const site = await loadSite();
  const squadByPlayer = new Map(site.bundle.squads.map((row) => [row.playerId, row]));
  const teamById = site.analytics.teamById;
  const battingByPlayer = new Map(site.analytics.batting.map((row) => [row.playerId, row]));
  const bowlingByPlayer = new Map(site.analytics.bowling.map((row) => [row.playerId, row]));
  const needle = (q ?? "").trim().toLowerCase();

  const players = site.bundle.players
    .filter((player) => squadByPlayer.has(player.id))
    .filter((player) => (role && role !== "all" ? player.playingRole === role : true))
    .filter((player) => (team ? squadByPlayer.get(player.id)?.teamId === team : true))
    .filter((player) => (needle ? player.fullName.toLowerCase().includes(needle) : true))
    .sort((a, b) => (battingByPlayer.get(b.id)?.runs ?? 0) - (battingByPlayer.get(a.id)?.runs ?? 0));

  const query = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { role, team, q, ...patch };
    for (const [key, value] of Object.entries(merged)) {
      if (value && value !== "all") params.set(key, value);
    }
    const string = params.toString();
    return `/players${string ? `?${string}` : ""}`;
  };

  return (
    <>
      <PageHeader
        eyebrow={site.activeSeason.name}
        title="Players"
        description="Every player in the league, ranked by runs in the selected season. Filter by role or franchise to narrow the list."
        actions={
          <Link href="/compare" className="text-xs font-semibold text-primary hover:underline">
            Compare two players →
          </Link>
        }
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Players" }]} />
      </div>
      <div className="container-page space-y-3 py-4">
        <div className="flex flex-wrap gap-1.5" role="navigation" aria-label="Role filter">
          {ROLES.map((item) => (
            <Link
              key={item.value}
              href={query({ role: item.value })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                (role ?? "all") === item.value
                  ? "border-primary bg-primary text-white"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="navigation" aria-label="Team filter">
          <Link
            href={query({ team: undefined })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold",
              !team ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            All teams
          </Link>
          {site.bundle.teams.map((row) => (
            <Link
              key={row.id}
              href={query({ team: row.id })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                team === row.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {row.shortName}
            </Link>
          ))}
        </div>
        <form action="/players" method="get" className="flex max-w-md gap-2">
          {role && role !== "all" ? <input type="hidden" name="role" value={role} /> : null}
          {team ? <input type="hidden" name="team" value={team} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search players by name"
            aria-label="Search players by name"
            className="h-9 flex-1 rounded-md border border-input bg-surface px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button type="submit" className="h-9 rounded-md bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-dark">
            Search
          </button>
        </form>
      </div>
      <div className="container-page py-6 sm:py-8">
        <p className="mb-3 text-xs text-muted-foreground">{players.length} player(s)</p>
        {players.length === 0 ? (
          <EmptyState title="No players match this filter" description="Try clearing the search or selecting a different role." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {players.map((player) => {
              const squad = squadByPlayer.get(player.id);
              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  team={squad ? (teamById.get(squad.teamId) ?? null) : null}
                  batting={battingByPlayer.get(player.id) ?? null}
                  bowling={bowlingByPlayer.get(player.id) ?? null}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
