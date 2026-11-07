import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { loadSite } from "@/services/cricket";
import { getVenuePage } from "@/services/content";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = {
  title: "NPL venues",
  description: "Nepal Premier League grounds with match counts, average first-innings scores and venue records.",
  alternates: { canonical: "/venues" },
};

export default async function VenuesPage() {
  const site = await loadSite();
  const pages = await Promise.all(site.bundle.venues.map((venue) => getVenuePage(venue.slug)));

  return (
    <>
      <PageHeader eyebrow="Grounds" title="Venues" description="The grounds hosting NPL cricket, with scoring patterns drawn from every innings recorded here." />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Venues" }]} />
      </div>
      <div className="container-page grid gap-4 py-6 sm:py-8 lg:grid-cols-3">
        {pages.map((data) => {
          if (!data) return null;
          return (
            <Link key={data.venue.id} href={`/venues/${data.venue.slug}`} className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold tracking-tight group-hover:text-primary">{data.venue.name}</h2>
                  <p className="text-[11px] text-muted-foreground">{data.venue.city}, {data.venue.country}</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-xs leading-5 text-muted-foreground">{data.venue.description}</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Matches</dt>
                  <dd className="text-sm font-bold tabular">{data.stats.matchesHosted}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg 1st inns</dt>
                  <dd className="text-sm font-bold tabular">{data.stats.averageFirstInnings ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Highest</dt>
                  <dd className="text-sm font-bold tabular">{data.stats.highestTotal ?? "—"}</dd>
                </div>
              </dl>
            </Link>
          );
        })}
      </div>
    </>
  );
}
