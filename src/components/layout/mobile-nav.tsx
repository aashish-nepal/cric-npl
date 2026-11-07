"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, UserCircle2, ShieldCheck, LogOut } from "lucide-react";
import { NAV_ITEMS } from "./nav-links";
import { BrandMark } from "./brand";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";

export function MobileNav({
  session,
  isAdmin,
}: {
  session: { username: string; role: string } | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close the drawer when navigation changes the pathname without an effect-driven render cascade.
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label="Open navigation menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-foreground hover:bg-muted xl:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] xl:hidden" role="dialog" aria-modal="true" aria-label="Site navigation">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 h-full w-full bg-foreground/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div
            id="mobile-menu"
            className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-surface shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <BrandMark />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-muted"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Mobile primary" className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-0.5">
                {NAV_ITEMS.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block rounded-md px-3 py-2.5 text-sm font-medium",
                          active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-5 border-t border-border pt-4">
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
                {session ? (
                  <div className="space-y-1">
                    <Link href="/fan-zone" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-muted">
                      <UserCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      {session.username}
                    </Link>
                    {isAdmin ? (
                      <Link href="/admin" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-muted">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        Admin dashboard
                      </Link>
                    ) : null}
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Sign out
                      </button>
                    </form>
                  </div>
                ) : (
                  <Link href="/auth/login" className="block rounded-md px-3 py-2.5 text-sm font-semibold text-primary hover:bg-muted">
                    Sign in
                  </Link>
                )}
              </div>
            </nav>
            <div className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
              Independent coverage · Not affiliated with the NPL or CAN
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
