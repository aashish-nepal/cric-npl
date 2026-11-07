import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPollBySlug } from "@/services/fan";
import { getSession } from "@/lib/auth/session";
import { loadSite } from "@/services/cricket";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PollCard } from "@/components/fan/poll-card";
import { TeamLogo, PlayerAvatar } from "@/components/cricket/identity";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPollBySlug(slug, null);
  if (!data) return { title: "Poll not found" };
  return {
    title: data.poll.question,
    description: data.poll.description,
    alternates: { canonical: `/polls/${slug}` },
  };
}

export default async function PollPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  const [data, site] = await Promise.all([getPollBySlug(slug, session?.id ?? null), loadSite()]);
  if (!data) notFound();
  const { poll, userVote, totalVotes } = data;
  const teamById = new Map(site.bundle.teams.map((team) => [team.id, team]));
  const playerById = new Map(site.bundle.players.map((player) => [player.id, player]));

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Polls", path: "/polls" }, { name: poll.question, path: `/polls/${poll.slug}` }])} />
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Polls", href: "/polls" }, { label: poll.question }]} />
      </div>
      <div className="container-page grid gap-6 py-4 sm:py-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <header>
            <p className="eyebrow">Fan poll</p>
            <h1 className="mt-1 text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">{poll.question}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{poll.description}</p>
          </header>
          <PollCard poll={poll} userVoteOptionId={userVote?.optionId ?? null} signedIn={Boolean(session)} />
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-bold tracking-tight">Options</h2>
            <ul className="mt-2 space-y-2">
              {poll.options.map((option) => {
                const team = option.teamId ? teamById.get(option.teamId) : null;
                const player = option.playerId ? playerById.get(option.playerId) : null;
                return (
                  <li key={option.id} className="flex items-center gap-2 text-sm">
                    {team ? <TeamLogo team={team} size="xs" /> : null}
                    {player ? <PlayerAvatar player={player} size="xs" /> : null}
                    <span className="flex-1">{option.label}</span>
                    <span className="tabular text-xs text-muted-foreground">{option.voteCount} votes</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-bold tracking-tight">Poll status</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd className="font-semibold capitalize">{poll.status}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Total votes</dt><dd className="font-semibold tabular">{totalVotes}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Closes</dt><dd className="font-semibold">{new Date(poll.closesAt).toLocaleDateString("en-GB", { timeZone: "Asia/Kathmandu" })}</dd></div>
            </dl>
          </section>
          <section className="rounded-lg border border-border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
            <p className="font-semibold text-foreground">How voting works</p>
            <p className="mt-1.5">One vote per signed-in account. Votes are stored against your profile and cannot be changed after submission.</p>
            {!session ? (
              <Link href={`/auth/login?next=/polls/${poll.slug}`} className="mt-2 inline-flex font-semibold text-primary hover:underline">
                Sign in to vote →
              </Link>
            ) : null}
          </section>
        </aside>
      </div>
    </>
  );
}
