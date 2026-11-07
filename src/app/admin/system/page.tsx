import {
  AlertTriangle,
  CheckCircle2,
  Database,
  KeyRound,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { getAdminOverview } from "@/services/admin";
import { requirePermission } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import { AdminPageHeading } from "@/components/admin/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKathmanduDateTime, relativeTime } from "@/lib/utils";

function EnvRow({ label, configured, note }: { label: string; configured: boolean; note: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-[11px] text-muted-foreground">{note}</p>
      </div>
      {configured ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Configured
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-muted-foreground">
          <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Not set
        </span>
      )}
    </div>
  );
}

export default async function AdminSystemPage() {
  await requirePermission("system.manage");
  const overview = await getAdminOverview();
  const repository = getRepository();
  const supabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const authSecret = Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16);
  const provider = process.env.CRICKET_PROVIDER && process.env.CRICKET_PROVIDER !== "none" ? process.env.CRICKET_PROVIDER : null;

  return (
    <>
      <AdminPageHeading
        title="System health"
        description="Runtime configuration, data source, provider sync and the complete audit trail. Secrets are never displayed."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <ServerCog className="h-4 w-4 text-primary" aria-hidden="true" />
            <CardTitle>Runtime configuration</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <EnvRow label="Supabase URL" configured={supabaseUrl} note="Selects the production repository adapter when present." />
            <EnvRow label="Supabase anon key" configured={supabaseAnon} note="Used by server components and auth." />
            <EnvRow label="Supabase service role" configured={serviceRole} note="Server-only writes and admin operations." />
            <EnvRow label="Auth secret" configured={authSecret} note="Signs demo session cookies. Production requires a long random value." />
            <EnvRow label="Cricket data provider" configured={Boolean(provider)} note={provider ? `Configured provider: ${provider}` : "No verified provider integration. Manual scoring is active."} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={repository.isDemo ? "accent" : "success"}>
                <Database className="h-3 w-3" aria-hidden="true" />
                {repository.isDemo ? "Demo adapter" : "Supabase adapter"}
              </Badge>
              <Badge variant="secondary">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Server-authorised actions
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
            <CardTitle>Operational notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
            {repository.isDemo ? (
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-950">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>
                  <strong>Demo persistence:</strong> changes are held in server process memory and reset on restart. The dataset is
                  deterministic seed data, not official NPL records.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-green-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>Supabase adapter selected. Persistence depends on the SQL migrations and RLS policies being applied to the project.</p>
              </div>
            )}
            <p>
              <strong className="text-foreground">Scoring source of truth:</strong> ball-by-ball events. Innings totals, scorecards,
              standings and leaderboards are derived by the shared TypeScript engine.
            </p>
            <p>
              <strong className="text-foreground">Provider sync:</strong> no external cricket feed is configured or claimed. The sync log
              records only attempted jobs; the interface supports a manual fallback.
            </p>
            <p>
              <strong className="text-foreground">SEO:</strong> public routes are server-rendered with canonical URLs, sitemap, robots and
              structured data. Admin routes are excluded from indexing.
            </p>
            <p className="flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Last updated {formatKathmanduDateTime(new Date().toISOString())} NPT
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Audit log</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {overview.auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No admin activity recorded.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead className="hidden sm:table-cell">Actor</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead className="text-right">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.auditLogs.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <p className="text-xs font-semibold">{entry.action}</p>
                        <p className="max-w-[240px] truncate text-[10px] text-muted-foreground">{entry.details}</p>
                      </TableCell>
                      <TableCell className="hidden text-[11px] text-muted-foreground sm:table-cell">
                        {entry.actorEmail || "system"}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">
                        {entry.entityType}
                        <span className="ml-1 text-[9px]">{entry.entityId}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right text-[10px] text-muted-foreground">
                        {relativeTime(entry.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provider sync log</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {overview.syncLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No provider jobs have run. Manual scoring is the active source.</p>
            ) : (
              <ul className="divide-y divide-border">
                {overview.syncLogs.map((entry) => (
                  <li key={entry.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold">{entry.provider}</p>
                      <Badge
                        variant={
                          entry.status === "success" ? "success" : entry.status === "failed" ? "live" : entry.status === "partial" ? "accent" : "secondary"
                        }
                      >
                        {entry.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{entry.message}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.recordsProcessed} records · {relativeTime(entry.finishedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
