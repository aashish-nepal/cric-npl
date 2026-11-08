import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/section-header";

export const metadata: Metadata = {
  title: "Corrections Policy",
  description:
    "How to report an error in NPL Cricket Hub coverage or match data, and how corrections are reviewed and displayed.",
  alternates: { canonical: "/corrections-policy" },
};

export default function CorrectionsPolicyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Accuracy and accountability"
        title="Corrections policy"
        description="How we review and correct errors in our reporting, scorecards and statistics."
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Corrections policy" }]} />
      </div>
      <article className="container-page prose-editorial max-w-3xl py-6 sm:py-8">
        <h2>Tell us what is wrong</h2>
        <p>
          If you find a factual error, contact us using the address shown on our{" "}
          <Link href="/contact">contact page</Link>. Include the page URL, the passage or figure you believe is wrong,
          the proposed correction and a source we can check. For scorecards, include the match and innings, and link an
          official record or another verifiable primary source when one is available.
        </p>

        <h2>How we review a request</h2>
        <p>
          An editor reviews the claim against available source material and may ask for more information. We give
          particular weight to official competition records, original match records and direct confirmation from a
          relevant source. A request alone does not establish that a published result or statistic is wrong.
        </p>
        <p>
          If we cannot verify a requested change, we will not present it as fact. When the available evidence remains
          incomplete, we may explain that uncertainty on the page while we continue checking.
        </p>

        <h2>How we publish corrections</h2>
        <p>
          We correct verified errors as soon as reasonably possible. When a correction materially changes an article or
          a published match record, we add a note describing what changed and update the page&apos;s revision time. Minor
          typographical or formatting fixes that do not change meaning do not normally receive a separate note.
        </p>
        <p>
          Scorecard corrections are checked against the underlying match record and recorded through the authorised
          scoring workflow, which retains an audit history. A correction request does not directly change a score,
          player statistic or competition result.
        </p>

        <h2>Updates are not corrections</h2>
        <p>
          New information, a later result or a changed schedule may be added as an update. We label a correction when
          we are fixing information that was inaccurate when it was published.
        </p>

        <h2>Follow-up</h2>
        <p>
          We aim to acknowledge requests within two working days where contact details are available. Review time can
          vary with the evidence and the source involved. We may be unable to reply to anonymous requests, but we still
          review specific, verifiable information.
        </p>
      </article>
    </>
  );
}
