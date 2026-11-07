import { getRepository } from "@/lib/data";
import { requirePermission } from "@/lib/auth/session";
import { AdminPageHeading, FlashMessages } from "@/components/admin/page-heading";
import { ArticleForm } from "@/components/admin/article-form";

export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("news.manage");
  const [{ error }, categories] = await Promise.all([searchParams, getRepository().getNewsCategories()]);

  return (
    <>
      <AdminPageHeading
        title="New article"
        description="Write and publish independent NPL coverage. The article stays private until its status is published."
        backHref="/admin/news"
        backLabel="Editorial"
      />
      <FlashMessages error={error} />
      <ArticleForm categories={categories} />
    </>
  );
}
