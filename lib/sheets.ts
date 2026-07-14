import { Holding } from "./types";
import { parseCsv, rowsToHoldings } from "./parse";

const SHEET_ID = process.env.SHEET_ID;
const SHEET_GID = process.env.SHEET_GID ?? "0";
const SHEET_RANGE = process.env.SHEET_RANGE ?? "Sheet1";
const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const ACCESS_MODE = (process.env.SHEET_ACCESS_MODE ?? "csv").toLowerCase();

/**
 * Mode "csv" (default): reads the sheet's published CSV export. Requires
 * the sheet's sharing setting to be "Anyone with the link can view" — no
 * credentials needed. Simplest option to keep the 5-minute poll working
 * without managing a service account.
 *
 * Mode "api": reads via the Google Sheets API v4 with a restricted API key.
 * Needed if the sheet must stay unlisted/link-sharing off, in which case
 * swap to a service account with domain-restricted sharing instead of a
 * bare API key.
 */
export async function fetchHoldings(): Promise<Holding[]> {
  if (!SHEET_ID) {
    throw new Error(
      "SHEET_ID is not set. Add it to your environment (see .env.example)."
    );
  }

  if (ACCESS_MODE === "api") {
    return fetchViaSheetsApi();
  }
  return fetchViaCsvExport();
}

async function fetchViaCsvExport(): Promise<Holding[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(
      `Sheet CSV export failed (${res.status}). Confirm the sheet is shared as "Anyone with the link can view".`
    );
  }

  const csv = await res.text();
  const rows = parseCsv(csv);
  return rowsToHoldings(rows);
}

async function fetchViaSheetsApi(): Promise<Holding[]> {
  if (!GOOGLE_SHEETS_API_KEY) {
    throw new Error(
      "SHEET_ACCESS_MODE=api requires GOOGLE_SHEETS_API_KEY to be set."
    );
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    SHEET_RANGE
  )}?key=${GOOGLE_SHEETS_API_KEY}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Sheets API request failed (${res.status}).`);
  }

  const json = (await res.json()) as { values?: string[][] };
  return rowsToHoldings(json.values ?? []);
}
