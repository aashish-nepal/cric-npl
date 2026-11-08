import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/section-header";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "How NPL Cricket Hub reports, verifies and labels Nepali cricket news, match data and analysis.",
  alternates: { canonical: "/editorial-policy" },
};

export default function EditorialPolicyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our standards"
        title="Editorial policy"
        description="The principles we use to report Nepali cricket accurately, independently and transparently."
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Editorial policy" }]} />
      </div>
      <article className="container-page prose-editorial max-w-3xl py-6 sm:py-8">
        <h2>Independence</h2>
        <p>
          NPL Cricket Hub is an independent publication. We are not affiliated with or endorsed by the Nepal Premier
          League, the Cricket Association of Nepal or any franchise. We identify teams and competitions for reporting
          purposes. We disclose material conflicts of interest and do not let commercial relationships determine
          coverage.
        </p>

        <h2>Accuracy and verification</h2>
        <p>
          We check factual claims against primary records where available, including official scorecards, recorded ball
          events, competition notices and direct statements. We distinguish confirmed information from estimates,
          opinion and developing reports. Missing player or match information is left unknown rather than guessed.
        </p>
        <p>
          Scores and statistics are attributed to their source on match pages. Statistics are calculated from recorded
          match events. We do not scrape or republish another publication&apos;s reporting, and we do not treat unverified
          social posts as established fact.
        </p>

        <h2>Match reports and automated tools</h2>
        <p>
          Match reports are reviewed by an editor and based on verified match information. We do not publish
          automatically generated match reports as journalism. Software may help calculate statistics, but calculations
          are checked against their underlying score data and are labelled when incomplete or estimated.
        </p>

        <h2>Images, attribution and commercial material</h2>
        <p>
          We use images only when we have permission, a suitable licence or another documented right to publish them.
          Captions and credits identify the creator or source when required. Sponsored or paid material is clearly
          labelled and kept distinct from independent editorial coverage.
        </p>

        <h2>Updates and corrections</h2>
        <p>
          We correct material factual errors promptly and explain significant changes on the affected page. Changes that
          do not alter meaning, such as spelling fixes, may be made without a separate note. See our{" "}
          <Link href="/corrections-policy">corrections policy</Link> for how to report a problem and how we handle it.
        </p>

        <h2>Contact the editors</h2>
        <p>
          Send editorial questions, source material or a conflict-of-interest concern through our{" "}
          <Link href="/contact">contact page</Link>. Please include the page URL and supporting details so we can review
          the issue.
        </p>
      </article>
    </>
  );
}
