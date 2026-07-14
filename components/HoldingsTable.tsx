"use client";

import { useMemo, useState } from "react";
import { Holding, QuantityDelta } from "@/lib/types";

interface HoldingsTableProps {
  holdings: Holding[];
  deltas: QuantityDelta[];
}

type SortKey = "isin" | "description" | "lastTransactionDate" | "quantity" | "value";
type SortDir = "asc" | "desc";

export default function HoldingsTable({ holdings, deltas }: HoldingsTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("quantity");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const deltaMap = useMemo(
    () => new Map(deltas.map((d) => [d.isin, d.change])),
    [deltas]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? holdings.filter(
          (h) =>
            h.isin.toLowerCase().includes(q) ||
            h.description.toLowerCase().includes(q)
        )
      : holdings;

    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "quantity" || sortKey === "value") {
        cmp = a[sortKey] - b[sortKey];
      } else {
        cmp = a[sortKey].localeCompare(b[sortKey]);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [holdings, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const columns: { key: SortKey; label: string; align?: "right" }[] = [
    { key: "isin", label: "ISIN" },
    { key: "description", label: "Description" },
    { key: "lastTransactionDate", label: "Last txn" },
    { key: "quantity", label: "Quantity", align: "right" },
    { key: "value", label: "Value (indicative)", align: "right" },
  ];

  return (
    <div className="rounded border border-border bg-paper-raised">
      <div className="flex items-center justify-between gap-4 border-b border-border p-3">
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
          Holdings ledger
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ISIN or company…"
          className="w-64 rounded border border-border bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
        />
      </div>

      <div className="max-h-[520px] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-paper-raised">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`cursor-pointer select-none border-b border-border px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-ink-soft hover:text-ink ${
                    col.align === "right" ? "text-right" : ""
                  }`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
              ))}
              <th className="border-b border-border px-3 py-2 text-right font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                Δ since last sync
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => {
              const change = deltaMap.get(h.isin);
              return (
                <tr key={h.isin} className="border-b border-border/60 hover:bg-accent-soft/40">
                  <td className="px-3 py-2 font-mono text-xs text-ink-soft">{h.isin}</td>
                  <td className="px-3 py-2 text-ink">{h.description}</td>
                  <td className="px-3 py-2 font-mono text-xs text-ink-soft">
                    {h.lastTransactionDate}
                  </td>
                  <td className="tabular px-3 py-2 text-right font-mono text-ink">
                    {h.quantity.toLocaleString("en-IN")}
                  </td>
                  <td className="tabular px-3 py-2 text-right font-mono text-xs text-ink-soft">
                    ₹{Math.round(h.value).toLocaleString("en-IN")}
                  </td>
                  <td className="tabular px-3 py-2 text-right font-mono text-xs">
                    {change === undefined ? (
                      <span className="text-ink-soft">—</span>
                    ) : (
                      <span className={change > 0 ? "text-accent" : "text-alert"}>
                        {change > 0 ? "+" : ""}
                        {change.toLocaleString("en-IN")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-ink-soft">
                  No holdings match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
