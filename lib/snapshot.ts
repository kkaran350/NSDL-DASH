"use client";

import { Holding, HoldingsSnapshot, QuantityDelta } from "./types";

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
