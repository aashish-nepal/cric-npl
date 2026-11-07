import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { GUIDES, getGuide } from "@/constants/guides";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MarkdownBody } from "@/components/news/markdown-body";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { formatKathmanduDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide not found" };
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${slug}` },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }, { name: guide.title, path: `/guides/${slug}` }])} />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Guides", href: "/guides" }, { label: guide.title }]} />
      </div>
      <article className="container-page grid gap-8 py-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:py-8">
        <div className="min-w-0">
          <header className="border-b border-border pb-5">
            <p className="eyebrow">Cricket guide</p>
            <h1 className="mt-1 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">{guide.title}</h1>
            <p className="mt-2 text-base leading-7 text-muted-foreground">{guide.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">Updated {formatKathmanduDate(guide.updatedAt)}</p>
          </header>
          <div className="mt-6">
            <MarkdownBody body={guide.body} />
          </div>
        </div>
        <aside>
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
              <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              More guides
            </h2>
            <ul className="mt-2 space-y-2">
              {GUIDES.filter((row) => row.slug !== guide.slug).map((row) => (
                <li key={row.slug}>
                  <Link href={`/guides/${row.slug}`} className="text-xs font-medium text-primary hover:underline">
                    {row.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </article>
    </>
  );
}
