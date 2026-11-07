import type { Metadata } from "next";
import Link from "next/link";
import { LogIn, Trophy, UserCircle2 } from "lucide-react";
import { getFanZoneData } from "@/services/fan";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PollCard } from "@/components/fan/poll-card";
import { PredictionCard } from "@/components/fan/prediction-card";
import { TeamLogo } from "@/components/cricket/identity";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { formatKathmanduDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "NPL fan zone",
  description: "Vote in NPL fan polls, predict match results and compete on the supporter leaderboard.",
  alternates: { canonical: "/fan-zone" },
};

export default async function FanZonePage() {
  const session = await getSession();
  const data = await getFanZoneData(session?.id ?? null);
  const voteByPoll = new Map(data.votes.map((vote) => [vote.pollId, vote.optionId]));
  const predictionByMarket = new Map(data.userPredictions.map((row) => [row.predictionId, row.optionId]));

  return (
    <>
      <PageHeader
        eyebrow="Fan engagement"
        title="Fan zone"
        description="Polls, predictions and the supporter leaderboard. Participation is free and virtual — there is no betting or prize element."
        actions={
          session ? (
            <Link href="/polls" className={buttonVariants({ variant: "outline", size: "sm" })}>
              All polls
            </Link>
          ) : (
            <Link href="/auth/login?next=/fan-zone" className={buttonVariants({ size: "sm" })}>
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              Sign in
            </Link>
          )
        }
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Fan zone" }]} />
      </div>

      <div className="container-page grid gap-6 py-6 sm:py-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          {!session ? (
            <section className="rounded-lg border border-primary/20 bg-primary/[0.04] p-5">
              <h2 className="text-base font-bold tracking-tight">Join the fan zone</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Sign in with a demo account to vote, predict and appear on the leaderboard. Your session is stored in a
                signed HttpOnly cookie and no real personal data is required.
              </p>
              <Link href="/auth/login?next=/fan-zone" className={buttonVariants({ size: "sm", className: "mt-3" })}>
                Sign in to participate
              </Link>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 text-lg font-bold tracking-tight">Polls</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  userVoteOptionId={voteByPoll.get(poll.id) ?? null}
                  signedIn={Boolean(session)}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold tracking-tight">Predictions</h2>
            {data.predictions.length === 0 ? (
              <EmptyState title="No prediction markets are open" description="Markets appear ahead of scheduled matches." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.predictions.map(({ prediction, match, teamA, teamB }) => (
                  <div key={prediction.id}>
                    {match && teamA && teamB ? (
                      <p className="mb-1.5 text-[11px] text-muted-foreground">
                        <Link href={`/matches/${match.match.slug}`} className="font-semibold text-foreground hover:text-primary">
                          {teamA.shortName} vs {teamB.shortName}
                        </Link>{" "}
                        · {formatKathmanduDateTime(match.match.scheduledAt)} NPT
                      </p>
                    ) : null}
                    <PredictionCard
                      prediction={prediction}
                      selectedOptionId={predictionByMarket.get(prediction.id) ?? null}
                      signedIn={Boolean(session)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          {session ? (
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
                <UserCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Your profile
              </h2>
              <p className="mt-2 text-sm font-semibold">{session.username}</p>
              <p className="text-xs text-muted-foreground">{session.email}</p>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Role</dt>
                  <dd className="font-semibold capitalize">{session.role.replaceAll("_", " ")}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Points</dt>
                  <dd className="font-semibold tabular">{data.profile?.points ?? 0}</dd>
                </div>
              </dl>
              {data.favouriteTeam ? (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Favourite team</p>
                  <Link href={`/teams/${data.favouriteTeam.slug}`} className="mt-1 flex items-center gap-2 text-xs font-semibold hover:text-primary">
                    <TeamLogo team={data.favouriteTeam} size="xs" />
                    {data.favouriteTeam.name}
                  </Link>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
              <Trophy className="h-4 w-4 text-accent" aria-hidden="true" />
              Supporter leaderboard
            </h2>
            <ol className="mt-3 space-y-2">
              {data.leaderboard.map((user, index) => (
                <li key={user.id} className="flex items-center gap-2 text-xs">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold tabular">{index + 1}</span>
                  <span className="flex-1 truncate font-medium">{user.username}</span>
                  <span className="tabular font-semibold">{user.points}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
              Points are awarded for settled predictions. The leaderboard is a demo feature and resets with the server.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
