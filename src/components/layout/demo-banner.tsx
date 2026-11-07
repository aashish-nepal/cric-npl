import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { getRepository } from "@/lib/data";

export function DemoBanner() {
  if (!getRepository().isDemo) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-950">
      <div className="container-page flex flex-wrap items-center gap-x-2 gap-y-1 py-2 text-[12px]">
        <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <strong className="font-semibold">Demo dataset.</strong>
        <span className="text-amber-900/80">
          Scores, squads and articles on this build are illustrative and are not official NPL records.
        </span>
        <Link href="/about#data" className="font-semibold underline underline-offset-2 hover:no-underline">
          About the data
        </Link>
      </div>
    </div>
  );
}
