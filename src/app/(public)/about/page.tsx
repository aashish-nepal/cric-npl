import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Database, Mail, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getRepository } from "@/lib/data";

export const metadata: Metadata = {
  title: "About NPL Cricket Hub",
  description:
    "Who we are, how our data works, our editorial policy and how to request a correction.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const demo = getRepository().isDemo;
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Independent NPL coverage"
        description="NPL Cricket Hub is an independent cricket publication and statistics platform. It is not affiliated with the Nepal Premier League, the Cricket Association of Nepal or any franchise."
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "About" }]} />
      </div>
      <div className="container-page grid gap-8 py-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="prose-editorial max-w-3xl">
          <h2>What we do</h2>
          <p>
            We publish live scores, scorecards, standings, player statistics and editorial coverage of Nepali cricket.
            Every statistic is derived from recorded ball events, so a scorecard, a leaderboard and a points table can
            always be traced back to the same source.
          </p>

          <h2 id="data">How the data works</h2>
          <p>
            Match data is either entered by an authorised scorer or ingested from a licensed provider. Each match page
            displays its data source. We do not scrape other publications, and we do not present unverified social media
            claims as fact.
          </p>
          <p>
            {demo
              ? "This build is running on a labelled demo dataset. Scores, squads, articles and polls are illustrative and are not official NPL records. The demo dataset is generated deterministically from simulated ball-by-ball events."
              : "This deployment is connected to a Supabase database. The data source for each match is shown on its match page."}
          </p>

          <h2 id="editorial-policy">Editorial policy</h2>
          <h3>Independence</h3>
          <p>
            We are not affiliated with the NPL, CAN or any franchise. Team names and competition names are used for
            identification only. Any future use of official branding or photography will be under a documented licence
            or permission.
          </p>
          <h3>Sourcing and verification</h3>
          <p>
            Match reports are written from recorded match data and, where possible, first-hand reporting. Statistics are
            computed, not copied. Projections are labelled as estimates and are not presented as predictions of fact.
          </p>
          <h3>Corrections</h3>
          <p>
            If a factual error is identified, we correct it promptly and add a note to the article describing what
            changed. Requests can be sent to our editorial address on the contact page.
          </p>
          <h3>Automated content</h3>
          <p>
            We do not publish automatically generated match reports as journalism. Computed statistics and projections
            are labelled and trace back to ball-by-ball records.
          </p>

          <h2>Accessibility and performance</h2>
          <p>
            The site is built mobile-first, uses semantic HTML, provides keyboard navigation and honours reduced-motion
            preferences. Pages are server-rendered and designed to remain usable on slow connections.
          </p>

          <h2>Contact</h2>
          <p>
            Editorial, data corrections and partnership enquiries are handled through the{" "}
            <Link href="/contact">contact page</Link>.
          </p>
        </div>

        <aside className="space-y-3">
          <InfoCard icon={<Database className="h-4 w-4" />} title="Data source">
            {demo ? "Labelled demo dataset generated from simulated ball events." : "Supabase production database with per-match source attribution."}
          </InfoCard>
          <InfoCard icon={<ShieldCheck className="h-4 w-4" />} title="Independence">
            Not affiliated with the NPL, CAN or any franchise.
          </InfoCard>
          <InfoCard icon={<AlertTriangle className="h-4 w-4" />} title="No betting">
            We do not offer betting, odds or paid prediction products.
          </InfoCard>
          <InfoCard icon={<Mail className="h-4 w-4" />} title="Corrections">
            <Link href="/contact" className="font-semibold text-primary hover:underline">
              Request a correction →
            </Link>
          </InfoCard>
        </aside>
      </div>
    </>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-bold tracking-tight">
        <span className="text-primary" aria-hidden="true">{icon}</span>
        {title}
      </p>
      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{children}</p>
    </div>
  );
}
