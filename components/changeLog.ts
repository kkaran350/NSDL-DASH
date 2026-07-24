"use client";

import { Holding } from "@/lib/types";

/**
 * Per-ISIN "last time this browser saw the quantity change".
 *
 * The sheet only carries a date, no time — so there's no transaction time to
 * show. What we *can* show is the moment the dashboard itself noticed a
 * quantity move between two polls. That's browser-local (like the trend
 * history): it only fills in for changes this browser was open to witness,
 * and won't carry across devices. Stored as { isin: ISO-timestamp }.
 */
const CHANGE_LOG_KEY = "holdings-dashboard:change-times";

export type ChangeTimes = Record<string, string>;

export function loadChangeTimes(): ChangeTimes {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CHANGE_LOG_KEY);
    return raw ? (JSON.parse(raw) as ChangeTimes) : {};
  } catch {
    return {};
  }
}

function saveChangeTimes(times: ChangeTimes) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHANGE_LOG_KEY, JSON.stringify(times));
  } catch {
    // storage full or unavailable — this round's stamps just won't persist
  }
}

/**
 * Stamp every ISIN whose quantity differs from the previous read with the
 * time of this fetch, and return the updated map (or the same reference when
 * nothing moved, so callers can skip a re-render).
 */
export function recordChanges(
  previous: Holding[] | undefined,
  current: Holding[],
  fetchedAt: string,
  existing: ChangeTimes
): ChangeTimes {
  if (!previous || previous.length === 0) return existing;

  const prevQty = new Map(previous.map((h) => [h.isin, h.quantity]));
  let next = existing;
  let mutated = false;

  for (const h of current) {
    const before = prevQty.get(h.isin);
    if (before !== undefined && before !== h.quantity) {
      if (!mutated) {
        next = { ...existing };
        mutated = true;
      }
      next[h.isin] = fetchedAt;
    }
  }

  if (mutated) saveChangeTimes(next);
  return next;
}
