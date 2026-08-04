"use client";

import { Holding, DailyChange } from "@/lib/types";

interface SummaryCardsProps {
  holdings: Holding[];
  dailyChanges: DailyChange[];
  onOpenAdditions: () => void;
  onOpenSubtractions: () => void;
}

function formatQty(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

export default function SummaryCards({
  holdings,
  dailyChanges,
  onOpenAdditions,
  onOpenSubtractions,
}: SummaryCardsProps) {
  const totalQuantity = holdings.reduce((sum, h) => sum + h.quantity, 0);
  const activeHoldings = holdings.filter((h) => h.quantity > 0);
  const topByQuantity = [...activeHoldings].sort((a, b) => b.quantity - a.quantity)[0];

  const todaysAdditions = dailyChanges.reduce((sum, d) => sum + d.additions, 0);
  const todaysSubtractions = dailyChanges.reduce((sum, d) => sum + d.subtractions, 0);

  const staticCards = [
    {
      label: "TOTAL QUANTITY",
      value: formatQty(totalQuantity),
      sub: "units across all ISINs",
      color: "var(--hl-strong)",
    },
    {
      label: "COMPANIES",
      value: formatQty(holdings.length),
      sub: `${formatQty(activeHoldings.length)} with a live balance`,
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