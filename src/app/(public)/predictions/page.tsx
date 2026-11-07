import type { Metadata } from "next";
import Link from "next/link";
import { getFanZoneData } from "@/services/fan";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PredictionCard } from "@/components/fan/prediction-card";
import { EmptyState } from "@/components/ui/feedback";
import { formatKathmanduDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "NPL predictions",
  description: "Predict Nepal Premier League match winners and player-of-the-match performances, and track your points.",
  alternates: { canonical: "/predictions" },
};

export default async function PredictionsPage() {
  const session = await getSession();
  const data = await getFanZoneData(session?.id ?? null);
  const selectedByMarket = new Map(data.userPredictions.map((row) => [row.predictionId, row.optionId]));

  const groups = new Map<string, typeof data.predictions>();
  for (const row of data.predictions) {
    const key = row.match?.match.id ?? "other";
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }

  return (
    <>
      <PageHeader
        eyebrow="Fan engagement"
        title="Predictions"
        description="Call the result before the first ball. Markets close at the scheduled start time. Points are awarded after settlement."
        actions={
          <Link href="/fan-zone" className="text-xs font-semibold text-primary hover:underline">
            Fan zone →
          </Link>
        }
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Predictions" }]} />
      </div>
      <div className="container-page py-6 sm:py-8">
        {data.predictions.length === 0 ? (
          <EmptyState title="No open markets" description="Prediction markets are published ahead of upcoming fixtures." />
        ) : (
          <div className="space-y-8">
            {[...groups.entries()].map(([matchId, rows]) => {
              const match = rows[0]?.match ?? null;
              return (
                <section key={matchId}>
                  {match ? (
                    <div className="mb-3">
                      <h2 className="text-lg font-bold tracking-tight">
                        <Link href={`/matches/${match.match.slug}`} className="hover:text-primary">
                          {match.teamA.name} vs {match.teamB.name}
                        </Link>
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Match {match.match.matchNumber} · {formatKathmanduDateTime(match.match.scheduledAt)} NPT · {match.venue.name}
                      </p>
                    </div>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {rows.map(({ prediction }) => (
                      <PredictionCard
                        key={prediction.id}
                        prediction={prediction}
                        selectedOptionId={selectedByMarket.get(prediction.id) ?? null}
                        signedIn={Boolean(session)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
        {!session ? (
          <p className="mt-6 text-xs text-muted-foreground">
            <Link href="/auth/login?next=/predictions" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>{" "}
            to submit predictions. You can browse markets without an account.
          </p>
        ) : null}
      </div>
    </>
  );
}
