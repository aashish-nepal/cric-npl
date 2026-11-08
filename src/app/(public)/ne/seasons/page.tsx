import type { Metadata } from "next";
import Link from "next/link";
import { loadSite } from "@/services/cricket";
import { NepaliPage, NepaliEnglishLink } from "@/components/layout/nepali-page";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "सिजनहरू — नेपाल प्रिमियर लिग",
  description: "नेपाल प्रिमियर लिगका सबै सिजन, तिनका तालिका, नतिजा र अभिलेख।",
  alternates: { canonical: "/ne/seasons", languages: { en: "/seasons", ne: "/ne/seasons" } },
};

export default async function NepaliSeasonsPage() {
  const site = await loadSite();

  return (
    <NepaliPage
      title="सिजनहरू"
      description="प्रत्येक सिजनको तालिका, नतिजा र खेलाडी अभिलेख।"
      actions={<NepaliEnglishLink href="/seasons" />}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {site.seasons.map((season) => {
          const analytics = site.analyticsBySeason.get(season.id);
          return (
            <Link
              key={season.id}
              href={`/seasons/${season.slug}`}
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold">{season.name}</h2>
                <Badge variant={season.status === "active" ? "success" : "secondary"}>{season.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {season.startDate} → {season.endDate}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {analytics?.matches.length ?? 0} खेल · {site.bundles.find((row) => row.season.id === season.id)?.teams.length ?? 0} टोली
              </p>
            </Link>
          );
        })}
      </div>
    </NepaliPage>
  );
}
