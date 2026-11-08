import type { Metadata } from "next";
import { loadSite } from "@/services/cricket";
import { NepaliPage, NepaliEnglishLink } from "@/components/layout/nepali-page";
import { StandingsTable } from "@/components/cricket/standings-table";

export const metadata: Metadata = {
  title: "अंक तालिका — नेपाल प्रिमियर लिग",
  description: "नेपाल प्रिमियर लिगको अंक तालिका, नेट रन रेट र टोलीको स्थान।",
  alternates: { canonical: "/ne/points-table", languages: { en: "/points-table", ne: "/ne/points-table" } },
};

export default async function NepaliPointsTablePage() {
  const site = await loadSite();
  const { standings } = site.analytics;

  return (
    <NepaliPage
      title="अंक तालिका"
      description="जित, हार, अंक र नेट रन रेटसहितको तालिका। शीर्ष चार टोली प्लेअफमा पुग्छन्।"
      eyebrow={site.activeSeason.name}
      actions={<NepaliEnglishLink href="/points-table" />}
    >
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <StandingsTable standings={standings} teamById={site.analytics.teamById} />
      </div>
    </NepaliPage>
  );
}
