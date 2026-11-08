import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogIn, ShieldCheck } from "lucide-react";
import { signInAction } from "@/app/actions/auth";
import { demoLoginHint, getSession, isDemoAuth } from "@/lib/auth/session";
import { Alert } from "@/components/ui/feedback";
import { Input, Label, Field } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to NPL Cricket Hub to vote in polls, submit predictions and manage the platform.",
  robots: { index: false, follow: true },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const session = await getSession();
  if (session) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/fan-zone");
  const hints = demoLoginHint();
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "";

  return (
    <div className="container-page grid min-h-[70vh] gap-8 py-10 lg:grid-cols-[1fr_420px] lg:items-center">
      <div className="max-w-xl">
        <p className="eyebrow">Account</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in to vote in fan polls, submit predictions, comment on articles and, for staff, access the scoring and
          editorial console.
        </p>

        <div className="mt-5 space-y-2 text-xs leading-5 text-muted-foreground">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            Sessions use a signed HttpOnly cookie in demo mode, or Supabase Auth when configured.
          </p>
          <p className="flex items-start gap-2">
            <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            Admin routes enforce permissions on the server; hiding a link is never the only protection.
          </p>
        </div>

        {hints ? (
          <section className="mt-6 rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-bold tracking-tight">Demo accounts</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Available only in local development. Replace these credentials before any public deployment.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-1.5 pr-3">Role</th>
                    <th className="py-1.5 pr-3">Email</th>
                    <th className="py-1.5">Password</th>
                  </tr>
                </thead>
                <tbody>
                  {hints.map((account) => (
                    <tr key={account.email} className="border-b border-border/60 last:border-0">
                      <td className="py-1.5 pr-3 font-medium capitalize">{account.role.replaceAll("_", " ")}</td>
                      <td className="py-1.5 pr-3 font-mono text-[11px]">{account.email}</td>
                      <td className="py-1.5 font-mono text-[11px]">{account.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-bold tracking-tight">Welcome back</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {isDemoAuth() ? "Demo authentication is active on this build." : "Sign in with your NPL Cricket Hub account."}
        </p>

        {error ? (
          <Alert variant="error" className="mt-4">
            {error}
          </Alert>
        ) : null}

        <form action={signInAction} className="mt-5 space-y-4">
          {safeNext ? <input type="hidden" name="next" value={safeNext} /> : null}
          <Field>
            <Label htmlFor="email">Email address</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          </Field>
          <Field>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="Your password" />
          </Field>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
          By signing in you agree to the <Link href="/terms" className="font-semibold text-primary hover:underline">terms of use</Link>{" "}
          and <Link href="/privacy-policy" className="font-semibold text-primary hover:underline">privacy policy</Link>.
        </p>
        <p className="mt-4 border-t border-border pt-4 text-center text-sm text-muted-foreground">
          New to NPL Cricket Hub?{" "}
          <Link href="/auth/register" className="font-semibold text-primary hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
