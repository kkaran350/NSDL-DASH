export interface Holding {
  isin: string;
  description: string;
  lastTransactionDate: string;
  quantity: number;
  price: number;
  value: number;
}

export interface DailyChange {
  isin: string;
  additions: number;
  subtractions: number;
  net: number;
}

/** A single detected quantity change, as stored in the Movements sheet. */
export interface Movement {
  previousQuantity: number;
  currentQuantity: number;
  change: number;
  detectedAt: string; // ISO timestamp
}

/** All of today's movements for one ISIN, individually and summed. */
export interface IsinMovements {
  isin: string;
  description: string;
  additions: number;
  subtractions: number;
  net: number;
  transactions: Movement[];
}

/** Response shape for GET /api/movements/today. */
export interface TodayMovements {
  ledgerDate: string; // yyyy-mm-dd, IST
  totals: { additions: number; subtractions: number };
  byIsin: IsinMovements[];
}

/** One entry in the all-time "most frequently changed" ranking. */
export interface FrequencyEntry {
  isin: string;
  description: string;
  count: number;
}

export interface FrequencyResponse {
  top: FrequencyEntry | null;
  all: FrequencyEntry[];
}

/** One item as returned by the Zoho Books /items endpoint. */
export interface ZohoItem {
  sku: string; // ISIN, stored as the item's SKU in Zoho
  name: string;
  stock: number;
}

export type ZohoDiffStatus = "match" | "mismatch" | "zoho_only" | "nsdl_only";

/** One row of the Zoho-vs-NSDL comparison, keyed by ISIN/SKU. */
export interface ZohoDiffRow {
  isin: string;
  zohoName: string | null;
  nsdlDescription: string | null;
  zohoStock: number | null;
  nsdlBalance: number | null;
  diff: number | null;
  status: ZohoDiffStatus;
}

/** Response shape for GET /api/zoho/diff. */
export interface ZohoDiffResponse {
  fetchedAt: string;
  rows: ZohoDiffRow[];
  summary: {
    matched: number;
    mismatched: number;
    zohoOnly: number;
    nsdlOnly: number;
  };
}