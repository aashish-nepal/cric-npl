"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Flag,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Radio,
  ServerCog,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Permission } from "@/lib/permissions";

interface AdminNavItem {
  href: string;
  label: string;
  description: string;
  icon: keyof typeof ICONS;
  permission: Permission;
  exact?: boolean;
}

const ICONS = {
  dashboard: LayoutDashboard,
  matches: Radio,
  teams: ShieldCheck,
  players: UsersRound,
  news: Newspaper,
  comments: MessageSquare,
  users: Users,
  system: ServerCog,
  analytics: BarChart3,
  flag: Flag,
} as const;

const ITEMS: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Operations overview",
    icon: "dashboard",
    permission: "admin.access",
    exact: true,
  },
  {
    href: "/admin/matches",
    label: "Matches & scoring",
    description: "Ball-by-ball console",
    icon: "matches",
    permission: "scores.manage",
  },
  {
    href: "/admin/teams",
    label: "Teams & squads",
    description: "Competition setup",
    icon: "teams",
    permission: "competition.manage",
  },
  {
    href: "/admin/players",
    label: "Players",
    description: "Player registry",
    icon: "players",
    permission: "competition.manage",
  },
  {
    href: "/admin/news",
    label: "Editorial",
    description: "Articles & drafts",
    icon: "news",
    permission: "news.manage",
  },
  {
    href: "/admin/comments",
    label: "Comments",
    description: "Fan moderation",
    icon: "comments",
    permission: "comments.moderate",
  },
  {
    href: "/admin/users",
    label: "Users & roles",
    description: "Access control",
    icon: "users",
    permission: "users.manage",
  },
  {
    href: "/admin/system",
    label: "System",
    description: "Health & audit logs",
    icon: "system",
    permission: "system.manage",
  },
];

export function AdminNav({
  permissions,
  variant = "sidebar",
}: {
  permissions: Permission[];
  variant?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();
  const allowed = ITEMS.filter((item) => permissions.includes(item.permission));

  return (
    <nav aria-label="Admin navigation" className={cn(variant === "sidebar" ? "space-y-1" : "flex gap-1 overflow-x-auto scrollbar-none pb-1")}>
      {allowed.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group rounded-md transition-colors",
              variant === "sidebar"
                ? "flex items-start gap-3 px-3 py-2.5"
                : "inline-flex shrink-0 items-center gap-2 px-3 py-2 text-xs font-semibold",
              active
                ? "bg-primary text-white"
                : variant === "sidebar"
                  ? "text-foreground hover:bg-muted"
                  : "border border-border bg-surface text-foreground hover:bg-muted",
            )}
          >
            <Icon
              className={cn(
                "shrink-0",
                variant === "sidebar" ? "mt-0.5 h-4 w-4" : "h-3.5 w-3.5",
                active ? "text-white" : "text-muted-foreground group-hover:text-primary",
              )}
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight">{item.label}</span>
              {variant === "sidebar" ? (
                <span className={cn("mt-0.5 block text-[11px]", active ? "text-white/70" : "text-muted-foreground")}>
                  {item.description}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
