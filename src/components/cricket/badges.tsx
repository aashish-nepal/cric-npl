import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LiveBadge({ className, label = "LIVE" }: { className?: string; label?: string }) {
  return (
    <Badge variant="live" className={cn("gap-1.5", className)}>
      <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
      {label}
    </Badge>
  );
}

export function FormBadge({ result }: { result: "W" | "L" | "T" | "NR" }) {
  const styles = {
    W: "bg-success/15 text-green-700",
    L: "bg-live/10 text-red-700",
    T: "bg-amber-100 text-amber-800",
    NR: "bg-muted text-muted-foreground",
  } as const;
  return (
    <span
      title={result === "W" ? "Won" : result === "L" ? "Lost" : result === "T" ? "Tied" : "No result"}
      className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold", styles[result])}
    >
      {result}
    </span>
  );
}
