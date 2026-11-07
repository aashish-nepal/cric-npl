"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepository } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { bookmarkSchema, commentSchema, predictionSchema, voteSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

export async function voteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in to vote in fan polls." };
  const parsed = voteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid vote." };
  const limit = rateLimit(`vote:${session.id}`, 20, 60_000);
  if (!limit.ok) return { ok: false, message: "Too many votes. Please slow down." };
  try {
    await getRepository().castVote(parsed.data.pollId, parsed.data.optionId, session.id);
    revalidatePath("/fan-zone");
    revalidatePath("/polls");
    if (parsed.data.slug) revalidatePath(`/polls/${parsed.data.slug}`);
    return { ok: true, message: "Your vote has been recorded." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not record your vote." };
  }
}

export async function predictionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in to submit a prediction." };
  const parsed = predictionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid prediction." };
  const limit = rateLimit(`prediction:${session.id}`, 20, 60_000);
  if (!limit.ok) return { ok: false, message: "Too many submissions. Please slow down." };
  try {
    await getRepository().submitPrediction(parsed.data.predictionId, parsed.data.optionId, session.id);
    revalidatePath("/fan-zone");
    revalidatePath("/predictions");
    return { ok: true, message: "Prediction saved. Points are awarded after the match is settled." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not save your prediction." };
  }
}

export async function commentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in to join the discussion." };
  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid comment." };
  const limit = rateLimit(`comment:${session.id}`, 6, 5 * 60_000);
  if (!limit.ok) return { ok: false, message: "You have posted several comments recently. Try again shortly." };
  try {
    await getRepository().addComment(parsed.data.articleId, session.id, session.username, parsed.data.body);
    revalidatePath(`/news/${parsed.data.slug}`);
    return { ok: true, message: "Thanks — your comment is awaiting moderation." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not post your comment." };
  }
}

export async function toggleBookmarkAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/fan-zone");
  const parsed = bookmarkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/fan-zone?error=Invalid+bookmark+request");
  await getRepository().toggleBookmark(session.id, parsed.data.entityType, parsed.data.entityId);
  revalidatePath("/fan-zone");
}
