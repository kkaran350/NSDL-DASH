import { ZohoItem } from "./types";

// Zoho accounts/API hosts differ by data centre (.com, .in, .eu, .com.au, …).
// Default to .in since that's where this org's data lives; override via env
// if that's ever not the case.
// .trim() guards against a trailing space/newline sneaking in from
// .env.local (easy to do with copy-paste) — an untrimmed host turns into
// an invalid URL like "https://accounts.zoho.in /oauth/v2/token".
const ZOHO_ACCOUNTS_BASE = (
  process.env.ZOHO_ACCOUNTS_BASE ?? "https://accounts.zoho.in"
).trim();
const ZOHO_BOOKS_BASE = (
  process.env.ZOHO_BOOKS_BASE ?? "https://www.zohoapis.in/books/v3"
).trim();

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID?.trim();
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET?.trim();
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN?.trim();
const ZOHO_ORG_ID = process.env.ZOHO_ORG_ID?.trim();

// Access tokens last ~1hr; cache in-memory for the life of this server
// process so a burst of clicks on the tab doesn't re-auth every time.
// (On a serverless/edge deploy this cache just won't persist between cold
// starts, which is fine — it's an optimization, not a correctness thing.)
//
// Stored on `globalThis` rather than a plain module-level variable because
// Next.js's dev server hot-reloads route modules on every file save, which
// would otherwise wipe this cache constantly during development and force
// a fresh token request from Zoho far more often than intended — Zoho's
// token endpoint has a fairly aggressive rate limit, so that adds up fast.
const globalForZoho = globalThis as unknown as {
  __zohoTokenCache?: { value: string; expiresAt: number } | null;
};

function getCachedToken() {
  return globalForZoho.__zohoTokenCache ?? null;
}

function setCachedToken(token: { value: string; expiresAt: number }) {
  globalForZoho.__zohoTokenCache = token;
}

function clearCachedToken() {
  globalForZoho.__zohoTokenCache = null;
}

// If two requests land at nearly the same moment (a hot reload remount, a
// double-fired effect, a quick double-click of refresh) and both see an
// expired/missing cache, they'd otherwise both fire a refresh against Zoho
// at once — which is exactly the kind of race that leads to intermittent
// "token looked fine but then got rejected" behaviour. This in-flight
// promise makes every caller share the *same* refresh instead.
const globalForZohoLock = globalThis as unknown as {
  __zohoTokenRefreshInFlight?: Promise<string> | null;
};

async function getAccessToken(forceRefresh = false): Promise<string> {
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error(
      "Zoho credentials are not set. Add ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET " +
        "and ZOHO_REFRESH_TOKEN to your environment (see .env.example)."
    );
  }

  if (!forceRefresh) {
    const existing = getCachedToken();
    if (existing && existing.expiresAt > Date.now()) {
      return existing.value;
    }
  }

  if (globalForZohoLock.__zohoTokenRefreshInFlight) {
    return globalForZohoLock.__zohoTokenRefreshInFlight;
  }

  const refreshPromise = (async () => {
    const url =
      `${ZOHO_ACCOUNTS_BASE}/oauth/v2/token` +
      `?refresh_token=${encodeURIComponent(ZOHO_REFRESH_TOKEN)}` +
      `&client_id=${encodeURIComponent(ZOHO_CLIENT_ID)}` +
      `&client_secret=${encodeURIComponent(ZOHO_CLIENT_SECRET)}` +
      `&grant_type=refresh_token`;

    const res = await fetch(url, { method: "POST", cache: "no-store" });
    const body = await res.json();

    if (!res.ok || !body.access_token) {
      throw new Error(
        `Zoho token refresh failed (${res.status}): ${JSON.stringify(body)}`
      );
    }

    // expires_in is seconds; knock 60s off as a safety margin.
    const token = {
      value: body.access_token as string,
      expiresAt: Date.now() + (Number(body.expires_in ?? 3600) - 60) * 1000,
    };
    setCachedToken(token);
    return token.value;
  })();

  globalForZohoLock.__zohoTokenRefreshInFlight = refreshPromise;
  try {
    return await refreshPromise;
  } finally {
    globalForZohoLock.__zohoTokenRefreshInFlight = null;
  }
}

/**
 * Fetches every item from Zoho Books and returns just what the diff needs:
 * SKU (ISIN), name, and current stock on hand.
 */
export async function fetchZohoItems(): Promise<ZohoItem[]> {
  if (!ZOHO_ORG_ID) {
    throw new Error("ZOHO_ORG_ID is not set. Add it to your environment.");
  }

  let token = await getAccessToken();
  const items: ZohoItem[] = [];
  let page = 1;
  const perPage = 200;
  let retriedAfter401 = false;

  while (true) {
    const url = `${ZOHO_BOOKS_BASE}/items?organization_id=${ZOHO_ORG_ID}&per_page=${perPage}&page=${page}`;
    const res = await fetch(url, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
      cache: "no-store",
    });

    if (res.status === 401 && !retriedAfter401) {
      // The token we had looked valid but Zoho rejected it anyway (seen
      // intermittently, likely from a refresh race elsewhere). Throw away
      // whatever's cached, force a brand-new token, and try this same page
      // once more before giving up.
      retriedAfter401 = true;
      clearCachedToken();
      token = await getAccessToken(true);
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Zoho items fetch failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as { items?: any[] };
    const batch = json.items ?? [];
    if (batch.length === 0) break;

    for (const item of batch) {
      const sku = String(item.sku ?? "").trim();
      if (!sku) continue; // skip non-stock service/expense items, same as the test script
      items.push({
        sku: sku.toUpperCase(),
        name: String(item.name ?? "").trim(),
        stock: Number(item.stock_on_hand ?? item.available_stock ?? 0),
      });
    }

    if (batch.length < perPage) break;
    page++;
  }

  return items;
}