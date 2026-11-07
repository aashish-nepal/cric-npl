"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Prediction } from "@/types/content";
import { predictionAction } from "@/app/actions/fan";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { cn, formatKathmanduDateTime } from "@/lib/utils";

export function PredictionCard({
  prediction,
  selectedOptionId,
  signedIn,
}: {
  prediction: Prediction;
  selectedOptionId: string | null;
  signedIn: boolean;
}) {
  const [state, formAction, pending] = useActionState(predictionAction, initialActionState);
  const locked = Boolean(selectedOptionId) || prediction.status !== "open" || new Date(prediction.closesAt) < new Date();

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold tracking-tight">{prediction.title}</h3>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {locked ? "Locked" : "Open"}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">Closes {formatKathmanduDateTime(prediction.closesAt)} NPT</p>

      <form action={formAction} className="mt-3 space-y-2">
        <input type="hidden" name="predictionId" value={prediction.id} />
        {prediction.options.map((option) => {
          const selected = option.id === selectedOptionId;
          return (
            <label
              key={option.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm",
                selected ? "border-primary bg-primary/5 font-semibold text-primary" : "border-border hover:border-primary/40",
                locked && !selected && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name="optionId"
                value={option.id}
                required
                disabled={locked}
                defaultChecked={selected}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              <span className="min-w-0 truncate">{option.label}</span>
            </label>
          );
        })}
        {!selectedOptionId ? (
          signedIn ? (
            <Button type="submit" size="sm" className="w-full" disabled={pending || locked}>
              {pending ? "Saving…" : "Submit prediction"}
            </Button>
          ) : (
            <Link
              href="/auth/login?next=/predictions"
              className="inline-flex h-8 w-full items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-dark"
            >
              Sign in to predict
            </Link>
          )
        ) : (
          <p className="rounded-md bg-success/10 px-3 py-2 text-xs font-medium text-green-800">Prediction submitted.</p>
        )}
      </form>
      {state.message ? (
        <p role="status" className={cn("mt-2 text-xs", state.ok ? "text-green-700" : "text-red-700")}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
