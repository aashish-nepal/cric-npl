import Link from "next/link";
import { Archive, FilePlus2, Pencil } from "lucide-react";
import type { ArticleStatus } from "@/types/cricket";
import { getAdminOverview } from "@/services/admin";
import { requirePermission } from "@/lib/auth/session";
import { archiveArticleAction } from "@/app/actions/admin";
import { AdminPageHeading, FlashMessages } from "@/components/admin/page-heading";
import { ConfirmSubmitButton } from "@/components/admin/submit-button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatKathmanduDate } from "@/lib/utils";

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
];

function statusVariant(status: ArticleStatus) {
  if (status === "published") return "success" as const;
  if (status === "scheduled") return "accent" as const;
  if (status === "archived") return "secondary" as const;
  return "outline" as const;
}

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; message?: string; error?: string }>;
}) {
  await requirePermission("news.manage");
  const [{ status, message, error }, overview] = await Promise.all([searchParams, getAdminOverview()]);
  const categoryById = new Map(overview.categories.map((category) => [category.id, category]));
  const filtered = status ? overview.articles.filter((article) => article.status === status) : overview.articles;

  return (
    <>
      <AdminPageHeading
        title="Editorial"
        description="Draft, schedule and publish independent NPL coverage. Archived articles remain accessible by direct URL."
        actions={
          <Link href="/admin/news/new" className={buttonVariants({ size: "sm" })}>
            <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
            New article
          </Link>
        }
      />
      <FlashMessages message={message} error={error} />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => {
          const active = (status ?? "") === filter.value;
          const count =
            filter.value === "" ? overview.articles.length : overview.articles.filter((row) => row.status === filter.value).length;
          return (
            <Link
              key={filter.value || "all"}
              href={filter.value ? `/admin/news?status=${filter.value}` : "/admin/news"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
                active ? "border-primary bg-primary text-white" : "border-border bg-surface hover:bg-muted",
              )}
            >
              {filter.label}
              <span className={cn("tabular text-[10px]", active ? "text-white/70" : "text-muted-foreground")}>{count}</span>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No articles in this view"
          description="Create an article or change the status filter."
          action={
            <Link href="/admin/news/new" className={buttonVariants({ size: "sm" })}>
              <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" /> New article
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Headline</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <div className="min-w-[220px]">
                      <p className="line-clamp-2 text-xs font-semibold">{article.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {article.authorName} · {article.readingMinutes} min read
                        {article.featured ? " · Featured" : ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {categoryById.get(article.categoryId)?.name ?? "Uncategorised"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={statusVariant(article.status)}>{article.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
                    {formatKathmanduDate(article.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/news/${article.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                        aria-label={`Edit ${article.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </Link>
                      {article.status !== "archived" ? (
                        <form action={archiveArticleAction}>
                          <input type="hidden" name="articleId" value={article.id} />
                          <ConfirmSubmitButton
                            variant="ghost"
                            size="sm"
                            confirm={`Archive “${article.title}”? It will be removed from public listings.`}
                            aria-label={`Archive ${article.title}`}
                          >
                            <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
