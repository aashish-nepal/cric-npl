import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";
import { getHomeData } from "@/services/cricket";
import { MatchCard } from "@/components/match/match-card";
import { StandingsTable } from "@/components/cricket/standings-table";
import { Badge } from "@/components/ui/badge";
import { formatKathmanduDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "एनपीएल क्रिकेट हब — लाइभ स्कोर, तथ्याङ्क र समाचार",
  description: "नेपाल प्रिमियर लिगको लाइभ स्कोर, बल-दर-बल कमेन्ट्री, तालिका, खेलाडी तथ्याङ्क र समाचार।",
  alternates: {
    canonical: "/ne",
    languages: { en: "/", ne: "/ne" },
  },
};

export default async function NepaliHomePage() {
  const data = await getHomeData();
  const featuredArticle = data.articles.find((article) => article.featured) ?? data.articles[0] ?? null;

  return (
    <div lang="ne" className="font-sans">
      <section className="dark-panel border-b border-white/10">
        <div className="container-page grid gap-6 py-8 lg:grid-cols-[1.5fr_1fr] lg:items-start lg:py-12">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="dark" className="gap-1.5">
                <Radio className="h-3 w-3 text-accent" aria-hidden="true" />
                {data.site.activeSeason.name}
              </Badge>
              <Link href="/" hrefLang="en" lang="en" className="text-[11px] font-semibold text-white/70 hover:text-white">
                English
              </Link>
            </div>
            <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              एनपीएल, बल-दर-बल।
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
              नेपाल प्रिमियर लिगको लाइभ स्कोर, पूर्ण स्कोरकार्ड, सिजन तथ्याङ्क र स्वतन्त्र समाचार। यहाँको हरेक
              तथ्याङ्क रेकर्ड गरिएको बलबाट निकालिएको हो।
            </p>
            {data.featured ? (
              <div className="mt-6">
                <MatchCard match={data.featured} seasonName={data.site.activeSeason.name} variant="featured" />
              </div>
            ) : null}
          </div>
          <aside className="rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">ताजा समाचार</h2>
            <ul className="mt-3 divide-y divide-white/10">
              {data.articles.slice(0, 5).map((article) => (
                <li key={article.id}>
                  <Link href={`/news/${article.slug}`} className="group block py-3">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-white/90 group-hover:text-accent">
                      {article.title}
                    </p>
                    <p className="mt-1 text-[11px] text-white/45">{article.readingMinutes} मिनेट</p>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">लाइभ</p>
                <p className="mt-1 text-2xl font-bold tabular">{data.live.length}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">आगामी</p>
                <p className="mt-1 text-2xl font-bold tabular">{data.upcoming.length}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-end justify-between gap-2">
              <h2 className="text-xl font-bold tracking-tight">आगामी खेलहरू</h2>
              <Link href="/fixtures" className="text-xs font-semibold text-primary hover:underline">
                पूरा तालिका <ArrowRight className="inline h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.upcoming.slice(0, 4).map((match) => (
                <MatchCard key={match.match.id} match={match} seasonName={data.site.activeSeason.name} />
              ))}
            </div>
          </section>

          {featuredArticle ? (
            <section>
              <h2 className="mb-3 text-xl font-bold tracking-tight">सम्पादकीय</h2>
              <Link href={`/news/${featuredArticle.slug}`} className="group block rounded-lg border border-border bg-card p-5">
                <p className="text-[11px] text-muted-foreground">{formatKathmanduDate(featuredArticle.publishedAt ?? featuredArticle.updatedAt)}</p>
                <h3 className="mt-1 text-lg font-bold leading-snug group-hover:text-primary">{featuredArticle.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{featuredArticle.excerpt}</p>
              </Link>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 text-xl font-bold tracking-tight">टोलीहरू</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {data.site.bundle.teams.map((team) => (
                <Link key={team.id} href={`/teams/${team.slug}`} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-primary/40">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded text-[9px] font-bold text-white" style={{ backgroundColor: team.primaryColor }}>
                    {team.shortName}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{team.name}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold tracking-tight">अंक तालिका</h2>
              <Link href="/points-table" className="text-[11px] font-semibold text-primary hover:underline">
                पूरा तालिका
              </Link>
            </div>
            <StandingsTable standings={data.standings} teamById={data.teamById} compact />
          </section>
          <section className="rounded-lg border border-border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
            <p className="font-semibold text-foreground">डेमो डाटासेट</p>
            <p className="mt-1.5">
              यो संस्करण डेमो डाटामा चलिरहेको छ। स्कोर, टोली र समाचार उदाहरणका लागि मात्र हुन्, आधिकारिक एनपीएल
              रेकर्ड होइनन्।
            </p>
            <Link href="/about#data" className="mt-2 inline-flex font-semibold text-primary hover:underline">
              डाटाबारे जान्नुहोस् →
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
