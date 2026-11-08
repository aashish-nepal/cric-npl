import type { Metadata } from "next";
import { getMatchList } from "@/services/cricket";
import { NepaliPage, NepaliEnglishLink } from "@/components/layout/nepali-page";
import { MatchCard } from "@/components/match/match-card";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = {
  title: "नतिजा — नेपाल प्रिमियर लिग",
  description: "नेपाल प्रिमियर लिगका सम्पन्न खेलहरूको नतिजा र स्कोरकार्ड।",
  alternates: { canonical: "/ne/results", languages: { en: "/results", ne: "/ne/results" } },
};

export default async function NepaliResultsPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const { season } = await searchParams;
  const data = await getMatchList("results", season);

  return (
    <NepaliPage
      title="नतिजा"
      description="सम्पन्न खेलहरूको नतिजा, स्कोर र म्याच रिपोर्ट।"
      eyebrow={data.season.name}
      actions={<NepaliEnglishLink href="/results" />}
    >
      {data.matches.length === 0 ? (
        <EmptyState title="कुनै सम्पन्न खेल छैन" description="यो सिजनमा अझै कुनै खेल सम्पन्न भएको छैन।" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.matches.map((match) => (
            <MatchCard key={match.match.id} match={match} seasonName={data.season.name} />
          ))}
        </div>
      )}
    </NepaliPage>
  );
}
