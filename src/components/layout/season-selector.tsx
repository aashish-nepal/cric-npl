"use client";

import { useRouter } from "next/navigation";
import type { Season } from "@/types/cricket";
import { Select } from "@/components/ui/form";

export function SeasonSelector({ seasons, activeSlug }: { seasons: Season[]; activeSlug: string }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-1.5">
      <span className="sr-only">Select season</span>
      <Select
        value={activeSlug}
        onChange={(event) => router.push(`/seasons/${event.target.value}`)}
        className="h-8 w-auto min-w-[118px] border-border bg-surface py-1 pl-2 pr-7 text-xs font-semibold text-foreground"
      >
        {seasons.map((season) => (
          <option key={season.id} value={season.slug}>
            {season.name}
          </option>
        ))}
      </Select>
    </label>
  );
}
