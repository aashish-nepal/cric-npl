import { NextResponse } from "next/server";
import { getSupabaseAuthClient } from "@/lib/auth/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (!code && (!tokenHash || (type !== "signup" && type !== "email"))) {
    return NextResponse.redirect(new URL("/auth/login?error=The%20confirmation%20link%20is%20invalid%20or%20expired.", url));
  }

  try {
    const supabase = await getSupabaseAuthClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type as "signup" | "email" });
    if (error) {
      return NextResponse.redirect(new URL("/auth/login?error=The%20confirmation%20link%20is%20invalid%20or%20expired.", url));
    }
    return NextResponse.redirect(new URL("/fan-zone", url));
  } catch {
    return NextResponse.redirect(new URL("/auth/login?error=Email%20confirmation%20could%20not%20be%20completed.", url));
  }
}
