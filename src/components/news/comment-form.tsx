"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { commentAction } from "@/app/actions/fan";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export function CommentForm({
  articleId,
  slug,
  signedIn,
}: {
  articleId: string;
  slug: string;
  signedIn: boolean;
}) {
  const [state, formAction, pending] = useActionState(commentAction, initialActionState);

  if (!signedIn) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <Link href={`/auth/login?next=/news/${slug}`} className="font-semibold text-primary hover:underline">
          Sign in
        </Link>{" "}
        to join the discussion. Comments are moderated before publication.
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-lg border border-border bg-card p-4">
      <input type="hidden" name="articleId" value={articleId} />
      <input type="hidden" name="slug" value={slug} />
      <label htmlFor="comment-body" className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        Add a comment
      </label>
      <Textarea
        id="comment-body"
        name="body"
        required
        minLength={2}
        maxLength={2000}
        placeholder="Keep it civil and on topic. Comments are reviewed before they appear."
        className="mt-2"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">Max 2000 characters · moderated</p>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting…" : "Post comment"}
        </Button>
      </div>
      {state.message ? (
        <p role="status" className={cn("mt-2 text-xs", state.ok ? "text-green-700" : "text-red-700")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
