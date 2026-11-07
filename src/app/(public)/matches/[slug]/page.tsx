import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMatchCentre } from "@/services/cricket";
import { MatchCentre } from "@/components/match/match-centre";
import { absoluteUrl } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getMatchCentre(slug);
  if (!data) return { title: "Match not found" };
  const { computed, season } = data;
  const title = `${computed.teamA.name} vs ${computed.teamB.name} — ${season.name} match ${computed.match.matchNumber}`;
  const description =
    computed.match.resultSummary ??
    (computed.match.status === "live"
      ? `Live score: ${computed.statusText}. Ball-by-ball commentary, scorecard and partnerships.`
      : `Fixture details, squads and scorecard for ${computed.teamA.name} vs ${computed.teamB.name} at ${computed.venue.name}.`);
  return {
    title,
    description,
    alternates: { canonical: `/matches/${slug}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/matches/${slug}`),
      type: "article",
    },
  };
}

export default async function MatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getMatchCentre(slug);
  if (!data) notFound();
  return <MatchCentre data={data} />;
}
