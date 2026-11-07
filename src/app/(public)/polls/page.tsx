import type { Metadata } from "next";
import Link from "next/link";
import { getRepository } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/section-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PollCard } from "@/components/fan/poll-card";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = {
  title: "NPL fan polls",
  description: "Have your say on the Nepal Premier League. Vote in open fan polls and see how supporters are voting.",
  alternates: { canonical: "/polls" },
};

export default async function PollsPage() {
  const [session, polls] = await Promise.all([getSession(), getRepository().getPolls()]);
  const votes = session ? await getRepository().getFanVotes(session.id) : [];
  const voteByPoll = new Map(votes.map((vote) => [vote.pollId, vote.optionId]));

  return (
    <>
      <PageHeader
        eyebrow="Fan engagement"
        title="Polls"
        description="Open supporter polls. Voting is free, virtual and limited to one vote per account per poll."
      />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Polls" }]} />
      </div>
      <div className="container-page py-6 sm:py-8">
        {polls.length === 0 ? (
          <EmptyState title="No polls are open" description="New polls are published around marquee fixtures." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {polls.map((poll) => (
              <div key={poll.id} className="space-y-2">
                <PollCard
                  poll={poll}
                  userVoteOptionId={voteByPoll.get(poll.id) ?? null}
                  signedIn={Boolean(session)}
                />
                <Link href={`/polls/${poll.slug}`} className="inline-flex text-xs font-semibold text-primary hover:underline">
                  Open poll page →
                </Link>
              </div>
            ))}
          </div>
        )}
        <p className="mt-6 text-xs text-muted-foreground">
          Polls are for entertainment only. They are not scientific surveys and carry no betting or prize element.
        </p>
      </div>
    </>
  );
}
