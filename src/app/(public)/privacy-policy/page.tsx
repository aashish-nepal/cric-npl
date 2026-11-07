import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How NPL Cricket Hub handles account, cookie and usage data.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy"
        description="This policy explains what the platform stores, why, and how to exercise your rights. It is written for the demo build and must be reviewed by a publisher before launch."
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Privacy policy" }]} />
      </div>
      <div className="container-page py-6 sm:py-8">
        <div className="prose-editorial max-w-3xl">
          <h2>What we collect</h2>
          <ul>
            <li><strong>Account data:</strong> email address, username, role and, optionally, a favourite team.</li>
            <li><strong>Participation data:</strong> poll votes, predictions, comments and bookmarks linked to your account.</li>
            <li><strong>Technical data:</strong> standard server logs such as IP address, user agent and requested URL, retained for security and abuse prevention.</li>
            <li><strong>Local storage:</strong> recent search terms are stored in your browser only and can be cleared at any time.</li>
          </ul>

          <h2>Cookies</h2>
          <p>
            A signed HttpOnly session cookie keeps you signed in. In Supabase mode, authentication cookies are set by the
            Supabase client. We do not use advertising cookies. If analytics are enabled in a deployment, they must be
            disclosed here before launch.
          </p>

          <h2>How we use data</h2>
          <p>
            Account data is used to authenticate you, attribute comments and predictions, moderate the community and
            prevent abuse. Aggregated poll results contain no personal identifiers.
          </p>

          <h2>Legal bases and retention</h2>
          <p>
            Where GDPR or similar law applies, processing relies on legitimate interests (operating and securing the
            service) and, for optional participation features, your consent. Account and participation data is retained
            while your account exists and for a reasonable period afterwards to resolve disputes.
          </p>

          <h2>Sharing</h2>
          <p>
            We use infrastructure providers for hosting and authentication. We do not sell personal data. We may disclose
            data where required by law or to protect the rights and safety of users.
          </p>

          <h2>Your rights</h2>
          <p>
            You can request access, correction, export or deletion of your account data by contacting{" "}
            <Link href="/contact">the team</Link>. You may also clear local search history in your browser settings.
          </p>

          <h2>Children</h2>
          <p>
            The service is intended for a general cricket audience. If you are below the age at which you can consent to
            data processing in your jurisdiction, use the site with a parent or guardian.
          </p>

          <h2>Changes</h2>
          <p>Material changes to this policy will be posted on this page with a revised effective date.</p>

          <p><em>Effective date: 7 November 2026. Demo policy — review before production launch.</em></p>
        </div>
      </div>
    </>
  );
}
