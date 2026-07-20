"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Holding, QuantityDelta, DailyChange } from "@/lib/types";
import { appendSnapshot, loadHistory, computeDeltas, computeDailyChanges } from "@/lib/snapshot";
import { isSheetDataSane } from "@/lib/validate";
import {
  ThemeMode,
  AccentKey,
  loadThemePrefs,
  saveThemePrefs,
  applyThemeToDocument,
  getChartColors,
} from "@/lib/theme";
import SyncStamp from "./SyncStamp";
import ThemeToggle from "./ThemeToggle";
import SummaryCards from "./SummaryCards";
// import TopHoldingsChart from "./TopHoldingsChart";
// import AllocationChart from "./AllocationChart";
import HoldingsTable from "./HoldingsTable";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes, matching the depository refresh
const REFRESH_COOLDOWN_MS = 20 * 1000; // minimum gap between manual refreshes

export default function Dashboard() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [deltas, setDeltas] = useState<QuantityDelta[]>([]);
  const [dailyChanges, setDailyChanges] = useState<DailyChange[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL_MS / 1000);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const [theme, setTheme] = useState<ThemeMode>("light");
  const [accent, setAccent] = useState<AccentKey>("green");

  const previousHoldingsRef = useRef<Holding[] | undefined>(undefined);
  const lastFetchAtRef = useRef<number>(0);

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/holdings", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load holdings");

      const nextHoldings: Holding[] = json.holdings;
      const previousCount = previousHoldingsRef.current?.length ?? null;
      const sanity = isSheetDataSane(nextHoldings, previousCount);

      if (!sanity.ok) {
        // Don't let a bad read (e.g. sheet caught mid-write) overwrite a
        // good dashboard — keep showing the last known-good data instead.
        setError(`Skipped a bad read: ${sanity.reason}. Showing the last good sync.`);
        return;
      }

      const newDeltas = computeDeltas(previousHoldingsRef.current, nextHoldings);

      previousHoldingsRef.current = nextHoldings;
      setHoldings(nextHoldings);
      setDeltas(newDeltas);
      setLastSyncedAt(json.fetchedAt);
      setError(null);

      const historyBeforeThisFetch = loadHistory();
      setDailyChanges(computeDailyChanges(historyBeforeThisFetch, nextHoldings));
      appendSnapshot(nextHoldings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSyncing(false);
      setCountdown(POLL_INTERVAL_MS / 1000);
      lastFetchAtRef.current = Date.now();
    }
  }, []);

  const handleForceRefresh = useCallback(() => {
    if (cooldownRemaining > 0 || isSyncing) return;
    fetchData();
    setCooldownRemaining(REFRESH_COOLDOWN_MS / 1000);
  }, [fetchData, cooldownRemaining, isSyncing]);

  useEffect(() => {
    // Seed the previous-quantity baseline from this browser's local history,
    // if any, so a change shows up even on the very first fetch after reload.
    const history = loadHistory();
    if (history.length > 0) {
      previousHoldingsRef.current = history[history.length - 1].holdings;
    }
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
      setCooldownRemaining((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Load saved theme/accent once on mount (the blocking script in layout.tsx
  // already applied them to <html> before paint — this just syncs React
  // state so components like ThemeToggle and the charts know what's active).
  useEffect(() => {
    const prefs = loadThemePrefs();
    setTheme(prefs.theme);
    setAccent(prefs.accent);
  }, []);

  function handleThemeChange(next: ThemeMode) {
    setTheme(next);
    applyThemeToDocument(next, accent);
    saveThemePrefs(next, accent);
  }

  function handleAccentChange(next: AccentKey) {
    setAccent(next);
    applyThemeToDocument(theme, next);
    saveThemePrefs(theme, next);
  }

  const chartColors = getChartColors(theme, accent);

  return (
    <div className="min-h-screen px-5 py-8 sm:px-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">
            Depository Holdings
          </div>
          <h1 className="font-display text-3xl italic text-ink sm:text-4xl">
            Holdings Ledger
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SyncStamp
            lastSyncedAt={lastSyncedAt}
            nextSyncInSeconds={countdown}
            isSyncing={isSyncing}
            error={error}
          />
          <button
            onClick={handleForceRefresh}
            disabled={isSyncing || cooldownRemaining > 0}
            className="rounded border border-accent px-3 py-2 font-mono text-xs uppercase tracking-wider text-accent transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSyncing
              ? "Refreshing…"
              : cooldownRemaining > 0
              ? `Wait ${cooldownRemaining}s`
              : "Force refresh"}
          </button>
          <ThemeToggle
            theme={theme}
            accent={accent}
            onThemeChange={handleThemeChange}
            onAccentChange={handleAccentChange}
          />
          <button
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="rounded border border-border px-3 py-2 font-mono text-xs uppercase tracking-wider text-ink-soft transition hover:border-alert hover:text-alert"
          >
            Log out
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded border border-alert bg-alert-soft px-4 py-3 text-sm text-alert">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <SummaryCards holdings={holdings} dailyChanges={dailyChanges} />

       

        <HoldingsTable holdings={holdings} deltas={deltas} dailyChanges={dailyChanges} />
      </div>

      <footer className="mt-8 text-xs text-ink-soft">
        Quantity-change tracking builds up from this browser’s own polling
        history (stored locally) — it resets if you clear site data, and
        won’t carry across devices until a shared datastore is wired in.
      </footer>
    </div>
  );
}