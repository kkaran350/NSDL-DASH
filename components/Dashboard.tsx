"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Holding, QuantityDelta } from "@/lib/types";
import { appendSnapshot, loadHistory, computeDeltas } from "@/lib/snapshot";
import SyncStamp from "./SyncStamp";
import SummaryCards from "./SummaryCards";
import TopHoldingsChart from "./TopHoldingsChart";
import AllocationChart from "./AllocationChart";
import HoldingsTable from "./HoldingsTable";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes, matching the depository refresh

export default function Dashboard() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [deltas, setDeltas] = useState<QuantityDelta[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL_MS / 1000);

  const previousHoldingsRef = useRef<Holding[] | undefined>(undefined);

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/holdings", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load holdings");

      const nextHoldings: Holding[] = json.holdings;
      const newDeltas = computeDeltas(previousHoldingsRef.current, nextHoldings);

      previousHoldingsRef.current = nextHoldings;
      setHoldings(nextHoldings);
      setDeltas(newDeltas);
      setLastSyncedAt(json.fetchedAt);
      setError(null);
      appendSnapshot(nextHoldings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSyncing(false);
      setCountdown(POLL_INTERVAL_MS / 1000);
    }
  }, []);

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
    }, 1000);
    return () => clearInterval(tick);
  }, []);

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
        <SyncStamp
          lastSyncedAt={lastSyncedAt}
          nextSyncInSeconds={countdown}
          isSyncing={isSyncing}
          error={error}
        />
      </header>

      {error && (
        <div className="mb-6 rounded border border-alert bg-alert-soft px-4 py-3 text-sm text-alert">
          Couldn’t refresh from the sheet: {error}. Showing the last successful
          sync.
        </div>
      )}

      <div className="space-y-6">
        <SummaryCards holdings={holdings} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TopHoldingsChart holdings={holdings} />
          <AllocationChart holdings={holdings} />
        </div>

        <HoldingsTable holdings={holdings} deltas={deltas} />
      </div>

      <footer className="mt-8 text-xs text-ink-soft">
        Quantity-change tracking builds up from this browser’s own polling
        history (stored locally) — it resets if you clear site data, and
        won’t carry across devices until a shared datastore is wired in.
      </footer>
    </div>
  );
}
