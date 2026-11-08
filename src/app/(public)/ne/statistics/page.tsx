import type { Metadata } from "next";
import { loadStatisticsBoard } from "@/services/statistics";
import { NepaliPage, NepaliEnglishLink } from "@/components/layout/nepali-page";
import { BattingTable, BowlingTable } from "@/components/statistics/leaderboard-tables";
import { StatCard } from "@/components/statistics/stat-card";
import { LeaderboardCard } from "@/components/statistics/page-shell";

export const metadata: Metadata = {
  title: "तथ्याङ्क — नेपाल प्रिमियर लिग",
  description: "नेपाल प्रिमियर लिगको ब्याटिङ, बलिङ र टोली तथ्याङ्क, बल-दर-बल डेटाबाट गणना गरिएको।",
  alternates: { canonical: "/ne/statistics", languages: { en: "/statistics", ne: "/ne/statistics" } },
};

export default async function NepaliStatisticsPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const { season } = await searchParams;
  const data = await loadStatisticsBoard(season);
  const { records } = data;
  const playerName = (id: string | undefined) => (id ? (data.playerById.get(id)?.fullName ?? "—") : "—");

  return (
    <NepaliPage
      title="तथ्याङ्क"
      description="सिजनका प्रमुख रन स्कोरर, विकेट टेकर र टोली रेकर्डहरू। सबै तथ्याङ्क दर्ता गरिएका बलहरूबाट निकालिएका हुन्।"
      eyebrow={data.season.name}
      actions={<NepaliEnglishLink href="/statistics" />}
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            eyebrow="सर्वाधिक रन"
            title={playerName(records.leadingRunScorer?.playerId)}
            value={records.leadingRunScorer ? `${records.leadingRunScorer.runs} रन` : "—"}
          />
          <StatCard
            eyebrow="सर्वाधिक विकेट"
            title={playerName(records.leadingWicketTaker?.playerId)}
            value={records.leadingWicketTaker ? `${records.leadingWicketTaker.wickets} विकेट` : "—"}
          />
          <StatCard
            eyebrow="सर्वाधिक छक्का"
            title={playerName(records.mostSixes?.playerId)}
            value={records.mostSixes ? `${records.mostSixes.sixes} छक्का` : "—"}
          />
        </div>

        <LeaderboardCard title="ब्याटिङ" description="रन, औसत, स्ट्राइक रेट र सीमा-पार प्रहार।">
          <BattingTable rows={data.batting} playerById={data.playerById} teamById={data.teamById} limit={15} />
        </LeaderboardCard>

        <LeaderboardCard title="बलिङ" description="विकेट, इकोनोमी र बलिङ स्ट्राइक रेट।">
          <BowlingTable rows={data.bowling} playerById={data.playerById} teamById={data.teamById} limit={15} />
        </LeaderboardCard>
      </div>
    </NepaliPage>
  );
}
