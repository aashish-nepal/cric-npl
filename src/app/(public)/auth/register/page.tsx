import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRoundPlus } from "lucide-react";
import { registerAction } from "@/app/actions/auth";
import { getSession, isDemoAuth } from "@/lib/auth/session";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a fan account to vote in polls, submit predictions and join the NPL Cricket Hub community.",
  robots: { index: false, follow: true },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkEmail?: string }>;
}) {
  const [{ error, checkEmail }, session] = await Promise.all([searchParams, getSession()]);
  if (session) redirect("/fan-zone");
  const demoMode = isDemoAuth();

  return (
    <div className="container-page grid min-h-[70vh] gap-8 py-10 lg:grid-cols-[1fr_420px] lg:items-center">
      <div className="max-w-xl">
        <p className="eyebrow">Join the community</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Create your fan account</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Register to vote in fan polls, submit match predictions and comment on articles. New accounts receive the
          standard fan role; staff access is assigned separately.
        </p>
        <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <UserRoundPlus className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          Your account uses the email address you provide. If email confirmation is enabled, confirm your address before
          signing in.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-bold tracking-tight">Registration</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {demoMode ? "Local demo mode is using fixed demo accounts." : "Create a new NPL Cricket Hub account."}
        </p>

        {error ? <Alert variant="error" className="mt-4">{error}</Alert> : null}
        {checkEmail ? (
          <Alert variant="success" className="mt-4">
            If registration was accepted, check your inbox for a confirmation link before signing in.
          </Alert>
        ) : null}
        {demoMode ? (
          <Alert variant="info" className="mt-4">
            Self-service registration requires Supabase Auth. In local demo mode, use one of the demo accounts on the{" "}
            <Link href="/auth/login" className="font-semibold underline">sign-in page</Link>.
          </Alert>
        ) : (
          <form action={registerAction} className="mt-5 space-y-4">
            <Field>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                minLength={3}
                maxLength={30}
                pattern="[A-Za-z0-9_]+"
                required
                placeholder="cricketfan"
              />
            </Field>
            <Field>
              <Label htmlFor="email">Email address</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
            </Field>
            <Field>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
                placeholder="At least 8 characters"
              />
            </Field>
            <Field>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
                placeholder="Enter your password again"
              />
            </Field>
            <Button type="submit" className="w-full">Create account</Button>
          </form>
        )}

        <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
          By registering you agree to the <Link href="/terms" className="font-semibold text-primary hover:underline">terms of use</Link>{" "}
          and <Link href="/privacy-policy" className="font-semibold text-primary hover:underline">privacy policy</Link>.
        </p>
        <p className="mt-4 border-t border-border pt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
