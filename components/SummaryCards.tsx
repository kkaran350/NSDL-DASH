"use client";

import { Holding, DailyChange, FrequencyEntry } from "@/lib/types";
import { parseLedgerDate } from "@/lib/dates";

interface SummaryCardsProps {
  holdings: Holding[];
  dailyChanges: DailyChange[];
  mostFrequent: FrequencyEntry | null;
  onOpenAdditions: () => void;
  onOpenSubtractions: () => void;
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
}: SummaryCardsProps) {
  const activeHoldings = holdings.filter((h) => h.quantity > 0);
  const topByQuantity = [...activeHoldings].sort((a, b) => b.quantity - a.quantity)[0];

  // Oldest last-transaction-date among live holdings — the ones NSDL
  // hasn't recorded any activity on for the longest stretch.
  const dormant = activeHoldings
    .filter((h) => parseLedgerDate(h.lastTransactionDate) > 0)
    .sort((a, b) => parseLedgerDate(a.lastTransactionDate) - parseLedgerDate(b.lastTransactionDate))[0];

  const todaysAdditions = dailyChanges.reduce((sum, d) => sum + d.additions, 0);
  const todaysSubtractions = dailyChanges.reduce((sum, d) => sum + d.subtractions, 0);

  const staticCards = [
    {
      label: "DORMANT SHARES",
      value: dormant ? dormant.lastTransactionDate : "—",
      sub: dormant ? dormant.description.slice(0, 26) : "no data",
      color: "var(--hl-strong)",
    },
    {
      label: "MOST FREQUENT SHARE",
      value: mostFrequent ? `${formatQty(mostFrequent.count)} txns` : "—",
      sub: mostFrequent ? mostFrequent.description.slice(0, 26) : "no activity yet",
      color: "var(--hl-strong)",
    },
    {
      label: "LARGEST HOLDING",
      value: topByQuantity ? formatQty(topByQuantity.quantity) : "—",
      sub: topByQuantity ? topByQuantity.description.slice(0, 26) : "no data",
      color: "var(--hl-strong)",
    },
  ];

  return (
    <div className="grid flex-none grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {staticCards.map((card) => (
        <div key={card.label} className="hl-panel rounded-[18px] px-[18px] py-3">
          <div
            className="text-[10px] font-semibold tracking-[0.16em]"
            style={{ color: "var(--hl-sub)" }}
          >
            {card.label}
          </div>
          <div
            className="tabular mt-1 truncate font-display text-xl font-bold tracking-[-0.01em]"
            style={{ color: card.color }}
          >
            {card.value}
          </div>
          <div
            className="mt-[3px] truncate text-[11px]"
            style={{ color: "var(--hl-muted)" }}
          >
            {card.sub}
          </div>
        </div>
      ))}

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