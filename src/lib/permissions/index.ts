import type { UserRole } from "@/types/cricket";

export type Permission =
  | "admin.access"
  | "scores.manage"
  | "news.manage"
  | "comments.moderate"
  | "users.manage"
  | "system.manage"
  | "competition.manage";

const ROLE_RANK: Record<UserRole, number> = {
  user: 1,
  author: 2,
  moderator: 3,
  editor: 4,
  scorer: 5,
  admin: 6,
  super_admin: 7,
};

const PERMISSIONS: Record<Permission, UserRole[]> = {
  "admin.access": ["author", "moderator", "editor", "scorer", "admin", "super_admin"],
  "scores.manage": ["scorer", "admin", "super_admin"],
  "news.manage": ["author", "editor", "admin", "super_admin"],
  "comments.moderate": ["moderator", "editor", "admin", "super_admin"],
  "users.manage": ["admin", "super_admin"],
  "system.manage": ["admin", "super_admin"],
  "competition.manage": ["admin", "super_admin"],
};

export function hasRole(role: UserRole | null | undefined, minimum: UserRole): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function can(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[permission].includes(role);
}

export function isStaff(role: UserRole | null | undefined): boolean {
  return can(role, "admin.access");
}

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Registered user",
  author: "Author",
  moderator: "Moderator",
  editor: "Editor",
  scorer: "Match scorer",
  admin: "Administrator",
  super_admin: "Super administrator",
};
