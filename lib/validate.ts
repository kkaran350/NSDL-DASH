import { Holding } from "./types";

// Real ISINs are 2 letters + 9 alphanumeric + 1 check digit = 12 chars.
const ISIN_REGEX = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

export function isPlausibleIsin(isin: string): boolean {
  return ISIN_REGEX.test(isin.trim());
}

export function isSheetDataSane(
  holdings: Holding[],
  previousCount: number | null
): { ok: boolean; reason?: string } {
  if (holdings.length === 0) {
    return { ok: false, reason: "the sheet returned no rows" };
  }

  const validIsinCount = holdings.filter((h) => isPlausibleIsin(h.isin)).length;
  const validRatio = validIsinCount / holdings.length;
  if (validRatio < 0.8) {
    return {
      ok: false,
      reason: "most rows don't look like valid ISINs — likely caught the sheet mid-write",
    };
  }

  if (previousCount !== null && holdings.length < previousCount * 0.5) {
    return {
      ok: false,
      reason: "row count dropped sharply since the last good sync — likely a partial write",
    };
  }

  return { ok: true };
}