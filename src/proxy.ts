import { NextResponse, type NextRequest } from "next/server";

/**
 * Defense-in-depth gate for admin routes.
 *
 * Authorisation itself is enforced in the admin layout, every admin page and every
 * server action. This proxy only avoids rendering an admin shell for requests that
 * clearly have no session at all. It intentionally does not attempt to verify roles.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const hasDemoSession = request.cookies.has("npl_session");
  const hasSupabaseSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));

  if (!hasDemoSession && !hasSupabaseSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
