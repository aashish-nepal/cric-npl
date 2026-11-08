"use server";

import { redirect } from "next/navigation";
import { register, signIn, signOut } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { registrationSchema } from "@/lib/validation";

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

export async function registerAction(formData: FormData) {
  const parsed = registrationSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    redirect(`/auth/register?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the registration details.")}`);
  }

  const { username, email, password } = parsed.data;
  const limit = rateLimit(`register:${email}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    redirect(`/auth/register?error=${encodeURIComponent("Too many registration attempts. Try again in an hour.")}`);
  }

  const result = await register(email, password, username);
  if (!result.ok) {
    redirect(`/auth/register?error=${encodeURIComponent(result.error ?? "Account creation failed.")}`);
  }
  if (result.authenticated) redirect("/fan-zone");
  redirect("/auth/register?checkEmail=1");
}

export async function signOutAction() {
  await signOut();
  redirect("/");
}
