import type { Metadata } from "next";
import Link from "next/link";
import { Rss } from "lucide-react";
import { getNewsIndex } from "@/services/content";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NewsIndex } from "@/components/news/news-index";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "NPL news and analysis",
  description: "Independent Nepal Premier League news, match reports, previews, player stories and cricket analysis.",
  alternates: { canonical: "/news", languages: { en: "/news", ne: "/ne/news" } },
};

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ category?: string; tag?: string; page?: string }> }) {
  const { category, tag, page } = await searchParams;
  const data = await getNewsIndex({ categorySlug: category, tag, page: Number(page) || 1 });

  return (
    <>
      <PageHeader
        eyebrow="Editorial"
        title={data.category ? data.category.name : "News & analysis"}
        description={data.category?.description ?? "Independent reporting, match analysis and long-form cricket writing from Nepal."}
        actions={
          <Link href="/news/rss.xml" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Rss className="h-3.5 w-3.5" aria-hidden="true" />
            RSS
          </Link>
        }
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "News" }]} />
      </div>
      <div className="container-page py-6 sm:py-8">
        <NewsIndex data={data} />
      </div>
    </>
  );
}
