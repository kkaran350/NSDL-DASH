"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DailyChange, FrequencyEntry, FrequencyResponse, Holding, TodayMovements } from "@/lib/types";
import { parseLedgerDate } from "@/lib/dates";
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
import MovementsPanel from "./MovementsPanel";
import ShareRankingPanel, { RankingItem } from "./ShareRankingPanel";
import { ChevronDownIcon, RefreshIcon } from "./icons";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes, matching the depository refresh
const REFRESH_COOLDOWN_MS = 20 * 1000; // minimum gap between manual refreshes

const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME ?? "Mittal Portfolios Pvt. Ltd.";

export default function Dashboard() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [todayMovements, setTodayMovements] = useState<TodayMovements | null>(null);
  const [frequencyAll, setFrequencyAll] = useState<FrequencyEntry[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL_MS / 1000);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [statsOpen, setStatsOpen] = useState(true);
  const [openPanel, setOpenPanel] = useState<
    "additions" | "subtractions" | "dormant" | "frequent" | null
  >(null);

  const [theme, setTheme] = useState<ThemeMode>("light");
  // The redesign is light/dark only — accent is carried through untouched so
  // the saved preference still round-trips.
  const [accent, setAccent] = useState<AccentKey>("green");

  const previousHoldingsRef = useRef<Holding[] | undefined>(undefined);

  // Today's additions/subtractions, and the per-ISIN "last change seen"
  // timestamps for the ledger's "chg" stamp, both derive from the same
  // /api/movements/today read — which comes from the Movements sheet tab,
  // so every device sees the identical numbers. Nothing here is stored
  // in this browser anymore.
  const dailyChanges = useMemo<DailyChange[]>(() => {
    if (!todayMovements) return [];
    return todayMovements.byIsin.map((e) => ({
      isin: e.isin,
      additions: e.additions,
      subtractions: e.subtractions,
      net: e.net,
    }));
  }, [todayMovements]);

  const changeTimes = useMemo<Record<string, string>>(() => {
    const times: Record<string, string> = {};
    if (!todayMovements) return times;
    for (const entry of todayMovements.byIsin) {
      // Transactions come back oldest-first per ISIN, so the last one is
      // the most recent change recorded for it today.
      const latest = entry.transactions[entry.transactions.length - 1];
      if (latest) times[entry.isin] = latest.detectedAt;
    }
    return times;
  }, [todayMovements]);

  const mostFrequent = frequencyAll[0] ?? null;

  const dormantTop10 = useMemo<RankingItem[]>(() => {
    return holdings
      .filter((h) => h.quantity > 0 && parseLedgerDate(h.lastTransactionDate) > 0)
      .sort((a, b) => parseLedgerDate(a.lastTransactionDate) - parseLedgerDate(b.lastTransactionDate))
      .slice(0, 10)
      .map((h) => ({
        isin: h.isin,
        description: h.description,
        value: h.lastTransactionDate,
      }));
  }, [holdings]);

  const frequentTop10 = useMemo<RankingItem[]>(() => {
    return frequencyAll.slice(0, 10).map((f) => ({
      isin: f.isin,
      description: f.description,
      value: `${f.count.toLocaleString("en-IN")} txns`,
    }));
  }, [frequencyAll]);

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [holdingsRes, movementsRes, frequencyRes] = await Promise.all([
        fetch("/api/holdings", { cache: "no-store" }),
        fetch("/api/movements/today", { cache: "no-store" }),
        fetch("/api/movements/frequency", { cache: "no-store" }),
      ]);

      const holdingsJson = await holdingsRes.json();
      if (!holdingsRes.ok) {
        throw new Error(holdingsJson.error ?? "Failed to load holdings");
      }

      const nextHoldings: Holding[] = holdingsJson.holdings;
      const previousCount = previousHoldingsRef.current?.length ?? null;
      const sanity = isSheetDataSane(nextHoldings, previousCount);

      if (!sanity.ok) {
        setError(`Skipped a bad read: ${sanity.reason}. Showing the last good sync.`);
        return;
      }

      const cleanHoldings = nextHoldings.filter((h) => isPlausibleIsin(h.isin));

      previousHoldingsRef.current = cleanHoldings;
      setHoldings(cleanHoldings);
      setLastSyncedAt(holdingsJson.fetchedAt);
      setError(null);

      if (movementsRes.ok) {
        const movementsJson: TodayMovements = await movementsRes.json();
        setTodayMovements(movementsJson);
      }

      if (frequencyRes.ok) {
        const frequencyJson: FrequencyResponse = await frequencyRes.json();
        setFrequencyAll(frequencyJson.all);
      }
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

      {statsOpen && (
        <SummaryCards
          holdings={holdings}
          dailyChanges={dailyChanges}
          mostFrequent={mostFrequent}
          onOpenAdditions={() => setOpenPanel("additions")}
          onOpenSubtractions={() => setOpenPanel("subtractions")}
          onOpenDormant={() => setOpenPanel("dormant")}
          onOpenFrequent={() => setOpenPanel("frequent")}
        />
      )}

      <HoldingsTable
        holdings={holdings}
        dailyChanges={dailyChanges}
        changeTimes={changeTimes}
      />

      {(openPanel === "additions" || openPanel === "subtractions") && (
        <MovementsPanel
          mode={openPanel}
          movements={todayMovements}
          onClose={() => setOpenPanel(null)}
        />
      )}

      {openPanel === "dormant" && (
        <ShareRankingPanel
          title="Dormant Shares"
          subtitle="Oldest NSDL last-transaction dates, live holdings only"
          items={dormantTop10}
          onClose={() => setOpenPanel(null)}
        />
      )}

      {openPanel === "frequent" && (
        <ShareRankingPanel
          title="Most Frequent Shares"
          subtitle="Most transactions recorded, all-time"
          items={frequentTop10}
          onClose={() => setOpenPanel(null)}
        />
      )}
    </div>
  );
}