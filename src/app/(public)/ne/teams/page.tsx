import type { Metadata } from "next";
import { loadSite } from "@/services/cricket";
import { NepaliPage, NepaliEnglishLink } from "@/components/layout/nepali-page";
import { TeamCard } from "@/components/cricket/team-card";
import { StandingsTable } from "@/components/cricket/standings-table";

export const metadata: Metadata = {
  title: "टोलीहरू — नेपाल प्रिमियर लिग",
  description: "नेपाल प्रिमियर लिगका सबै फ्रेन्चाइज टोली, स्क्वाड, फर्म र स्थान।",
  alternates: { canonical: "/ne/teams", languages: { en: "/teams", ne: "/ne/teams" } },
};

export default async function NepaliTeamsPage() {
  const site = await loadSite();
  const standingsByTeam = new Map(site.analytics.standings.map((row) => [row.teamId, row]));
  const ordered = [...site.bundle.teams].sort(
    (a, b) => (standingsByTeam.get(a.id)?.position ?? 99) - (standingsByTeam.get(b.id)?.position ?? 99),
  );

  return (
    <NepaliPage
      title="टोलीहरू"
      description="हरेक फ्रेन्चाइजको प्रोफाइल, स्क्वाड, फर्म र अंक तालिकामा स्थान।"
      eyebrow={site.activeSeason.name}
      actions={<NepaliEnglishLink href="/teams" />}
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.map((team) => (
            <TeamCard key={team.id} team={team} standing={standingsByTeam.get(team.id) ?? null} />
          ))}
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <StandingsTable standings={site.analytics.standings} teamById={site.analytics.teamById} />
        </div>
      </div>
    </NepaliPage>
  );
}
