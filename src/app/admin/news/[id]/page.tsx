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
  const [article, categories] = await Promise.all([getAdminArticle(id), getRepository().getNewsCategories()]);
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
    </>
  );
}
