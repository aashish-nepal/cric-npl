import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMatchCentre } from "@/services/cricket";
import { MatchCentre } from "@/components/match/match-centre";

export const metadata: Metadata = {
  title: "Live match centre",
  description: "Live NPL scorecard, ball-by-ball commentary and partnerships.",
  robots: { index: false, follow: true },
};

export default async function LiveMatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getMatchCentre(slug);
  if (!data) notFound();
  return <MatchCentre data={data} />;
}
