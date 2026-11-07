import Link from "next/link";
import { CalendarPlus, ChevronRight, Radio } from "lucide-react";
import type { MatchStatus } from "@/types/cricket";
import { getAdminOverview } from "@/services/admin";
import { requirePermission } from "@/lib/auth/session";
import { AdminPageHeading, FlashMessages } from "@/components/admin/page-heading";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";
import { buttonVariants } from "@/components/ui/button";
import { LiveBadge } from "@/components/cricket/badges";
import { TeamLogo } from "@/components/cricket/identity";
import { cn, formatKathmanduDateTime } from "@/lib/utils";

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "live", label: "Live" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "abandoned", label: "Abandoned" },
];

function statusBadge(status: MatchStatus) {
  if (status === "live") return <LiveBadge />;
  if (status === "completed") return <Badge variant="success">Completed</Badge>;
  if (status === "abandoned") return <Badge variant="secondary">Abandoned</Badge>;
  if (status === "cancelled") return <Badge variant="secondary">Cancelled</Badge>;
  return <Badge variant="outline">Scheduled</Badge>;
}

function scoreLine(computed: Awaited<ReturnType<typeof getAdminOverview>>["site"]["analytics"]["matches"][number], teamId: string) {
  const innings = computed.innings.find((row) => row.innings.battingTeamId === teamId);
  if (!innings) return "—";
  return `${innings.runs}/${innings.wickets} (${innings.overs})`;
}

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; message?: string; error?: string }>;
}) {
  await requirePermission("scores.manage");
  const [{ status, message, error }, overview] = await Promise.all([searchParams, getAdminOverview()]);
  const matches = [...overview.site.analytics.matches].sort(
    (a, b) => new Date(b.match.scheduledAt).getTime() - new Date(a.match.scheduledAt).getTime(),
  );
  const filtered = status ? matches.filter((row) => row.match.status === status) : matches;

  return (
    <>
      <AdminPageHeading
        title="Matches & scoring"
        description="Create fixtures, open the ball-by-ball console and finalise results. Manual scoring is the source of truth."
        actions={
          <Link href="/admin/matches/new" className={buttonVariants({ size: "sm" })}>
            <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
            New fixture
          </Link>
        }
      />
      <FlashMessages message={message} error={error} />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => {
          const active = (status ?? "") === filter.value;
          const count =
            filter.value === "" ? matches.length : matches.filter((row) => row.match.status === filter.value).length;
          return (
            <Link
              key={filter.value || "all"}
              href={filter.value ? `/admin/matches?status=${filter.value}` : "/admin/matches"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                active ? "border-primary bg-primary text-white" : "border-border bg-surface text-foreground hover:bg-muted",
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
          title="No matches in this view"
          description="Create a fixture to start scoring, or change the status filter."
          action={
            <Link href="/admin/matches/new" className={buttonVariants({ size: "sm" })}>
              <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" /> New fixture
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Match</TableHead>
                <TableHead className="hidden md:table-cell">Scheduled</TableHead>
                <TableHead className="hidden lg:table-cell">Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((computed) => {
                const match = computed.match;
                return (
                  <TableRow key={match.id}>
                    <TableCell>
                      <div className="flex min-w-[220px] flex-col gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Match {match.matchNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          <TeamLogo team={computed.teamA} size="xs" />
                          <span className="text-xs font-semibold">{computed.teamA.shortName}</span>
                          <span className="tabular text-[11px] text-muted-foreground">{scoreLine(computed, computed.teamA.id)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TeamLogo team={computed.teamB} size="xs" />
                          <span className="text-xs font-semibold">{computed.teamB.shortName}</span>
                          <span className="tabular text-[11px] text-muted-foreground">{scoreLine(computed, computed.teamB.id)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                      {formatKathmanduDateTime(match.scheduledAt)}
                      <span className="ml-1 text-[10px]">NPT</span>
                    </TableCell>
                    <TableCell className="hidden max-w-[180px] truncate text-xs text-muted-foreground lg:table-cell">
                      {computed.venue.name}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {statusBadge(match.status)}
                        <p className="max-w-[200px] truncate text-[10px] text-muted-foreground">
                          {match.resultSummary ?? computed.statusText}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/matches/${match.id}`}
                        className={cn(buttonVariants({ variant: match.status === "live" ? "default" : "outline", size: "sm" }))}
                      >
                        {match.status === "live" ? (
                          <>
                            <Radio className="h-3.5 w-3.5" aria-hidden="true" /> Score
                          </>
                        ) : (
                          <>
                            Manage <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </>
                        )}
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
