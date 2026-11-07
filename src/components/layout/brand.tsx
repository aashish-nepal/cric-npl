import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)} aria-label="NPL Cricket Hub home">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-sm ring-1 ring-inset ring-black/10">
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <circle cx="12" cy="12" r="8.25" fill="#ffffff" />
          <path d="M9.1 4.4c2.1 4.6 2.1 10.6 0 15.2" stroke="#166534" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M14.9 4.4c-2.1 4.6-2.1 10.6 0 15.2" stroke="#166534" strokeWidth="0.9" fill="none" strokeLinecap="round" strokeDasharray="1.5 1.6" />
        </svg>
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-extrabold tracking-tight text-foreground">
            NPL <span className="text-primary">Cricket Hub</span>
          </span>
          <span className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Independent Nepali cricket
          </span>
        </span>
      ) : null}
    </Link>
  );
}
