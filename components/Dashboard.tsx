"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Holding, DailyChange } from "@/lib/types";
import { appendSnapshot, loadHistory, computeDailyChanges } from "@/lib/snapshot";
import { isSheetDataSane, isPlausibleIsin } from "@/lib/validate";
import {
  ThemeMode,
  AccentKey,
  loadThemePrefs,
  saveThemePrefs,
  applyThemeToDocument,
} from "@/lib/theme";
import SyncStamp from "./SyncStamp";
import ThemeToggle from "./ThemeToggle";
import SummaryCards from "./SummaryCards";
import HoldingsTable from "./HoldingsTable";
import AccountMenu from "./AccountMenu";
import { ChevronDownIcon, RefreshIcon } from "./icons";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes, matching the depository refresh
const REFRESH_COOLDOWN_MS = 20 * 1000; // minimum gap between manual refreshes

const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME ?? "Mittal Portfolios Pvt. Ltd.";

export default function Dashboard() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [dailyChanges, setDailyChanges] = useState<DailyChange[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL_MS / 1000);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [statsOpen, setStatsOpen] = useState(true);

  const [theme, setTheme] = useState<ThemeMode>("light");
  // The redesign is light/dark only — accent is carried through untouched so
  // the saved preference still round-trips.
  const [accent, setAccent] = useState<AccentKey>("green");

  const previousHoldingsRef = useRef<Holding[] | undefined>(undefined);

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

      // The sheet repeats its header row partway down, which otherwise
      // lands in the ledger as a row reading "ISIN / Description / …" and
      // inflates the company count. Drop anything whose first column isn't
      // a real ISIN — after the sanity check above, so that check still
      // sees the raw shape of the read.
      const cleanHoldings = nextHoldings.filter((h) => isPlausibleIsin(h.isin));

      previousHoldingsRef.current = cleanHoldings;
      setHoldings(cleanHoldings);
      setLastSyncedAt(json.fetchedAt);
      setError(null);

      const historyBeforeThisFetch = loadHistory();
      setDailyChanges(computeDailyChanges(historyBeforeThisFetch, cleanHoldings));
      appendSnapshot(cleanHoldings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSyncing(false);
      setCountdown(POLL_INTERVAL_MS / 1000);
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

  // The blocking script in layout.tsx already applied the saved theme to
  // <html> before paint — this syncs React state so the toggle knows which
  // icon to show, and re-applies in case an accent was saved too.
  useEffect(() => {
    const prefs = loadThemePrefs();
    setTheme(prefs.theme);
    setAccent(prefs.accent);
    applyThemeToDocument(prefs.theme, prefs.accent);
  }, []);

  function handleThemeChange(next: ThemeMode) {
    setTheme(next);
    applyThemeToDocument(next, accent);
    saveThemePrefs(next, accent);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1560px] flex-col gap-4 px-5 pb-6 pt-[22px] sm:px-9 lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <header className="flex flex-none flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
        <div className="flex items-center gap-4">
          <AccountMenu />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                className="inline-block h-0.5 w-5 rounded-sm"
                style={{ background: "var(--hl-accent)" }}
              />
              <span
                className="text-[10px] font-bold tracking-[0.3em]"
                style={{ color: "var(--hl-sub)" }}
              >
                NSDL · SPEED-e
              </span>
            </div>
            <h1
              className="mt-[3px] font-display text-2xl font-extrabold leading-[1.08] tracking-[-0.025em] sm:text-[30px]"
              style={{
                color: "var(--hl-title)",
                textShadow: "0 6px 16px rgba(0,0,0,.15)",
              }}
            >
              {ORG_NAME} Holdings
            </h1>
          </div>
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
            title={cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : "Force refresh"}
            aria-label="Force refresh"
            className="hl-panel hl-icon-btn flex h-[46px] w-[46px] items-center justify-center rounded-full"
          >
            {cooldownRemaining > 0 ? (
              <span className="tabular text-[15px] font-extrabold">
                {cooldownRemaining}
              </span>
            ) : (
              <RefreshIcon className={isSyncing ? "hl-spin" : undefined} />
            )}
          </button>

          <ThemeToggle theme={theme} onThemeChange={handleThemeChange} />

          <button
            onClick={() => setStatsOpen((o) => !o)}
            title={statsOpen ? "Hide stats" : "Show stats"}
            aria-label={statsOpen ? "Hide stats" : "Show stats"}
            aria-expanded={statsOpen}
            className="hl-panel hl-icon-btn flex h-[46px] w-[46px] items-center justify-center rounded-full"
          >
            <ChevronDownIcon
              className="transition-transform duration-200"
              style={{ transform: statsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>
        </div>
      </header>

      {error && (
        <div
          className="hl-panel flex-none rounded-2xl px-4 py-3 text-[12.5px]"
          style={{ color: "var(--hl-red)" }}
        >
          {error}
        </div>
      )}

      {statsOpen && <SummaryCards holdings={holdings} dailyChanges={dailyChanges} />}

      <HoldingsTable holdings={holdings} dailyChanges={dailyChanges} />
    </div>
  );
}
