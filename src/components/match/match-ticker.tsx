import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MatchComputed } from "@/types/cricket";
import { MatchCard } from "./match-card";
import { cn } from "@/lib/utils";

export function MatchTicker({
  matches,
  seasonName,
  title,
  emptyLabel,
  className,
}: {
  matches: MatchComputed[];
  seasonName?: string;
  title: string;
  emptyLabel: string;
  className?: string;
}) {
  return (
    <section aria-label={title} className={cn("border-b border-border bg-surface", className)}>
      <div className="container-page py-3">
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <span className="live-dot h-2 w-2 rounded-full bg-live" aria-hidden="true" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground">{title}</h2>
          </div>
          <div className="h-5 w-px bg-border" aria-hidden="true" />
          {matches.length === 0 ? (
            <p className="text-xs text-muted-foreground">{emptyLabel}</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto scrollbar-none">
              {matches.slice(0, 6).map((match) => (
                <MatchCard key={match.match.id} match={match} seasonName={seasonName} variant="compact" />
              ))}
            </div>
          )}
          {matches.length > 0 ? (
            <Link
              href="/live"
              className="ml-auto hidden shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline md:inline-flex"
            >
              All live scores
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
