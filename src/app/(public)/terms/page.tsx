import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms that apply to using NPL Cricket Hub, including acceptable use and data disclaimers.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of use"
        description="By using NPL Cricket Hub you agree to these terms. They are written for the demo build and must be reviewed by a publisher before launch."
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Terms of use" }]} />
      </div>
      <div className="container-page py-6 sm:py-8">
        <div className="prose-editorial max-w-3xl">
          <h2>1. The service</h2>
          <p>
            NPL Cricket Hub provides cricket scores, statistics, editorial content and fan participation features. The
            service is independent and is not affiliated with the Nepal Premier League, the Cricket Association of Nepal
            or any franchise.
          </p>

          <h2>2. Accuracy and availability</h2>
          <p>
            We aim to be accurate and timely, but scores and statistics may contain errors, be delayed or be unavailable.
            The service is provided “as is” without warranties of any kind. Always verify official results with the
            competition organiser before relying on them for a material decision.
          </p>

          <h2>3. No betting or financial advice</h2>
          <p>
            Nothing on this site is betting advice, odds, a tip or a financial recommendation. Polls and predictions are
            free, virtual entertainment features and carry no prize or wagering element.
          </p>

          <h2>4. Acceptable use</h2>
          <ul>
            <li>Do not attempt to gain unauthorised access to the admin console, database or other users&apos; accounts.</li>
            <li>Do not post unlawful, abusive, hateful, spam or misleading content in comments.</li>
            <li>Do not scrape the service at a rate that degrades availability, or circumvent rate limits.</li>
            <li>Do not use the service to distribute malware or to infringe intellectual property rights.</li>
          </ul>

          <h2>5. User content</h2>
          <p>
            You retain ownership of comments you post and grant us a non-exclusive licence to store, display and moderate
            them. We may remove content that breaches these terms. Comments are moderated before publication.
          </p>

          <h2>6. Intellectual property</h2>
          <p>
            Original editorial content, design and software are protected by copyright. Team and competition names are
            used for identification only. Third-party marks remain the property of their owners.
          </p>

          <h2>7. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, we are not liable for indirect or consequential loss arising from use
            of the service, including reliance on a score, statistic or article.
          </p>

          <h2>8. Changes and contact</h2>
          <p>
            We may update these terms; the revised version will be posted here. Questions can be sent through the{" "}
            <Link href="/contact">contact page</Link>.
          </p>

          <p><em>Effective date: 7 November 2026. Demo terms — review before production launch.</em></p>
        </div>
      </div>
    </>
  );
}
