import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getVenuePage } from "@/services/content";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MatchCard } from "@/components/match/match-card";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getVenuePage(slug);
  if (!data) return { title: "Venue not found" };
  return {
    title: `${data.venue.name} — venue guide and records`,
    description: data.venue.description,
    alternates: { canonical: `/venues/${slug}` },
  };
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getVenuePage(slug);
  if (!data) notFound();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Venues", path: "/venues" }, { name: data.venue.name, path: `/venues/${slug}` }])} />
      <section className="border-b border-border bg-surface">
        <div className="container-page py-4">
          <Breadcrumbs items={[{ label: "Venues", href: "/venues" }, { label: data.venue.name }]} />
        </div>
        <div className="container-page pb-6 sm:pb-8">
          <p className="eyebrow inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {data.venue.city}, {data.venue.country}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{data.venue.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{data.venue.description}</p>
          <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Matches hosted" value={data.stats.matchesHosted} />
            <Metric label="Avg first innings" value={data.stats.averageFirstInnings ?? "—"} />
            <Metric label="Highest total" value={data.stats.highestTotal ?? "—"} />
            <Metric label="Lowest total" value={data.stats.lowestTotal ?? "—"} />
          </dl>
        </div>
      </section>

      <div className="container-page py-6 sm:py-8">
        <h2 className="mb-3 text-lg font-bold tracking-tight">Matches at this venue</h2>
        {data.matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matches have been played here in this dataset.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.matches.slice(0, 18).map((match) => (
              <MatchCard key={match.match.id} match={match} />
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Venue scoring patterns are calculated from the demo dataset. See{" "}
          <Link href="/guides/cricket-statistics-explained" className="font-semibold text-primary hover:underline">
            the statistics guide
          </Link>{" "}
          for how these figures are defined.
        </p>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-lg font-bold tabular">{value}</dd>
    </div>
  );
}
