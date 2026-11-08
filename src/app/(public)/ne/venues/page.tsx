import type { Metadata } from "next";
import Link from "next/link";
import { loadSite } from "@/services/cricket";
import { NepaliPage, NepaliEnglishLink } from "@/components/layout/nepali-page";

export const metadata: Metadata = {
  title: "मैदानहरू — नेपाल प्रिमियर लिग",
  description: "नेपाल प्रिमियर लिगका खेल मैदान, सहर र क्षमता।",
  alternates: { canonical: "/ne/venues", languages: { en: "/venues", ne: "/ne/venues" } },
};

export default async function NepaliVenuesPage() {
  const site = await loadSite();

  return (
    <NepaliPage
      title="मैदानहरू"
      description="लिगका खेल हुने मैदान, सहर र दर्शक क्षमता।"
      actions={<NepaliEnglishLink href="/venues" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {site.bundle.venues.map((venue) => (
          <Link
            key={venue.id}
            href={`/venues/${venue.slug}`}
            className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
          >
            <h2 className="text-sm font-bold">{venue.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {venue.city}, {venue.country}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {venue.capacity ? `क्षमता ${venue.capacity.toLocaleString("en-GB")}` : "क्षमता उपलब्ध छैन"}
            </p>
          </Link>
        ))}
      </div>
    </NepaliPage>
  );
}
