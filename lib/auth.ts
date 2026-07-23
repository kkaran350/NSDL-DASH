/**
 * Session gate shared by middleware.ts and the login/logout routes.
 *
 * The credentials are still the single APP_USERNAME / APP_PASSWORD pair the
 * Basic Auth gate used — the login screen just puts a real form in front of
 * them instead of the browser's native prompt. The cookie holds a hash of
 * the configured pair, never the password itself, so it invalidates on its
 * own the moment the credentials change.
 *
 * Uses Web Crypto (not node:crypto) so it runs unchanged on the Edge runtime
 * that middleware executes in.
 */

export const SESSION_COOKIE = "hl-session";

export function isAuthConfigured(): boolean {
  return Boolean(process.env.APP_USERNAME && process.env.APP_PASSWORD);
}

export async function sessionToken(): Promise<string> {
  const raw = `${process.env.APP_USERNAME}:${process.env.APP_PASSWORD}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Length-independent comparison, so a wrong guess can't be timed. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
