import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNewsIndex } from "@/services/content";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NewsIndex } from "@/components/news/news-index";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getNewsIndex({ categorySlug: slug });
  return {
    title: data.category ? `${data.category.name} news` : "News category",
    description: data.category?.description ?? "NPL news and analysis.",
    alternates: { canonical: `/news/category/${slug}` },
  };
}

export default async function NewsCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const [{ slug }, { page, tag }] = await Promise.all([params, searchParams]);
  const data = await getNewsIndex({ categorySlug: slug, tag, page: Number(page) || 1 });
  if (!data.category) notFound();
  return (
    <>
      <PageHeader eyebrow="Category" title={data.category.name} description={data.category.description} />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "News", href: "/news" }, { label: data.category.name }]} />
      </div>
      <div className="container-page py-6 sm:py-8">
        <NewsIndex data={data} basePath={`/news/category/${slug}`} />
      </div>
    </>
  );
}
