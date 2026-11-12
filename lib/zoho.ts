import { ZohoItem } from "./types";

// Zoho accounts/API hosts differ by data centre (.com, .in, .eu, .com.au, …).
// Default to .in since that's where this org's data lives; override via env
// if that's ever not the case.
const ZOHO_ACCOUNTS_BASE =
  process.env.ZOHO_ACCOUNTS_BASE ?? "https://accounts.zoho.in";
const ZOHO_BOOKS_BASE =
  process.env.ZOHO_BOOKS_BASE ?? "https://www.zohoapis.in/books/v3";

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_ORG_ID = process.env.ZOHO_ORG_ID;

// Access tokens last ~1hr; cache in-memory for the life of this server
// process so a burst of clicks on the tab doesn't re-auth every time.
// (On a serverless/edge deploy this cache just won't persist between cold
// starts, which is fine — it's an optimization, not a correctness thing.)
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error(
      "Zoho credentials are not set. Add ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET " +
        "and ZOHO_REFRESH_TOKEN to your environment (see .env.example)."
    );
  }

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

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
  cachedToken = {
    value: body.access_token,
    expiresAt: Date.now() + (Number(body.expires_in ?? 3600) - 60) * 1000,
  };

  return cachedToken.value;
}

/**
 * Fetches every item from Zoho Books and returns just what the diff needs:
 * SKU (ISIN), name, and current stock on hand.
 */
export async function fetchZohoItems(): Promise<ZohoItem[]> {
  if (!ZOHO_ORG_ID) {
    throw new Error("ZOHO_ORG_ID is not set. Add it to your environment.");
  }

  const token = await getAccessToken();
  const items: ZohoItem[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const url = `${ZOHO_BOOKS_BASE}/items?organization_id=${ZOHO_ORG_ID}&per_page=${perPage}&page=${page}`;
    const res = await fetch(url, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
      cache: "no-store",
    });

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
