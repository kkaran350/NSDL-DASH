"use client";

import { Holding, DailyChange, FrequencyEntry } from "@/lib/types";
import { parseLedgerDate } from "@/lib/dates";

interface SummaryCardsProps {
  holdings: Holding[];
  dailyChanges: DailyChange[];
  mostFrequent: FrequencyEntry | null;
  onOpenAdditions: () => void;
  onOpenSubtractions: () => void;
  onOpenDormant: () => void;
  onOpenFrequent: () => void;
}

function formatQty(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

export default function SummaryCards({
  holdings,
  dailyChanges,
  mostFrequent,
  onOpenAdditions,
  onOpenSubtractions,
  onOpenDormant,
  onOpenFrequent,
}: SummaryCardsProps) {
  const activeHoldings = holdings.filter((h) => h.quantity > 0);

  const dormant = activeHoldings
    .filter((h) => parseLedgerDate(h.lastTransactionDate) > 0)
    .sort((a, b) => parseLedgerDate(a.lastTransactionDate) - parseLedgerDate(b.lastTransactionDate))[0];

  const todaysAdditions = dailyChanges.reduce((sum, d) => sum + d.additions, 0);
  const todaysSubtractions = dailyChanges.reduce((sum, d) => sum + d.subtractions, 0);

  return (
    <div className="grid flex-none grid-cols-2 gap-3 lg:grid-cols-4">
      <button
        type="button"
        onClick={onOpenDormant}
        aria-haspopup="dialog"
        className="hl-panel hl-clickable-card rounded-[18px] px-[18px] py-3 text-left"
      >
        <div
          className="text-[10px] font-semibold tracking-[0.16em]"
          style={{ color: "var(--hl-sub)" }}
        >
          DORMANT SHARES
        </div>
        <div
          className="mt-1 truncate text-[15px] font-bold leading-snug"
          style={{ color: "var(--hl-strong)" }}
        >
          {dormant ? dormant.description : "—"}
        </div>
        <div
          className="mt-[3px] truncate text-[11px]"
          style={{ color: "var(--hl-muted)" }}
        >
          {dormant ? dormant.lastTransactionDate : "no data"} · tap for top 10
        </div>
      </button>

      <button
        type="button"
        onClick={onOpenFrequent}
        aria-haspopup="dialog"
        className="hl-panel hl-clickable-card rounded-[18px] px-[18px] py-3 text-left"
      >
        <div
          className="text-[10px] font-semibold tracking-[0.16em]"
          style={{ color: "var(--hl-sub)" }}
        >
          MOST FREQUENT SHARE
        </div>
        <div
          className="mt-1 truncate text-[15px] font-bold leading-snug"
          style={{ color: "var(--hl-strong)" }}
        >
          {mostFrequent ? mostFrequent.description : "—"}
        </div>
        <div
          className="mt-[3px] truncate text-[11px]"
          style={{ color: "var(--hl-muted)" }}
        >
          {mostFrequent ? `${formatQty(mostFrequent.count)} txns` : "no activity yet"} · tap for top 10
        </div>
      </button>

      <button
        type="button"
        onClick={onOpenAdditions}
        aria-haspopup="dialog"
        className="hl-panel hl-clickable-card rounded-[18px] px-[18px] py-3 text-left"
      >
        <div
          className="text-[10px] font-semibold tracking-[0.16em]"
          style={{ color: "var(--hl-sub)" }}
        >
          TODAY&apos;S ADDITIONS
        </div>
        <div
          className="tabular mt-1 truncate font-display text-xl font-bold tracking-[-0.01em]"
          style={{ color: "var(--hl-up)" }}
        >
          +{formatQty(todaysAdditions)}
        </div>
        <div
          className="mt-[3px] truncate text-[11px]"
          style={{ color: "var(--hl-muted)" }}
        >
          units added since midnight · tap for details
        </div>
      </button>

      <button
        type="button"
        onClick={onOpenSubtractions}
        aria-haspopup="dialog"
        className="hl-panel hl-clickable-card rounded-[18px] px-[18px] py-3 text-left"
      >
        <div
          className="text-[10px] font-semibold tracking-[0.16em]"
          style={{ color: "var(--hl-sub)" }}
        >
          TODAY&apos;S SUBTRACTIONS
        </div>
        <div
          className="tabular mt-1 truncate font-display text-xl font-bold tracking-[-0.01em]"
          style={{ color: "var(--hl-down)" }}
        >
          −{formatQty(todaysSubtractions)}
        </div>
        <div
          className="mt-[3px] truncate text-[11px]"
          style={{ color: "var(--hl-muted)" }}
        >
          units removed since midnight · tap for details
        </div>
      </button>
    </div>
  );
}