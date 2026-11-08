import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/section-header";

export function NepaliPage({
  title,
  description,
  eyebrow = "नेपाल प्रिमियर लिग",
  actions,
  children,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
      <div className="container-page py-6 sm:py-8">{children}</div>
    </>
  );
}

export function NepaliEnglishLink({ href }: { href: string }) {
  return (
    <Link href={href} hrefLang="en" lang="en" className="text-xs font-semibold text-primary hover:underline">
      Read in English →
    </Link>
  );
}
