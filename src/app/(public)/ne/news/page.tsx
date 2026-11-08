import type { Metadata } from "next";
import { getNewsIndex } from "@/services/content";
import { NepaliPage, NepaliEnglishLink } from "@/components/layout/nepali-page";
import { NewsIndex } from "@/components/news/news-index";

export const metadata: Metadata = {
  title: "समाचार — नेपाल प्रिमियर लिग",
  description: "नेपाल प्रिमियर लिगका समाचार, म्याच रिपोर्ट, पूर्वावलोकन र विश्लेषण।",
  alternates: { canonical: "/ne/news", languages: { en: "/news", ne: "/ne/news" } },
};

export default async function NepaliNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; page?: string }>;
}) {
  const { category, tag, page } = await searchParams;
  const data = await getNewsIndex({ categorySlug: category, tag, page: Number(page) || 1 });

  return (
    <NepaliPage
      title={data.category ? data.category.name : "समाचार र विश्लेषण"}
      description="सम्पादकीय टोलीद्वारा प्रकाशित समाचार। लेखहरू अंग्रेजीमा उपलब्ध छन्।"
      eyebrow="सम्पादकीय"
      actions={<NepaliEnglishLink href="/news" />}
    >
      <NewsIndex data={data} basePath="/ne/news" />
    </NepaliPage>
  );
}
