"use client";

import { Holding, DailyChange } from "@/lib/types";

interface SummaryCardsProps {
  holdings: Holding[];
  dailyChanges: DailyChange[];
}

function formatQty(n: number): string {
  return n.toLocaleString("en-IN");
}

export default function SummaryCards({ holdings, dailyChanges }: SummaryCardsProps) {
  const totalQuantity = holdings.reduce((sum, h) => sum + h.quantity, 0);
  const activeHoldings = holdings.filter((h) => h.quantity > 0);
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  const topByQuantity = [...activeHoldings].sort(
    (a, b) => b.quantity - a.quantity
  )[0];

  const todaysAdditions = dailyChanges.reduce((sum, d) => sum + d.additions, 0);
  const todaysSubtractions = dailyChanges.reduce((sum, d) => sum + d.subtractions, 0);

  const cards = [
    {
      label: "Total quantity held",
      value: formatQty(totalQuantity),
      sub: "units across all ISINs",
    },
    {
      label: "Companies in ledger",
      value: formatQty(holdings.length),
      sub: `${formatQty(activeHoldings.length)} with a live balance`,
    },
    {
      label: "Largest holding",
      value: topByQuantity ? formatQty(topByQuantity.quantity) : "—",
      sub: topByQuantity ? topByQuantity.description.slice(0, 34) : "no data",
    },
    {
      label: "Today's additions",
      value: `+${formatQty(todaysAdditions)}`,
      sub: "units added since midnight",
      tone: "accent" as const,
    },
    {
      label: "Today's subtractions",
      value: `−${formatQty(todaysSubtractions)}`,
      sub: "units removed since midnight",
      tone: "alert" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded border border-border bg-paper-raised p-4"
        >
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
            {card.label}
          </div>
          <div
            className={`mt-1 font-display text-3xl tabular ${
              card.tone === "accent"
                ? "text-accent"
                : card.tone === "alert"
                ? "text-alert"
                : "text-ink"
            }`}
          >
            {card.value}
          </div>
          <div className="mt-0.5 truncate text-xs text-ink-soft">
            {card.sub}
          </div>
        </div>
      ))}
      <div className="sm:col-span-3 lg:col-span-5 flex items-baseline gap-2 px-1 pt-1 text-xs text-ink-soft">
        <span>Indicative value at last transaction price:</span>
        <span className="font-mono tabular text-ink-soft">
          ₹{Math.round(totalValue).toLocaleString("en-IN")}
        </span>
        <span>— sale prices are negotiated per deal, not market-quoted, so quantity is the primary signal here.</span>
      </div>
    </div>
  );
}