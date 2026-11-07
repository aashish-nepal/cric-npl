import type { CommentaryItem } from "@/services/cricket";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function DeliveryBadge({ item }: { item: CommentaryItem }) {
  const { event } = item;
  if (event.wicketType) {
    return <Badge variant="live" className="h-6 min-w-6 justify-center px-1.5">W</Badge>;
  }
  if (event.extraType === "wide") {
    return <Badge variant="secondary" className="h-6 min-w-6 justify-center px-1.5">Wd</Badge>;
  }
  if (event.extraType === "no_ball") {
    return <Badge variant="secondary" className="h-6 min-w-6 justify-center px-1.5">Nb</Badge>;
  }
  if (event.extraType === "bye" || event.extraType === "leg_bye") {
    return <Badge variant="secondary" className="h-6 min-w-6 justify-center px-1.5">B</Badge>;
  }
  if (event.runsBatter === 6) {
    return <Badge variant="accent" className="h-6 min-w-6 justify-center px-1.5">6</Badge>;
  }
  if (event.runsBatter === 4) {
    return <Badge variant="accent" className="h-6 min-w-6 justify-center px-1.5">4</Badge>;
  }
  return (
    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-semibold tabular text-muted-foreground">
      {event.totalRuns}
    </span>
  );
}

export function CommentaryList({ items, limit }: { items: CommentaryItem[]; limit?: number }) {
  const list = limit ? items.slice(0, limit) : items;
  if (list.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">No deliveries yet.</p>;
  }
  return (
    <ol className="divide-y divide-border">
      {list.map((item) => (
        <li key={item.event.id} className={cn("flex gap-3 px-4 py-3", item.event.wicketType && "bg-live/[0.04]")}>
          <div className="flex w-11 shrink-0 flex-col items-center gap-1">
            <span className="tabular text-[11px] font-semibold text-muted-foreground">
              {item.event.overNumber}.{item.event.ballNumber}
            </span>
            <DeliveryBadge item={item} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-6 text-foreground/90">{item.event.commentary}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {item.bowlerName} to {item.batterName}
              {item.event.wicketType ? ` · ${item.event.wicketType.replaceAll("_", " ")}` : ""}
            </p>
          </div>
          <span className="tabular text-xs font-semibold text-foreground">
            {item.event.totalRuns > 0 ? `+${item.event.totalRuns}` : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}
