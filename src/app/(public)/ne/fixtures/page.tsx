import type { Metadata } from "next";
import { getMatchList } from "@/services/cricket";
import { NepaliPage, NepaliEnglishLink } from "@/components/layout/nepali-page";
import { MatchCard } from "@/components/match/match-card";
import { EmptyState } from "@/components/ui/feedback";
import { formatKathmanduDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "खेल तालिका — नेपाल प्रिमियर लिग",
  description: "नेपाल प्रिमियर लिगको पूरा खेल तालिका, मैदान र नेपाली समयअनुसार सुरु हुने समय।",
  alternates: { canonical: "/ne/fixtures", languages: { en: "/fixtures", ne: "/ne/fixtures" } },
};

export default async function NepaliFixturesPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const { season } = await searchParams;
  const data = await getMatchList("fixtures", season);
  const groups = new Map<string, typeof data.matches>();
  for (const match of data.matches) {
    const key = formatKathmanduDate(match.match.scheduledAt);
    const list = groups.get(key) ?? [];
    list.push(match);
    groups.set(key, list);
  }

  return (
    <NepaliPage
      title="खेल तालिका"
      description="आगामी खेलहरू मितिअनुसार। सबै समय नेपाली समय (NPT) मा।"
      eyebrow={data.season.name}
      actions={<NepaliEnglishLink href="/fixtures" />}
    >
      {data.matches.length === 0 ? (
        <EmptyState title="कुनै आगामी खेल छैन" description="यो सिजनका सबै खेल सम्पन्न भइसकेका छन् वा तालिका अझै प्रकाशित भएको छैन।" />
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([date, matches]) => (
            <section key={date} aria-label={date}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">{date}</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {matches.map((match) => (
                  <MatchCard key={match.match.id} match={match} seasonName={data.season.name} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </NepaliPage>
  );
}
