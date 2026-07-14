"use client";

import { Holding, HoldingsSnapshot, QuantityDelta, DailyChange } from "./types";

const HISTORY_KEY = "holdings-dashboard:history";
const MAX_SNAPSHOTS = 288; // 24h of 5-min snapshots

/**
 * Trend history here is stored per-browser (localStorage), not in a
 * database. There's no backend store wired up yet, so quantity-change
 * tracking only accumulates while this browser keeps polling — it won't
 * be shared across devices or survive clearing site data. Wire up a real
 * datastore (e.g. a small table keyed by fetchedAt) if cross-device trend
 * history is needed later.
 */
export function loadHistory(): HoldingsSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HoldingsSnapshot[];
  } catch {
    return [];
  }
}

export function appendSnapshot(holdings: Holding[]): HoldingsSnapshot[] {
  if (typeof window === "undefined") return [];
  const history = loadHistory();
  const snapshot: HoldingsSnapshot = {
    fetchedAt: new Date().toISOString(),
    holdings,
  };
  const next = [...history, snapshot].slice(-MAX_SNAPSHOTS);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // storage full or unavailable — trend just won't extend this round
  }
  return next;
}

export function computeDeltas(
  previous: Holding[] | undefined,
  current: Holding[]
): QuantityDelta[] {
  if (!previous) return [];
  const prevMap = new Map(previous.map((h) => [h.isin, h.quantity]));
  return current
    .map((h) => {
      const prevQty = prevMap.get(h.isin);
      if (prevQty === undefined) return null;
      const change = h.quantity - prevQty;
      if (change === 0) return null;
      return {
        isin: h.isin,
        previousQuantity: prevQty,
        currentQuantity: h.quantity,
        change,
      };
    })
    .filter((d): d is QuantityDelta => d !== null);
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * "Today's change" needs to survive every 5-minute poll, unlike the
 * since-last-sync delta which only compares two adjacent snapshots. This
 * walks every snapshot captured so far today (in this browser) plus the
 * current fetch, and sums each step's move into additions or subtractions
 * per ISIN — so a holding that goes up, then down, then up again shows
 * both totals rather than just netting out to a small number.
 */
export function computeDailyChanges(
  history: HoldingsSnapshot[],
  current: Holding[]
): DailyChange[] {
  const now = new Date();
  const todaySnapshots = history.filter((s) =>
    isSameLocalDay(new Date(s.fetchedAt), now)
  );

  const sequence: HoldingsSnapshot[] = [
    ...todaySnapshots,
    { fetchedAt: now.toISOString(), holdings: current },
  ].sort(
    (a, b) => new Date(a.fetchedAt).getTime() - new Date(b.fetchedAt).getTime()
  );

  const totals = new Map<string, { additions: number; subtractions: number }>();

  for (let i = 1; i < sequence.length; i++) {
    const prevMap = new Map(sequence[i - 1].holdings.map((h) => [h.isin, h.quantity]));
    for (const h of sequence[i].holdings) {
      const prevQty = prevMap.get(h.isin);
      if (prevQty === undefined) continue;
      const diff = h.quantity - prevQty;
      if (diff === 0) continue;
      const entry = totals.get(h.isin) ?? { additions: 0, subtractions: 0 };
      if (diff > 0) entry.additions += diff;
      else entry.subtractions += Math.abs(diff);
      totals.set(h.isin, entry);
    }
  }

  return Array.from(totals.entries()).map(([isin, v]) => ({
    isin,
    additions: v.additions,
    subtractions: v.subtractions,
    net: v.additions - v.subtractions,
  }));
}