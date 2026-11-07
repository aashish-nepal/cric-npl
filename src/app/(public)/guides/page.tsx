import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { GUIDES } from "@/constants/guides";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = {
  title: "Cricket guides",
  description: "Plain-language guides to cricket rules, scorecards, statistics and the NPL format.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Learn"
        title="Cricket guides"
        description="Short, practical explainers for following the NPL: the format, the scorecard and the statistics that matter."
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Guides" }]} />
      </div>
      <div className="container-page grid gap-4 py-6 sm:py-8 lg:grid-cols-3">
        {GUIDES.map((guide) => (
          <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="mt-3 text-base font-bold tracking-tight group-hover:text-primary">{guide.title}</h2>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{guide.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
              Read guide
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
