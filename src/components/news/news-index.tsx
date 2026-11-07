import Link from "next/link";
import type { NewsIndexData } from "@/services/content";
import { ArticleCard } from "./article-card";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

export function NewsIndex({ data, basePath = "/news" }: { data: NewsIndexData; basePath?: string }) {
  const { articles, categories, featured, category, page, totalPages } = data;
  const list = articles.filter((article) => article.id !== featured?.id || page > 1);
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category.slug);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return `${basePath}${query ? `?${query}` : ""}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-1.5" role="navigation" aria-label="News categories">
        <Link
          href={basePath}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-semibold",
            !category ? "border-primary bg-primary text-white" : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
          )}
        >
          All news
        </Link>
        {categories.map((row) => (
          <Link
            key={row.id}
            href={`${basePath}?category=${row.slug}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold",
              category?.id === row.id
                ? "border-primary bg-primary text-white"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
            )}
          >
            {row.name}
          </Link>
        ))}
      </div>

      {featured && page === 1 ? (
        <ArticleCard article={featured} category={categories.find((row) => row.id === featured.categoryId)} variant="featured" />
      ) : null}

      {list.length === 0 && !featured ? (
        <EmptyState title="No stories yet" description="Published articles will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((article) => (
            <ArticleCard key={article.id} article={article} category={categories.find((row) => row.id === article.categoryId)} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary/40">
              Previous
            </Link>
          ) : null}
          {Array.from({ length: totalPages }).map((_, index) => {
            const target = index + 1;
            return (
              <Link
                key={target}
                href={pageHref(target)}
                aria-current={target === page ? "page" : undefined}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-semibold",
                  target === page ? "border-primary bg-primary text-white" : "border-border hover:border-primary/40",
                )}
              >
                {target}
              </Link>
            );
          })}
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary/40">
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
