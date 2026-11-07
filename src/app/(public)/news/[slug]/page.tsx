import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, Rss } from "lucide-react";
import { getArticlePage } from "@/services/content";
import { getSession } from "@/lib/auth/session";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ArticleCard } from "@/components/news/article-card";
import { MarkdownBody } from "@/components/news/markdown-body";
import { CommentForm } from "@/components/news/comment-form";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { formatKathmanduDate, relativeTime } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getArticlePage(slug);
  if (!data) return { title: "Article not found" };
  const { article, category } = data;
  return {
    title: article.seoTitle ?? article.title,
    description: article.metaDescription ?? article.excerpt,
    alternates: { canonical: article.canonicalUrl ?? `/news/${slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.metaDescription ?? article.excerpt,
      url: absoluteUrl(`/news/${slug}`),
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
      authors: [article.authorName],
      tags: article.tags,
      section: category?.name,
    },
    twitter: { card: "summary_large_image", title: article.title, description: article.excerpt },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, session] = await Promise.all([getArticlePage(slug), getSession()]);
  if (!data) notFound();
  const { article, category, related, comments, newer, older } = data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.metaDescription ?? article.excerpt,
    datePublished: article.publishedAt ?? article.updatedAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: article.authorName },
    publisher: { "@type": "Organization", name: "NPL Cricket Hub", url: absoluteUrl("/") },
    mainEntityOfPage: absoluteUrl(`/news/${article.slug}`),
    articleSection: category?.name,
    keywords: article.tags.join(", "),
    isAccessibleForFree: true,
  };

  return (
    <>
      <JsonLd data={[jsonLd, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "News", path: "/news" }, { name: article.title, path: `/news/${article.slug}` }])]} />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "News", href: "/news" }, ...(category ? [{ label: category.name, href: `/news/category/${category.slug}` }] : []), { label: article.title }]} />
      </div>
      <article className="container-page grid gap-8 py-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:py-8">
        <div className="min-w-0">
          <header className="border-b border-border pb-6">
            <div className="flex flex-wrap items-center gap-2">
              {category ? <Badge variant="default">{category.name}</Badge> : null}
              {article.featured ? <Badge variant="accent">Featured</Badge> : null}
            </div>
            <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{article.title}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{article.excerpt}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{article.authorName}</span>
              <span>{formatKathmanduDate(article.publishedAt ?? article.updatedAt)}</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {article.readingMinutes} min read
              </span>
              {article.publishedAt ? <span>Updated {relativeTime(article.updatedAt)}</span> : null}
            </div>
          </header>

          <div className="mt-6">
            <MarkdownBody body={article.body} />
          </div>

          {article.tags.length > 0 ? (
            <div className="mt-8 flex flex-wrap items-center gap-1.5 border-t border-border pt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</span>
              {article.tags.map((tag) => (
                <Link key={tag} href={`/news?tag=${encodeURIComponent(tag)}`} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-primary">
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}

          <nav aria-label="Article navigation" className="mt-6 grid gap-3 border-y border-border py-4 sm:grid-cols-2">
            {newer ? (
              <Link href={`/news/${newer.slug}`} className="group">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Newer</span>
                <span className="mt-1 block text-sm font-semibold group-hover:text-primary">{newer.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {older ? (
              <Link href={`/news/${older.slug}`} className="group sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Older</span>
                <span className="mt-1 block text-sm font-semibold group-hover:text-primary">{older.title}</span>
              </Link>
            ) : null}
          </nav>

          <section aria-labelledby="comments-heading" className="mt-8">
            <h2 id="comments-heading" className="text-lg font-bold tracking-tight">
              Discussion ({comments.length})
            </h2>
            <div className="mt-3 space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approved comments yet. Be the first to add one.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold">{comment.username}</p>
                      <p className="text-[10px] text-muted-foreground">{relativeTime(comment.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-foreground/85">{comment.body}</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <CommentForm articleId={article.id} slug={article.slug} signedIn={Boolean(session)} />
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section>
            <h2 className="mb-3 text-sm font-bold tracking-tight">Related reading</h2>
            {related.length === 0 ? (
              <p className="text-xs text-muted-foreground">No related stories yet.</p>
            ) : (
              <div className="space-y-1 divide-y divide-border">
                {related.map((row) => (
                  <ArticleCard key={row.id} article={row} variant="compact" />
                ))}
              </div>
            )}
          </section>
          <section className="rounded-lg border border-border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
            <p className="font-semibold text-foreground">Editorial standards</p>
            <p className="mt-1.5">
              This article is independent editorial content. Corrections are noted at the foot of the piece. Read our{" "}
              <Link href="/about#editorial-policy" className="font-semibold text-primary hover:underline">
                editorial policy
              </Link>
              .
            </p>
            <Link href="/news/rss.xml" className="mt-2 inline-flex items-center gap-1 font-semibold text-primary hover:underline">
              <Rss className="h-3 w-3" aria-hidden="true" />
              Subscribe via RSS
            </Link>
          </section>
        </aside>
      </article>
    </>
  );
}
