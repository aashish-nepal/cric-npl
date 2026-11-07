import type { Metadata } from "next";
import { Mail, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact NPL Cricket Hub about editorial, data corrections, accessibility or partnerships.",
  alternates: { canonical: "/contact" },
};

const channels = [
  {
    title: "Editorial",
    email: "editorial@nplcrickethub.local",
    description: "Story tips, interviews, press access and general editorial enquiries.",
  },
  {
    title: "Data corrections",
    email: "data@nplcrickethub.local",
    description: "Report a scorecard, statistic or standings error. Include the match URL and the correction.",
  },
  {
    title: "Accessibility",
    email: "access@nplcrickethub.local",
    description: "Tell us about a barrier you encountered so we can fix it.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        description="We read every message. For corrections, please include the page URL and, where possible, a source we can verify."
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Contact" }]} />
      </div>
      <div className="container-page grid gap-6 py-6 sm:py-8 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {channels.map((channel) => (
            <section key={channel.title} className="rounded-lg border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 text-base font-bold tracking-tight">
                <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                {channel.title}
              </h2>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{channel.description}</p>
              <a
                href={`mailto:${channel.email}?subject=${encodeURIComponent(`[NPL Cricket Hub] ${channel.title}`)}`}
                className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
              >
                {channel.email}
              </a>
            </section>
          ))}
          <section className="rounded-lg border border-border bg-card p-5 sm:col-span-2">
            <h2 className="flex items-center gap-2 text-base font-bold tracking-tight">
              <ShieldAlert className="h-4 w-4 text-primary" aria-hidden="true" />
              Before you write
            </h2>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
              <li>• For a data correction, include the match or player URL and the exact figure that is wrong.</li>
              <li>• We cannot accept requests to change official results or statistics without verification.</li>
              <li>• We do not publish unsolicited commercial links or betting promotions.</li>
              <li>• This demo build uses example email addresses; a production deployment must replace them.</li>
            </ul>
          </section>
        </div>
        <aside className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
            <p className="font-semibold text-foreground">Response times</p>
            <p className="mt-1.5">Editorial and data enquiries are usually reviewed within two working days.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
            <p className="font-semibold text-foreground">Independence</p>
            <p className="mt-1.5">NPL Cricket Hub is not affiliated with the NPL, CAN or any franchise. We cannot forward messages to them.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
