"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Poll } from "@/types/content";
import { voteAction } from "@/app/actions/fan";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";

export function PollCard({
  poll,
  userVoteOptionId,
  signedIn,
  compact = false,
}: {
  poll: Poll;
  userVoteOptionId: string | null;
  signedIn: boolean;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(voteAction, initialActionState);
  const hasVoted = Boolean(userVoteOptionId);
  const showResults = hasVoted || !signedIn || poll.status === "closed" || state.ok;
  const closed = poll.status === "closed" || new Date(poll.closesAt) < new Date();

  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", compact && "p-3")}>
      <div className="flex items-start justify-between gap-2">
        <h3 className={cn("font-bold tracking-tight", compact ? "text-sm" : "text-base")}>{poll.question}</h3>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {closed ? "Closed" : "Open"}
        </span>
      </div>
      {!compact ? <p className="mt-1 text-xs text-muted-foreground">{poll.description}</p> : null}

      {showResults ? (
        <ul className="mt-3 space-y-2.5">
          {poll.options.map((option) => {
            const percentage = poll.totalVotes > 0 ? (option.voteCount / poll.totalVotes) * 100 : 0;
            const mine = option.id === userVoteOptionId;
            return (
              <li key={option.id}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className={cn("truncate", mine ? "font-bold text-primary" : "text-foreground/85")}>
                    {option.label}
                    {mine ? <span className="ml-1 text-[10px] uppercase tracking-wider">· your vote</span> : null}
                  </span>
                  <span className="tabular shrink-0 font-semibold">{formatNumber(percentage, 1)}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted" role="presentation">
                  <div
                    className={cn("h-full rounded-full", mine ? "bg-primary" : "bg-primary/40")}
                    style={{ width: `${Math.max(1, percentage)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <form action={formAction} className="mt-3 space-y-2">
          <input type="hidden" name="pollId" value={poll.id} />
          <input type="hidden" name="slug" value={poll.slug} />
          {poll.options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-primary/40 hover:bg-primary/[0.02]"
            >
              <input type="radio" name="optionId" value={option.id} required className="h-4 w-4 accent-[var(--primary)]" />
              <span className="min-w-0 truncate">{option.label}</span>
            </label>
          ))}
          <Button type="submit" size="sm" className="w-full" disabled={pending || closed}>
            {pending ? "Submitting…" : closed ? "Poll closed" : "Vote"}
          </Button>
        </form>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
        <span className="tabular">{poll.totalVotes.toLocaleString("en-GB")} votes</span>
        {!signedIn ? (
          <Link href={`/auth/login?next=/polls/${poll.slug}`} className="font-semibold text-primary hover:underline">
            Sign in to vote
          </Link>
        ) : hasVoted ? (
          <span>Thanks for voting</span>
        ) : null}
      </div>
      {state.message ? (
        <p role="status" className={cn("mt-2 text-xs", state.ok ? "text-green-700" : "text-red-700")}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
