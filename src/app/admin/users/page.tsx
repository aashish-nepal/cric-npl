import { ShieldAlert, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { getAdminOverview } from "@/services/admin";
import { requirePermission } from "@/lib/auth/session";
import { setUserRoleAction, setUserSuspendedAction } from "@/app/actions/admin";
import { ROLE_LABELS } from "@/lib/permissions";
import type { UserRole } from "@/types/cricket";
import { AdminPageHeading, FlashMessages } from "@/components/admin/page-heading";
import { SubmitButton } from "@/components/admin/submit-button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select } from "@/components/ui/form";
import { formatKathmanduDate } from "@/lib/utils";

const ROLES: UserRole[] = ["user", "author", "moderator", "editor", "scorer", "admin", "super_admin"];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const session = await requirePermission("users.manage");
  const [{ message, error }, overview] = await Promise.all([searchParams, getAdminOverview()]);

  return (
    <>
      <AdminPageHeading
        title="Users & roles"
        description="Role changes take effect immediately. Suspended accounts cannot sign in or post comments."
      />
      <FlashMessages message={message} error={error} />

      <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          You cannot change your own role or suspend your own account. Grant the least privilege needed: <strong>scorer</strong> for
          match entry, <strong>editor</strong> for publishing, <strong>moderator</strong> for comments.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Account</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overview.users.map((user) => {
              const self = user.id === session.id;
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="min-w-[200px]">
                      <p className="text-xs font-semibold">
                        {user.username}
                        {self ? <span className="ml-1.5 text-[10px] font-medium text-primary">(you)</span> : null}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{user.email}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{user.points} fan points</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {formatKathmanduDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={user.suspended ? "live" : "success"}>{user.suspended ? "Suspended" : "Active"}</Badge>
                  </TableCell>
                  <TableCell>
                    <form action={setUserRoleAction} className="flex min-w-[220px] items-center gap-1.5">
                      <input type="hidden" name="userId" value={user.id} />
                      <Select name="role" defaultValue={user.role} disabled={self} aria-label={`Role for ${user.username}`}>
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </Select>
                      <SubmitButton size="sm" variant="outline" disabled={self} pendingLabel="…">
                        Save
                      </SubmitButton>
                    </form>
                  </TableCell>
                  <TableCell className="text-right">
                    {self ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Protected
                      </span>
                    ) : (
                      <form action={setUserSuspendedAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="suspended" value={user.suspended ? "false" : "true"} />
                        <SubmitButton
                          size="sm"
                          variant={user.suspended ? "secondary" : "destructive"}
                          pendingLabel={user.suspended ? "Restoring…" : "Suspending…"}
                        >
                          {user.suspended ? (
                            <>
                              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" /> Restore
                            </>
                          ) : (
                            <>
                              <UserX className="h-3.5 w-3.5" aria-hidden="true" /> Suspend
                            </>
                          )}
                        </SubmitButton>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
