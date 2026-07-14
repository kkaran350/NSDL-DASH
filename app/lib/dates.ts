const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/**
 * The sheet mixes date formats a bit ("13-Jul-2026", "2-June-2026",
 * "06-May-2025"), which is exactly why sorting the raw strings gives
 * nonsense order. This parses "D-Mon-YYYY" (abbreviated or full month
 * name, 1 or 2 digit day) into a real timestamp for sorting, and falls
 * back to Date.parse for anything unexpected rather than throwing.
 */
export function parseLedgerDate(raw: string): number {
  if (!raw) return 0;

  const match = raw.trim().match(/^(\d{1,2})[-\s]([A-Za-z]+)[-\s](\d{4})$/);
  if (!match) {
    const fallback = Date.parse(raw);
    return Number.isNaN(fallback) ? 0 : fallback;
  }

  const [, day, monthRaw, year] = match;
  const month = MONTHS[monthRaw.toLowerCase()];
  if (month === undefined) {
    const fallback = Date.parse(raw);
    return Number.isNaN(fallback) ? 0 : fallback;
  }

  return new Date(Number(year), month, Number(day)).getTime();
}