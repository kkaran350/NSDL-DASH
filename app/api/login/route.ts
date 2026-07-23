import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isAuthConfigured, safeEqual, sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(req: NextRequest) {
  // Auth is off when the env vars aren't set (matches middleware.ts) —
  // treat sign-in as a no-op rather than locking out local development.
  if (!isAuthConfigured()) {
    return NextResponse.json({ ok: true });
  }

  let body: { username?: string; password?: string; remember?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  const usernameOk = safeEqual(username, process.env.APP_USERNAME!);
  const passwordOk = safeEqual(password, process.env.APP_PASSWORD!);

  if (!usernameOk || !passwordOk) {
    return NextResponse.json(
      { error: "That user name and password don't match." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: await sessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Without "remember me" the cookie is session-scoped, so closing the
    // browser signs them out.
    ...(body.remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
  });
  return res;
}
