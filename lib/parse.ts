import { Holding } from "./types";

/**
 * Minimal RFC4180-ish CSV parser: handles quoted fields containing commas,
 * escaped quotes (""), and CRLF/LF line endings. Good enough for a Google
 * Sheets CSV export, which is what this dashboard's data source produces.
 */
export function parseCsv(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

function toNumber(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/,/g, "").trim();
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Expects header row: ISIN | Description | Last Transaction Date |
 * Beneficiary Balance | Price | Value
 */
export function rowsToHoldings(rows: string[][]): Holding[] {
  if (rows.length === 0) return [];

  const [, ...dataRows] = rows; // drop header row

  return dataRows
    .filter((r) => r[0] && r[0].trim().length > 0)
    .map((r) => ({
      isin: (r[0] ?? "").trim(),
      description: (r[1] ?? "").trim(),
      lastTransactionDate: (r[2] ?? "").trim(),
      quantity: toNumber(r[3] ?? "0"),
      price: toNumber(r[4] ?? "0"),
      value: toNumber(r[5] ?? "0"),
    }));
}
