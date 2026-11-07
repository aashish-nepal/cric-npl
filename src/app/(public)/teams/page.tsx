import type { Metadata } from "next";
import Link from "next/link";
import { loadSite } from "@/services/cricket";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TeamCard } from "@/components/cricket/team-card";
import { StandingsTable } from "@/components/cricket/standings-table";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "NPL teams and squads",
  description: "Profiles for every Nepal Premier League franchise, including squads, form, standings and head-to-head records.",
  alternates: { canonical: "/teams" },
};

export default async function TeamsPage() {
  const site = await loadSite();
  const standingsByTeam = new Map(site.analytics.standings.map((row) => [row.teamId, row]));
  const ordered = [...site.bundle.teams].sort(
    (a, b) => (standingsByTeam.get(a.id)?.position ?? 99) - (standingsByTeam.get(b.id)?.position ?? 99),
  );

  return (
    <>
      <PageHeader
        eyebrow={site.activeSeason.name}
        title="Teams"
        description="Eight franchises, one league. Open a team for its squad, season record, recent form and head-to-head history."
        actions={
          <Link href="/points-table" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Points table
          </Link>
        }
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Teams" }]} />
      </div>
      <div className="container-page grid gap-6 py-6 sm:py-8 lg:grid-cols-[1fr_320px]">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.map((team) => (
            <TeamCard key={team.id} team={team} standing={standingsByTeam.get(team.id)} />
          ))}
        </section>
        <aside className="space-y-4">
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold tracking-tight">Standings snapshot</h2>
            </div>
            <StandingsTable standings={site.analytics.standings} teamById={site.analytics.teamById} compact />
          </section>
          <section className="rounded-lg border border-border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
            <p className="font-semibold text-foreground">Squad data</p>
            <p className="mt-1.5">
              Squads on this build come from the labelled demo dataset. Production squads are managed in the admin
              console or imported from a licensed provider.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
