import type { Metadata } from "next";
import Link from "next/link";
import { loadSite } from "@/services/cricket";
import { NepaliPage, NepaliEnglishLink } from "@/components/layout/nepali-page";
import { PlayerCard } from "@/components/cricket/player-card";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = {
  title: "खेलाडीहरू — नेपाल प्रिमियर लिग",
  description: "नेपाल प्रिमियर लिगका खेलाडी, भूमिका, टोली, सिजनका रन र विकेट।",
  alternates: { canonical: "/ne/players", languages: { en: "/players", ne: "/ne/players" } },
};

export default async function NepaliPlayersPage({ searchParams }: { searchParams: Promise<{ team?: string }> }) {
  const { team } = await searchParams;
  const site = await loadSite();
  const squadByPlayer = new Map(site.bundle.squads.map((row) => [row.playerId, row]));
  const battingByPlayer = new Map(site.analytics.batting.map((row) => [row.playerId, row]));
  const bowlingByPlayer = new Map(site.analytics.bowling.map((row) => [row.playerId, row]));

  const players = site.bundle.players
    .filter((player) => squadByPlayer.has(player.id))
    .filter((player) => (team ? squadByPlayer.get(player.id)?.teamId === team : true))
    .sort((a, b) => (battingByPlayer.get(b.id)?.runs ?? 0) - (battingByPlayer.get(a.id)?.runs ?? 0));

  return (
    <NepaliPage
      title="खेलाडीहरू"
      description="सिजनका रनअनुसार क्रमबद्ध खेलाडी। टोलीअनुसार फिल्टर गर्नुहोस्।"
      eyebrow={site.activeSeason.name}
      actions={<NepaliEnglishLink href="/players" />}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5" role="navigation" aria-label="टोली फिल्टर">
          <Link
            href="/ne/players"
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              !team ? "border-primary bg-primary text-white" : "border-border text-muted-foreground"
            }`}
          >
            सबै टोली
          </Link>
          {site.bundle.teams.map((row) => (
            <Link
              key={row.id}
              href={`/ne/players?team=${row.id}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                team === row.id ? "border-primary bg-primary text-white" : "border-border text-muted-foreground"
              }`}
            >
              {row.shortName}
            </Link>
          ))}
        </div>
        {players.length === 0 ? (
          <EmptyState title="कुनै खेलाडी भेटिएन" description="अर्को टोली छान्नुहोस्।" />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {players.map((player) => {
              const squad = squadByPlayer.get(player.id);
              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  team={squad ? (site.analytics.teamById.get(squad.teamId) ?? null) : null}
                  batting={battingByPlayer.get(player.id) ?? null}
                  bowling={bowlingByPlayer.get(player.id) ?? null}
                />
              );
            })}
          </div>
        )}
      </div>
    </NepaliPage>
  );
}
