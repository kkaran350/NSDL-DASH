import { NextRequest, NextResponse } from "next/server";

/**
 * Simple site-wide Basic Auth gate. Set APP_USERNAME and APP_PASSWORD as
 * environment variables (locally in .env.local, and in Vercel's Project
 * Settings → Environment Variables for the deployed site). If either is
 * unset, the site is left open — that's deliberate so a missing env var
 * doesn't quietly lock out local development, but it does mean auth is
 * OFF until both are set.
 */
export function middleware(req: NextRequest) {
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;

  if (!username || !password) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Basic ")) {
    const encoded = authHeader.slice("Basic ".length);
    try {
      const decoded = atob(encoded);
      const separatorIndex = decoded.indexOf(":");
      const user = decoded.slice(0, separatorIndex);
      const pass = decoded.slice(separatorIndex + 1);
      if (user === username && pass === password) {
        return NextResponse.next();
      }
    } catch {
      // fall through to 401 below
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Holdings Ledger", charset="UTF-8"',
    },
  });
}

export const config = {
  // Guard everything except Next's own static asset paths.
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};