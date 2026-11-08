import { notFound } from "next/navigation";
import { getRepository } from "@/lib/data";
import { requirePermission } from "@/lib/auth/session";
import { getAdminArticle } from "@/services/admin";
import { AdminPageHeading, FlashMessages } from "@/components/admin/page-heading";
import { ArticleForm } from "@/components/admin/article-form";

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  await requirePermission("news.manage");
  const [{ id }, { message, error }] = await Promise.all([params, searchParams]);
  const repository = getRepository();
  const [article, categories, revisions] = await Promise.all([
    getAdminArticle(id),
    repository.getNewsCategories(),
    repository.getArticleRevisions(id),
  ]);
  if (!article) notFound();

  return (
    <>
      <AdminPageHeading
        title="Edit article"
        description={`Last updated ${new Date(article.updatedAt).toLocaleString("en-GB", { timeZone: "Asia/Kathmandu" })} NPT`}
        backHref="/admin/news"
        backLabel="Editorial"
      />
      <FlashMessages message={message} error={error} />
      <ArticleForm article={article} categories={categories} />
      <section className="mt-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-bold tracking-tight">Revision history</h2>
        {revisions.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            No revisions recorded yet. A snapshot is saved automatically on the next edit.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-border">
            {revisions.slice(0, 12).map((revision) => (
              <li key={revision.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                <span className="font-medium">{revision.title}</span>
                <span className="text-muted-foreground">
                  {revision.status} ·{" "}
                  {new Date(revision.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Kathmandu" })} NPT
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
