import Link from "next/link";
import { Clock3 } from "lucide-react";
import type { NewsArticle, NewsCategory } from "@/types/content";
import { Badge } from "@/components/ui/badge";
import { cn, formatKathmanduDate } from "@/lib/utils";

const gradients = [
  "from-emerald-800 via-emerald-700 to-lime-600",
  "from-slate-800 via-slate-700 to-emerald-700",
  "from-amber-700 via-orange-600 to-rose-600",
  "from-sky-800 via-cyan-700 to-teal-600",
  "from-violet-800 via-purple-700 to-fuchsia-600",
];

function gradientFor(slug: string): string {
  let hash = 0;
  for (let index = 0; index < slug.length; index += 1) hash = (hash * 31 + slug.charCodeAt(index)) >>> 0;
  return gradients[hash % gradients.length] ?? gradients[0]!;
}

export function ArticleCard({
  article,
  category,
  variant = "default",
  className,
}: {
  article: NewsArticle;
  category?: NewsCategory | null;
  variant?: "default" | "featured" | "compact" | "list";
  className?: string;
}) {
  const href = `/news/${article.slug}`;

  if (variant === "compact") {
    return (
      <Link href={href} className={cn("group flex gap-3 py-3", className)}>
        <span
          aria-hidden="true"
          className={cn(
            "flex h-14 w-20 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-[10px] font-bold uppercase tracking-wider text-white/80",
            gradientFor(article.slug),
          )}
        >
          NPL
        </span>
        <span className="min-w-0">
          <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
            {article.title}
          </span>
          <span className="mt-1 block text-[11px] text-muted-foreground">
            {article.readingMinutes} min read · {formatKathmanduDate(article.publishedAt ?? article.updatedAt)}
          </span>
        </span>
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <article className={cn("group flex flex-col gap-4 border-b border-border py-5 last:border-0 sm:flex-row", className)}>
        <Link
          href={href}
          aria-hidden="true"
          tabIndex={-1}
          className={cn(
            "flex h-32 shrink-0 items-end rounded-lg bg-gradient-to-br p-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 sm:h-28 sm:w-44",
            gradientFor(article.slug),
          )}
        >
          {category?.name ?? "NPL"}
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {category ? <Badge variant="secondary">{category.name}</Badge> : null}
            <span>{formatKathmanduDate(article.publishedAt ?? article.updatedAt)}</span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              {article.readingMinutes} min
            </span>
          </div>
          <h3 className="mt-2 text-lg font-bold leading-snug tracking-tight">
            <Link href={href} className="group-hover:text-primary">
              {article.title}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>
        </div>
      </article>
    );
  }

  if (variant === "featured") {
    return (
      <article className={cn("group relative overflow-hidden rounded-xl border border-border", className)}>
        <Link href={href} className="block">
          <div
            className={cn(
              "relative flex min-h-[280px] flex-col justify-end bg-gradient-to-br p-6 text-white sm:min-h-[340px] sm:p-8",
              gradientFor(article.slug),
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_85%_0%,rgba(255,255,255,0.18),transparent_55%)]" aria-hidden="true" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/75">
                {category ? <span className="rounded-full bg-white/15 px-2 py-0.5">{category.name}</span> : null}
                <span>{formatKathmanduDate(article.publishedAt ?? article.updatedAt)}</span>
              </div>
              <h2 className="mt-3 max-w-2xl text-balance text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                {article.title}
              </h2>
              <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-white/75">{article.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent">
                Read the story →
              </span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className={cn("group flex flex-col overflow-hidden rounded-lg border border-border bg-card", className)}>
      <Link
        href={href}
        aria-hidden="true"
        tabIndex={-1}
        className={cn(
          "flex h-36 items-end bg-gradient-to-br p-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75",
          gradientFor(article.slug),
        )}
      >
        {category?.name ?? "NPL"}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>{formatKathmanduDate(article.publishedAt ?? article.updatedAt)}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" aria-hidden="true" />
            {article.readingMinutes} min
          </span>
        </div>
        <h3 className="mt-2 text-base font-bold leading-snug tracking-tight">
          <Link href={href} className="group-hover:text-primary">
            {article.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>
        <p className="mt-3 text-[11px] font-medium text-muted-foreground">{article.authorName}</p>
      </div>
    </article>
  );
}
