"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    redirect(`/auth/login?error=${encodeURIComponent("Email and password are required.")}`);
  }

  const maxAttempts = Number(process.env.LOGIN_RATE_LIMIT_MAX ?? "8") || 8;
  const limit = rateLimit(`login:${email.toLowerCase()}`, maxAttempts, 15 * 60 * 1000);
  if (!limit.ok) {
    redirect(`/auth/login?error=${encodeURIComponent("Too many attempts. Try again in a few minutes.")}`);
  }

  const result = await signIn(email, password);
  if (!result.ok) {
    redirect(`/auth/login?error=${encodeURIComponent(result.error ?? "Sign in failed.")}`);
  }

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/fan-zone";
  redirect(safeNext);
}

export async function signOutAction() {
  await signOut();
  redirect("/");
}
