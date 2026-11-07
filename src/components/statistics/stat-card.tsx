import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  eyebrow,
  title,
  value,
  subtitle,
  href,
  className,
}: {
  eyebrow: string;
  title: string;
  value: string;
  subtitle?: string;
  href?: string;
  className?: string;
}) {
  const content = (
    <>
      <p className="eyebrow">{eyebrow}</p>
      <p className="mt-2 truncate text-lg font-bold tracking-tight text-foreground">{title}</p>
      <p className="tabular mt-1 text-2xl font-bold text-primary">{value}</p>
      {subtitle ? <p className="mt-1 truncate text-[11px] text-muted-foreground">{subtitle}</p> : null}
      {href ? (
        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
          View leaderboard
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.02]",
          className,
        )}
      >
        {content}
      </Link>
    );
  }
  return <div className={cn("rounded-lg border border-border bg-card p-4", className)}>{content}</div>;
}
