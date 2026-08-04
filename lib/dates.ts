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

export function istDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}


export function isLedgerDateToday(raw: string): boolean {
  const timestamp = parseLedgerDate(raw);
  if (!timestamp) return false;

  const ledgerDate = new Date(timestamp);
  const now = new Date();
  return (
    ledgerDate.getFullYear() === now.getFullYear() &&
    ledgerDate.getMonth() === now.getMonth() &&
    ledgerDate.getDate() === now.getDate()
  );
}