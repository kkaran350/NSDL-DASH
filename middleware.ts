import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isAuthConfigured, safeEqual, sessionToken } from "@/lib/auth";

/**
 * Site-wide login gate. Set APP_USERNAME and APP_PASSWORD as environment
 * variables (locally in .env.local, and in Vercel's Project Settings →
 * Environment Variables for the deployed site). If either is unset, the site
 * is left open — that's deliberate so a missing env var doesn't quietly lock
 * out local development, but it does mean auth is OFF until both are set.
 *
 * Anyone without a valid session cookie is redirected to /login, which posts
 * to /api/login to exchange those same credentials for the cookie. (This
 * replaces the old Basic Auth prompt — same credentials, real sign-in form.)
 */
const PUBLIC_PATHS = ["/login", "/api/login", "/api/logout"];

export async function middleware(req: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie && safeEqual(cookie, await sessionToken())) {
    return NextResponse.next();
  }

  // Bouncing an API call to /login would hand the caller an HTML page where
  // it expected JSON — give it a 401 instead and let the UI deal with it.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  if (pathname !== "/") loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Guard everything except Next's own static asset paths.
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
