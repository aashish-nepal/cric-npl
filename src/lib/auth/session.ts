import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import type { UserRole } from "@/types/cricket";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { can, hasRole, type Permission } from "@/lib/permissions";

export const SESSION_COOKIE = "npl_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

interface DemoTokenPayload extends SessionUser {
  iat: number;
  exp: number;
}

function demoSecret(): string | null {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV !== "production") return "dev-only-insecure-secret-change-me";
  return null;
}

function sign(payload: string): string | null {
  const secret = demoSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

function encodeDemoToken(user: SessionUser): string | null {
  const now = Math.floor(Date.now() / 1000);
  const payload: DemoTokenPayload = { ...user, iat: now, exp: now + SESSION_TTL_SECONDS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded);
  if (!signature) return null;
  return `${encoded}.${signature}`;
}

function decodeDemoToken(token: string): SessionUser | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  if (!expected || !safeEqual(expected, signature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as DemoTokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.id || !payload.email || !payload.role) return null;
    return { id: payload.id, email: payload.email, username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

export function isDemoAuth(): boolean {
  return !isSupabaseConfigured();
}

export async function getSupabaseAuthClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase Auth is not configured");
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component; cookie refresh happens in middleware/actions.
        }
      },
    },
  });
}

export async function getSession(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    return token ? decodeDemoToken(token) : null;
  }

  const supabase = await getSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, role, suspended")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profile?.suspended) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    username: profile?.username ?? data.user.email?.split("@")[0] ?? "user",
    role: (profile?.role as UserRole | undefined) ?? "user",
  };
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  return session;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const session = await getSession();
  if (!session || !can(session.role, permission)) redirect("/auth/login?error=forbidden");
  return session;
}

export async function requireRole(minimum: UserRole): Promise<SessionUser> {
  const session = await getSession();
  if (!session || !hasRole(session.role, minimum)) redirect("/auth/login?error=forbidden");
  return session;
}

interface DemoAccount {
  id: string;
  email: string;
  password: string;
  username: string;
  role: UserRole;
}

function demoAccounts(): DemoAccount[] {
  const dev = process.env.NODE_ENV !== "production";
  return [
    {
      id: "user-admin",
      email: process.env.ADMIN_EMAIL ?? "admin@nplcrickethub.local",
      password: process.env.ADMIN_PASSWORD ?? (dev ? "demo-admin-password" : ""),
      username: "npl_admin",
      role: "super_admin",
    },
    {
      id: "user-editor",
      email: process.env.EDITOR_EMAIL ?? "editor@nplcrickethub.local",
      password: process.env.EDITOR_PASSWORD ?? (dev ? "demo-editor-password" : ""),
      username: "editor",
      role: "editor",
    },
    {
      id: "user-fan",
      email: process.env.FAN_EMAIL ?? "fan@nplcrickethub.local",
      password: process.env.FAN_PASSWORD ?? (dev ? "demo-fan-password" : ""),
      username: "cricketfan",
      role: "user",
    },
  ];
}

export async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseAuthClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const account = demoAccounts().find((row) => row.email.toLowerCase() === email.trim().toLowerCase());
  if (!account || !account.password || !safeEqual(account.password, password)) {
    return { ok: false, error: "Invalid email or password." };
  }
  const token = encodeDemoToken({
    id: account.id,
    email: account.email,
    username: account.username,
    role: account.role,
  });
  if (!token) return { ok: false, error: "AUTH_SECRET is not configured." };
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return { ok: true };
}

export async function register(
  email: string,
  password: string,
  username: string,
): Promise<{ ok: boolean; authenticated?: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Registration is available when Supabase Auth is configured. Use a local demo account instead." };
  }

  const supabase = await getSupabaseAuthClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  let emailRedirectTo: string | undefined;
  if (siteUrl) {
    try {
      const url = new URL(siteUrl);
      const localHttp = url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
      if (url.protocol !== "https:" && !localHttp) {
        return { ok: false, error: "The site URL must use HTTPS." };
      }
      emailRedirectTo = new URL("/auth/confirm", url).toString();
    } catch {
      return { ok: false, error: "The site URL is not valid. Check NEXT_PUBLIC_SITE_URL." };
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      ...(emailRedirectTo ? { emailRedirectTo } : {}),
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, authenticated: Boolean(data.session) };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseAuthClient();
    await supabase.auth.signOut();
    return;
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function demoLoginHint(): Array<{ role: string; email: string; password: string }> | null {
  if (!isDemoAuth() || process.env.NODE_ENV === "production") return null;
  return demoAccounts().map((account) => ({ role: account.role, email: account.email, password: account.password }));
}

export { can, hasRole };
