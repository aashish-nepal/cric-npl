import type { Metadata } from "next";
import Link from "next/link";
import { getMatchList } from "@/services/cricket";
import { NepaliPage, NepaliEnglishLink } from "@/components/layout/nepali-page";
import { MatchCard } from "@/components/match/match-card";
import { EmptyState } from "@/components/ui/feedback";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "लाइभ स्कोर — नेपाल प्रिमियर लिग",
  description: "नेपाल प्रिमियर लिगको लाइभ स्कोर, बल-दर-बल कमेन्ट्री र म्याच सेन्टर।",
  alternates: { canonical: "/ne/live", languages: { en: "/live", ne: "/ne/live" } },
};

export default async function NepaliLivePage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const { season } = await searchParams;
  const data = await getMatchList("live", season);

  return (
    <NepaliPage
      title="लाइभ स्कोर"
      description="हाल खेलिरहेका खेलहरूको लाइभ स्कोर, बल-दर-बल अपडेट र पूरा स्कोरकार्ड।"
      eyebrow={data.season.name}
      actions={<NepaliEnglishLink href="/live" />}
    >
      {data.matches.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="अहिले कुनै खेल लाइभ छैन"
            description="अर्को खेल सुरु हुँदा यो पृष्ठ स्वतः अपडेट हुनेछ। खेल तालिका हेर्नुहोस्।"
          />
          <Link href="/ne/fixtures" className={cn(buttonVariants({ variant: "secondary" }))}>
            खेल तालिका हेर्नुहोस्
          </Link>
        </div>
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
