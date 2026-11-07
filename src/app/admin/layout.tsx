import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, LogOut, ShieldCheck } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { can, ROLE_LABELS, type Permission } from "@/lib/permissions";
import { getRepository } from "@/lib/data";
import { AdminNav } from "@/components/admin/admin-nav";
import { BrandMark } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { signOutAction } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | NPL Admin" },
  robots: { index: false, follow: false, nocache: true },
};

const ALL_PERMISSIONS: Permission[] = [
  "admin.access",
  "scores.manage",
  "news.manage",
  "comments.moderate",
  "users.manage",
  "system.manage",
  "competition.manage",
];

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePermission("admin.access");
  const permissions = ALL_PERMISSIONS.filter((permission) => can(session.role, permission));
  const demo = getRepository().isDemo;

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="container-page flex h-14 items-center gap-3">
          <BrandMark compact />
          <Badge variant="dark" className="bg-primary/10 text-primary ring-0">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Admin
          </Badge>
          {demo ? (
            <Badge variant="accent" className="hidden sm:inline-flex">
              Demo data
            </Badge>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              View site
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold leading-tight">{session.username}</p>
              <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[session.role]}</p>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
        <div className="container-page py-2 lg:hidden">
          <AdminNav permissions={permissions} variant="mobile" />
        </div>
      </header>

      <div className="container-page grid gap-6 py-6 lg:grid-cols-[240px_1fr] lg:py-8">
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <AdminNav permissions={permissions} />
            <div className="rounded-lg border border-border bg-surface p-3 text-[11px] leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Operational access</p>
              <p className="mt-1">
                Actions are authorised on the server and recorded in the audit log. {demo ? "Demo changes reset when the server restarts." : "Changes are written to Supabase."}
              </p>
            </div>
          </div>
        </aside>
        <main id="main-content" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
