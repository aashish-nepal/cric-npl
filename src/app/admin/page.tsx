import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Database,
  FileText,
  MessageSquareWarning,
  Radio,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { MatchComputed } from "@/types/cricket";
import { getAdminOverview } from "@/services/admin";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { AdminPageHeading, FlashMessages } from "@/components/admin/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { buttonVariants } from "@/components/ui/button";
import { LiveBadge } from "@/components/cricket/badges";
import { TeamLogo } from "@/components/cricket/identity";
import { cn, formatKathmanduDateTime, relativeTime } from "@/lib/utils";

function scoreFor(computed: MatchComputed, teamId: string): string | null {
  const innings = computed.innings.find((row) => row.innings.battingTeamId === teamId);
  if (!innings) return null;
  return `${innings.runs}/${innings.wickets} (${innings.overs})`;
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  tone?: "default" | "live" | "warning";
  href?: string;
}) {
  const body = (
    <Card className={cn("h-full transition-colors", href ? "hover:border-primary/40" : undefined)}>
      <CardContent className="flex items-start gap-3 p-4">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            tone === "live" ? "bg-live/10 text-live" : tone === "warning" ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-0.5 tabular text-2xl font-extrabold tracking-tight">{value}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const [{ message, error }, overview, session] = await Promise.all([searchParams, getAdminOverview(), getSession()]);
  const { site, live, scheduled, completed, articles, pendingComments, users, auditLogs, syncLogs, demo } = overview;
  const published = articles.filter((article) => article.status === "published").length;
  const drafts = articles.filter((article) => article.status === "draft" || article.status === "scheduled").length;
  const nextMatch = scheduled
    .slice()
    .sort((a, b) => new Date(a.match.scheduledAt).getTime() - new Date(b.match.scheduledAt).getTime())[0];
  const canScore = session ? can(session.role, "scores.manage") : false;
  const canNews = session ? can(session.role, "news.manage") : false;
  const canModerate = session ? can(session.role, "comments.moderate") : false;

  return (
    <>
      <AdminPageHeading
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${session?.username ?? "team"}`}
        description={`${site.activeSeason.name} operations overview. Scores, editorial and fan activity in one place.`}
        actions={
          canScore ? (
            <Link href="/admin/matches" className={buttonVariants({ variant: "default", size: "sm" })}>
              <Radio className="h-3.5 w-3.5" aria-hidden="true" />
              Open scoring
            </Link>
          ) : null
        }
      />
      <FlashMessages message={message} error={error} />

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950">
          <strong>Demo mode.</strong> All records are generated demo data and admin changes live in server memory. Restarting the
          dev server restores the seed dataset. Configure Supabase credentials to use persistent production storage.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Live matches" value={live.length} detail={live.length ? "Scorecards accepting deliveries" : "No match in progress"} icon={Radio} tone="live" href="/admin/matches?status=live" />
        <StatCard label="Upcoming" value={scheduled.length} detail={nextMatch ? `Next: ${formatKathmanduDateTime(nextMatch.match.scheduledAt)}` : "No scheduled fixtures"} icon={CalendarClock} href="/admin/matches?status=scheduled" />
        <StatCard label="Pending comments" value={pendingComments.length} detail="Awaiting moderation" icon={MessageSquareWarning} tone={pendingComments.length ? "warning" : "default"} href="/admin/comments" />
        <StatCard label="Registered users" value={users.length} detail={`${users.filter((user) => user.suspended).length} suspended`} icon={Users} href="/admin/users" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Published articles" value={published} detail="Visible on the public site" icon={FileText} href="/admin/news" />
        <StatCard label="Drafts & scheduled" value={drafts} detail="Editorial work in progress" icon={FileText} href="/admin/news" />
        <StatCard label="Completed matches" value={completed.length} detail={`${site.activeSeason.name} results`} icon={CheckCircle2} href="/admin/matches?status=completed" />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Live & upcoming</h2>
            <Link href="/admin/matches" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              All matches <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {live.length === 0 && scheduled.length === 0 ? (
            <EmptyState title="No live or upcoming matches" description="Create a fixture to begin scoring." />
          ) : (
            <ul className="space-y-2">
              {[...live, ...scheduled.slice(0, 4)].map((computed) => {
                const match = computed.match;
                return (
                  <li key={match.id}>
                    <Link
                      href={`/admin/matches/${match.id}`}
                      className="block rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {match.status === "live" ? <LiveBadge /> : <Badge variant="secondary">Scheduled</Badge>}
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Match {match.matchNumber} · {formatKathmanduDateTime(match.scheduledAt)} NPT
                        </span>
                      </div>
                      <div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <TeamLogo team={computed.teamA} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{computed.teamA.name}</p>
                            <p className="tabular text-xs text-muted-foreground">{scoreFor(computed, computed.teamA.id) ?? "Yet to bat"}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">vs</span>
                        <div className="flex min-w-0 items-center justify-end gap-2 text-right">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{computed.teamB.name}</p>
                            <p className="tabular text-xs text-muted-foreground">{scoreFor(computed, computed.teamB.id) ?? "Yet to bat"}</p>
                          </div>
                          <TeamLogo team={computed.teamB} size="sm" />
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{match.resultSummary ?? computed.statusText}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold tracking-tight">Recent admin activity</h2>
              <Link href="/admin/system" className="text-[11px] font-semibold text-primary hover:underline">
                Audit log
              </Link>
            </div>
            {auditLogs.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No admin actions recorded yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {auditLogs.slice(0, 8).map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{entry.action.replaceAll(".", " · ")}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {entry.actorEmail || "system"} · {entry.details || entry.entityType}
                      </p>
                    </div>
                    <time className="shrink-0 text-[10px] text-muted-foreground" dateTime={entry.createdAt}>
                      {relativeTime(entry.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle>Moderation queue</CardTitle>
              <Badge variant={pendingComments.length ? "accent" : "secondary"}>{pendingComments.length} pending</Badge>
            </CardHeader>
            <CardContent>
              {pendingComments.length === 0 ? (
                <p className="text-sm text-muted-foreground">The comment queue is clear.</p>
              ) : (
                <ul className="space-y-3">
                  {pendingComments.slice(0, 4).map((comment) => (
                    <li key={comment.id} className="rounded-md border border-border bg-muted/30 p-3">
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        {comment.username} on <span className="text-foreground">{comment.articleTitle}</span>
                      </p>
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed">{comment.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{relativeTime(comment.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
              {canModerate ? (
                <Link href="/admin/comments" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 w-full")}>
                  Review comments
                </Link>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {canScore ? (
                <>
                  <Link href="/admin/matches" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <Radio className="h-3.5 w-3.5" aria-hidden="true" /> Scoring console
                  </Link>
                  <Link href="/admin/matches/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> Add fixture
                  </Link>
                </>
              ) : null}
              {canNews ? (
                <Link href="/admin/news/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" /> New article
                </Link>
              ) : null}
              {!canScore && !canNews ? (
                <p className="text-xs text-muted-foreground">Your role has read-only dashboard access.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle>Data source</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center justify-between gap-2">
                <span>Backend</span>
                <span className="font-semibold text-foreground">{demo ? "Demo adapter" : "Supabase"}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span>Provider sync</span>
                <span className="font-semibold text-foreground">{syncLogs[0]?.status ?? "not configured"}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span>Scoring</span>
                <span className="font-semibold text-foreground">Manual console</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span>RLS</span>
                <span className="font-semibold text-foreground">Supabase policies</span>
              </p>
              <Link href="/admin/system" className="mt-1 inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                System health <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            Every mutation is authorised server-side against your role and written to the audit trail.
          </div>
        </aside>
      </div>
    </>
  );
}
