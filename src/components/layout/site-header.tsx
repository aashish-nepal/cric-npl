import Link from "next/link";
import { LogIn, ShieldCheck, UserCircle2, Radio } from "lucide-react";
import { getSession, can } from "@/lib/auth/session";
import { loadSite } from "@/services/cricket";
import { getRepository } from "@/lib/data";
import { BrandMark } from "./brand";
import { NavLinks } from "./nav-links";
import { MobileNav } from "./mobile-nav";
import { SeasonSelector } from "./season-selector";
import { SearchDialog } from "@/components/search/search-dialog";

function todayLabel(): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kathmandu",
  }).format(new Date());
}

export async function SiteHeader() {
  const [session, site] = await Promise.all([getSession(), loadSite()]);
  const admin = can(session?.role, "admin.access");
  const demo = getRepository().isDemo;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/90">
      <div className="bg-primary-dark text-white">
        <div className="container-page flex h-8 items-center justify-between gap-3 text-[11px]">
          <p className="flex items-center gap-1.5 font-medium">
            <Radio className="h-3 w-3 text-accent" aria-hidden="true" />
            Independent Nepali cricket coverage
            {demo ? <span className="ml-1 rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">Demo</span> : null}
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden text-white/70 sm:inline">{todayLabel()} · Kathmandu</span>
            <Link href="/ne" className="font-semibold text-white/85 hover:text-white" hrefLang="ne" lang="ne">
              नेपाली
            </Link>
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center gap-3">
        <BrandMark className="shrink-0" />
        <NavLinks className="ml-2 hidden min-w-0 flex-1 overflow-x-auto scrollbar-none xl:flex" />
        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden md:block">
            <SeasonSelector seasons={site.seasons} activeSlug={site.activeSeason.slug} />
          </div>
          <SearchDialog />
          {session ? (
            <div className="hidden items-center gap-1.5 md:flex">
              {admin ? (
                <Link
                  href="/admin"
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Admin
                </Link>
              ) : null}
              <Link
                href="/fan-zone"
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                <UserCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {session.username}
              </Link>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="hidden h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-dark md:inline-flex"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              Sign in
            </Link>
          )}
          <MobileNav
            session={session ? { username: session.username, role: session.role } : null}
            isAdmin={admin}
          />
        </div>
      </div>
      <div className="container-page flex items-center gap-2 border-t border-border/70 py-1.5 md:hidden">
        <SeasonSelector seasons={site.seasons} activeSlug={site.activeSeason.slug} />
        <span className="text-[11px] text-muted-foreground">Season context</span>
        {!session ? (
          <Link href="/auth/login" className="ml-auto text-[11px] font-semibold text-primary">
            Sign in
          </Link>
        ) : (
          <Link href="/fan-zone" className="ml-auto text-[11px] font-semibold text-primary">
            {session.username}
          </Link>
        )}
      </div>
    </header>
  );
}
