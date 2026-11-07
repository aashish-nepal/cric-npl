import Link from "next/link";
import { Check, MessageSquare, RotateCcw, X } from "lucide-react";
import type { Comment } from "@/types/content";
import { getAdminComments } from "@/services/admin";
import { requirePermission } from "@/lib/auth/session";
import { moderateCommentAction } from "@/app/actions/admin";
import { AdminPageHeading, FlashMessages } from "@/components/admin/page-heading";
import { SubmitButton } from "@/components/admin/submit-button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { cn, relativeTime } from "@/lib/utils";

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function statusVariant(status: Comment["status"]) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "live" as const;
  return "accent" as const;
}

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; message?: string; error?: string }>;
}) {
  await requirePermission("comments.moderate");
  const [{ status, message, error }, comments] = await Promise.all([searchParams, getAdminComments()]);
  const activeStatus = status === undefined ? "pending" : status;
  const filtered = activeStatus ? comments.filter((comment) => comment.status === activeStatus) : comments;

  return (
    <>
      <AdminPageHeading
        title="Comment moderation"
        description="Fan comments are queued for review. Approved comments appear on the public article; rejected comments stay hidden."
      />
      <FlashMessages message={message} error={error} />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => {
          const active = activeStatus === filter.value;
          const count =
            filter.value === "" ? comments.length : comments.filter((comment) => comment.status === filter.value).length;
          return (
            <Link
              key={filter.value || "all"}
              href={filter.value ? `/admin/comments?status=${filter.value}` : "/admin/comments?status="}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
                active ? "border-primary bg-primary text-white" : "border-border bg-surface hover:bg-muted",
              )}
            >
              {filter.label}
              <span className={cn("tabular text-[10px]", active ? "text-white/70" : "text-muted-foreground")}>{count}</span>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={activeStatus === "pending" ? "Moderation queue is clear" : "No comments in this view"}
          description="New fan comments appear here before they are visible on the site."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((comment) => (
            <li key={comment.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(comment.status)}>{comment.status}</Badge>
                <span className="text-xs font-semibold">{comment.username}</span>
                <span className="text-[11px] text-muted-foreground">on</span>
                <Link
                  href={`/news/${comment.articleSlug}`}
                  className="max-w-full truncate text-[11px] font-semibold text-primary hover:underline"
                >
                  {comment.articleTitle}
                </Link>
                <time className="ml-auto text-[10px] text-muted-foreground" dateTime={comment.createdAt}>
                  {relativeTime(comment.createdAt)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-line rounded-md bg-muted/40 px-3 py-2.5 text-xs leading-relaxed">{comment.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {comment.status !== "approved" ? (
                  <form action={moderateCommentAction}>
                    <input type="hidden" name="commentId" value={comment.id} />
                    <input type="hidden" name="status" value="approved" />
                    <input type="hidden" name="returnTo" value="/admin/comments" />
                    <SubmitButton size="sm" pendingLabel="Approving…">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Approve
                    </SubmitButton>
                  </form>
                ) : null}
                {comment.status !== "rejected" ? (
                  <form action={moderateCommentAction}>
                    <input type="hidden" name="commentId" value={comment.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <input type="hidden" name="returnTo" value="/admin/comments" />
                    <SubmitButton variant="destructive" size="sm" pendingLabel="Rejecting…">
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Reject
                    </SubmitButton>
                  </form>
                ) : null}
                {comment.status !== "pending" ? (
                  <form action={moderateCommentAction}>
                    <input type="hidden" name="commentId" value={comment.id} />
                    <input type="hidden" name="status" value="pending" />
                    <input type="hidden" name="returnTo" value="/admin/comments" />
                    <SubmitButton variant="ghost" size="sm" pendingLabel="Returning…">
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      Return to queue
                    </SubmitButton>
                  </form>
                ) : null}
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MessageSquare className="h-3 w-3" aria-hidden="true" />
                  {comment.id}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
