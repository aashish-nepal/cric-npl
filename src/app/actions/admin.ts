"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepository } from "@/lib/data";
import { requirePermission } from "@/lib/auth/session";
import {
  articleSchema,
  ballSchema,
  completeMatchSchema,
  createMatchSchema,
  createPlayerSchema,
  createTeamSchema,
  moderationSchema,
  squadSchema,
  updateMatchSchema,
  userRoleUpdateSchema,
  userSuspensionSchema,
} from "@/lib/validation";
import type { Actor } from "@/lib/data/repository";
import type { ActionState } from "@/lib/action-state";

function failure(error: unknown, fallback: string): ActionState {
  return { ok: false, message: error instanceof Error ? error.message : fallback };
}

function safeReturn(value: FormDataEntryValue | null, fallback: string): string {
  const path = String(value ?? "");
  return path.startsWith("/admin") ? path : fallback;
}

function actorOf(session: { id: string; email: string; role: Actor["role"] }): Actor {
  return { id: session.id, email: session.email, role: session.role };
}

function refreshMatch(matchId: string) {
  revalidatePath(`/admin/matches/${matchId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/matches");
  revalidatePath("/live");
  revalidatePath("/fixtures");
  revalidatePath("/results");
  revalidatePath("/points-table");
  revalidatePath("/statistics");
}

export async function recordBallAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requirePermission("scores.manage");
  const parsed = ballSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid delivery." };
  if (parsed.data.wicketType && parsed.data.runsBatter > 0) {
    return { ok: false, message: "A wicket delivery cannot also score runs off the bat." };
  }
  try {
    const { event } = await getRepository().recordBall({
      ...parsed.data,
      extraType: parsed.data.extraType ?? null,
      runsExtras: parsed.data.runsExtras ?? 0,
      wicketType: parsed.data.wicketType ?? null,
      dismissedPlayerId: parsed.data.dismissedPlayerId ?? null,
      fielderId: parsed.data.fielderId ?? null,
      commentary: parsed.data.commentary ?? "",
      actor: actorOf(session),
    });
    refreshMatch(parsed.data.matchId);
    return {
      ok: true,
      message: `Recorded ${event.overNumber}.${event.ballNumber}: ${event.totalRuns} run(s)${event.wicketType ? `, ${event.wicketType.replaceAll("_", " ")}` : ""}.`,
    };
  } catch (error) {
    return failure(error, "Could not record the delivery.");
  }
}

export async function undoBallAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requirePermission("scores.manage");
  const matchId = String(formData.get("matchId") ?? "");
  if (!matchId) return { ok: false, message: "Match is required." };
  try {
    await getRepository().undoLastBall(matchId, actorOf(session));
    refreshMatch(matchId);
    return { ok: true, message: "Last delivery removed and totals recalculated." };
  } catch (error) {
    return failure(error, "Could not undo the last delivery.");
  }
}

export async function startSecondInningsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requirePermission("scores.manage");
  const matchId = String(formData.get("matchId") ?? "");
  if (!matchId) return { ok: false, message: "Match is required." };
  try {
    await getRepository().startSecondInnings(matchId, actorOf(session));
    refreshMatch(matchId);
    return { ok: true, message: "Second innings started." };
  } catch (error) {
    return failure(error, "Could not start the second innings.");
  }
}

export async function closeInningsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requirePermission("scores.manage");
  const matchId = String(formData.get("matchId") ?? "");
  if (!matchId) return { ok: false, message: "Match is required." };
  try {
    await getRepository().closeInnings(matchId, actorOf(session));
    refreshMatch(matchId);
    return { ok: true, message: "Innings closed." };
  } catch (error) {
    return failure(error, "Could not close the innings.");
  }
}

export async function completeMatchAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requirePermission("scores.manage");
  const parsed = completeMatchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid result." };
  try {
    await getRepository().completeMatch(
      parsed.data.matchId,
      parsed.data.winnerId || null,
      parsed.data.resultSummary,
      actorOf(session),
    );
    refreshMatch(parsed.data.matchId);
    return { ok: true, message: "Match completed." };
  } catch (error) {
    return failure(error, "Could not complete the match.");
  }
}

export async function updateMatchAction(formData: FormData): Promise<void> {
  const session = await requirePermission("competition.manage");
  const returnTo = safeReturn(formData.get("returnTo"), "/admin/matches");
  const parsed = updateMatchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`${returnTo}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid match update")}`);
  }
  try {
    await getRepository().updateMatch({
      matchId: parsed.data.matchId,
      patch: {
        status: parsed.data.status,
        venueId: parsed.data.venueId || undefined,
        tossWinnerId: parsed.data.tossWinnerId || null,
        tossDecision: parsed.data.tossDecision,
        winnerId: parsed.data.winnerId || null,
        resultSummary: parsed.data.resultSummary || null,
      },
      actor: actorOf(session),
    });
  } catch (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not update match")}`);
  }
  revalidatePath("/admin/matches");
  refreshMatch(parsed.data.matchId);
  redirect(`${returnTo}?message=${encodeURIComponent("Match updated.")}`);
}

function parseKathmanduDateTime(value: string): string | null {
  if (!value) return null;
  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${normalized}+05:45`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createMatchAction(formData: FormData): Promise<void> {
  const session = await requirePermission("competition.manage");
  const parsed = createMatchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/matches/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid fixture")}`);
  }
  const scheduledAt = parseKathmanduDateTime(parsed.data.scheduledAt);
  if (!scheduledAt) redirect(`/admin/matches/new?error=${encodeURIComponent("Choose a valid date and time in Nepal time")}`);

  let matchId = "";
  try {
    const match = await getRepository().createMatch({
      seasonId: parsed.data.seasonId,
      teamAId: parsed.data.teamAId,
      teamBId: parsed.data.teamBId,
      venueId: parsed.data.venueId,
      scheduledAt,
      matchNumber: parsed.data.matchNumber,
      actor: actorOf(session),
    });
    matchId = match.id;
  } catch (error) {
    redirect(`/admin/matches/new?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not create fixture")}`);
  }
  revalidatePath("/admin/matches");
  revalidatePath("/fixtures");
  redirect(`/admin/matches/${matchId}?message=${encodeURIComponent("Fixture created.")}`);
}

export async function createTeamAction(formData: FormData): Promise<void> {
  const session = await requirePermission("competition.manage");
  const parsed = createTeamSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/teams?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid team")}`);
  }
  let teamName = "";
  try {
    const team = await getRepository().createTeam({ ...parsed.data, actor: actorOf(session) });
    teamName = team.name;
  } catch (error) {
    redirect(`/admin/teams?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not create team")}`);
  }
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  redirect(`/admin/teams?message=${encodeURIComponent(`${teamName} created.`)}`);
}

export async function createPlayerAction(formData: FormData): Promise<void> {
  const session = await requirePermission("competition.manage");
  const parsed = createPlayerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/players?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid player")}`);
  }
  let playerName = "";
  try {
    const player = await getRepository().createPlayer({
      fullName: parsed.data.fullName,
      playingRole: parsed.data.playingRole,
      battingStyle: parsed.data.battingStyle,
      bowlingStyle: parsed.data.bowlingStyle,
      nationality: parsed.data.nationality,
      biography: parsed.data.biography,
      actor: actorOf(session),
    });
    playerName = player.fullName;
    if (parsed.data.teamId && parsed.data.seasonId) {
      await getRepository().addSquadMember(parsed.data.seasonId, parsed.data.teamId, player.id, actorOf(session));
    }
  } catch (error) {
    redirect(`/admin/players?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not create player")}`);
  }
  revalidatePath("/admin/players");
  revalidatePath("/players");
  redirect(`/admin/players?message=${encodeURIComponent(`${playerName} created.`)}`);
}

export async function addSquadMemberAction(formData: FormData): Promise<void> {
  const session = await requirePermission("competition.manage");
  const parsed = squadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/teams?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid squad entry")}`);
  }
  try {
    await getRepository().addSquadMember(parsed.data.seasonId, parsed.data.teamId, parsed.data.playerId, actorOf(session));
  } catch (error) {
    redirect(`/admin/teams?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not add player")}`);
  }
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  redirect(`/admin/teams?message=${encodeURIComponent("Player added to squad.")}`);
}

export async function saveArticleAction(formData: FormData): Promise<void> {
  const session = await requirePermission("news.manage");
  const parsed = articleSchema.safeParse(Object.fromEntries(formData));
  const target = String(formData.get("articleId") ?? "");
  if (!parsed.success) {
    redirect(`${target ? `/admin/news/${target}` : "/admin/news/new"}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid article")}`);
  }
  const actor = actorOf(session);
  let articleSlug = "";
  let articleTitle = "";
  try {
    if (parsed.data.articleId) {
      const article = await getRepository().updateArticle({
        articleId: parsed.data.articleId,
        patch: {
          title: parsed.data.title,
          slug: parsed.data.slug || undefined,
          excerpt: parsed.data.excerpt,
          body: parsed.data.body,
          categoryId: parsed.data.categoryId,
          tags: parsed.data.tags,
          status: parsed.data.status,
          seoTitle: parsed.data.seoTitle || null,
          metaDescription: parsed.data.metaDescription || null,
          featured: parsed.data.featured,
        },
        actor,
      });
      articleSlug = article.slug;
      articleTitle = article.title;
    } else {
      const article = await getRepository().createArticle({
        title: parsed.data.title,
        slug: parsed.data.slug || undefined,
        excerpt: parsed.data.excerpt,
        body: parsed.data.body,
        categoryId: parsed.data.categoryId,
        tags: parsed.data.tags,
        status: parsed.data.status,
        seoTitle: parsed.data.seoTitle || null,
        metaDescription: parsed.data.metaDescription || null,
        featured: parsed.data.featured,
        actor,
      });
      articleSlug = article.slug;
      articleTitle = article.title;
    }
  } catch (error) {
    redirect(`${target ? `/admin/news/${target}` : "/admin/news/new"}?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not save article")}`);
  }
  revalidatePath(`/news/${articleSlug}`);
  revalidatePath("/news");
  revalidatePath("/admin/news");
  redirect(`/admin/news?message=${encodeURIComponent(parsed.data.articleId ? "Article saved." : `“${articleTitle}” created.`)}`);
}

export async function archiveArticleAction(formData: FormData): Promise<void> {
  const session = await requirePermission("news.manage");
  const articleId = String(formData.get("articleId") ?? "");
  if (!articleId) redirect("/admin/news?error=Article+is+required");
  try {
    await getRepository().archiveArticle(articleId, actorOf(session));
  } catch (error) {
    redirect(`/admin/news?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not archive article")}`);
  }
  revalidatePath("/admin/news");
  revalidatePath("/news");
  redirect("/admin/news?message=Article+archived.");
}

export async function moderateCommentAction(formData: FormData): Promise<void> {
  const session = await requirePermission("comments.moderate");
  const returnTo = safeReturn(formData.get("returnTo"), "/admin/comments");
  const parsed = moderationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${returnTo}?error=${encodeURIComponent("Invalid moderation action")}`);
  try {
    await getRepository().moderateComment(parsed.data.commentId, parsed.data.status, actorOf(session));
  } catch (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not moderate comment")}`);
  }
  revalidatePath("/admin/comments");
  revalidatePath("/news");
  redirect(`${returnTo}?message=${encodeURIComponent(`Comment ${parsed.data.status}.`)}`);
}

export async function setUserRoleAction(formData: FormData): Promise<void> {
  const session = await requirePermission("users.manage");
  const parsed = userRoleUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/admin/users?error=${encodeURIComponent("Invalid role change")}`);
  if (parsed.data.userId === session.id) redirect(`/admin/users?error=${encodeURIComponent("You cannot change your own role")}`);
  try {
    await getRepository().setUserRole(parsed.data.userId, parsed.data.role, actorOf(session));
  } catch (error) {
    redirect(`/admin/users?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not update role")}`);
  }
  revalidatePath("/admin/users");
  redirect("/admin/users?message=Role+updated.");
}

export async function setUserSuspendedAction(formData: FormData): Promise<void> {
  const session = await requirePermission("users.manage");
  const parsed = userSuspensionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/admin/users?error=${encodeURIComponent("Invalid suspension change")}`);
  if (parsed.data.userId === session.id) redirect(`/admin/users?error=${encodeURIComponent("You cannot suspend your own account")}`);
  try {
    await getRepository().setUserSuspended(parsed.data.userId, parsed.data.suspended, actorOf(session));
  } catch (error) {
    redirect(`/admin/users?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not update account")}`);
  }
  revalidatePath("/admin/users");
  redirect(`/admin/users?message=${encodeURIComponent(parsed.data.suspended ? "Account suspended." : "Account restored.")}`);
}
