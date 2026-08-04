"use client";

import { useEffect } from "react";
import { IsinMovements, Movement, TodayMovements } from "@/lib/types";
import { CloseIcon } from "./icons";

interface MovementsPanelProps {
  mode: "additions" | "subtractions";
  movements: TodayMovements | null;
  onClose: () => void;
}

function formatQty(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

function formatChangeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

function sideTransactions(
  entry: IsinMovements,
  mode: MovementsPanelProps["mode"]
): Movement[] {
  return entry.transactions.filter((t) =>
    mode === "additions" ? t.change > 0 : t.change < 0
  );
}

export default function MovementsPanel({ mode, movements, onClose }: MovementsPanelProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const isAdditions = mode === "additions";
  const color = isAdditions ? "var(--hl-up)" : "var(--hl-down)";
  const total = movements
    ? isAdditions
      ? movements.totals.additions
      : movements.totals.subtractions
    : 0;

  const entries = (movements?.byIsin ?? [])
    .map((entry) => ({ entry, txs: sideTransactions(entry, mode) }))
    .filter(({ txs }) => txs.length > 0)
    .sort((a, b) => {
      const aTotal = a.txs.reduce((sum, t) => sum + Math.abs(t.change), 0);
      const bTotal = b.txs.reduce((sum, t) => sum + Math.abs(t.change), 0);
      return bTotal - aTotal;
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-10 sm:items-center"
      style={{ background: "rgba(10, 20, 15, 0.45)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="hl-table-panel flex max-h-[80vh] w-full max-w-[560px] flex-col overflow-hidden rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isAdditions ? "Today's additions" : "Today's subtractions"}
      >
        <div
          className="flex flex-none items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid var(--hl-line)" }}
        >
          <div>
            <div
              className="text-[11px] font-semibold tracking-[0.2em]"
              style={{ color: "var(--hl-sub)" }}
            >
              {isAdditions ? "TODAY'S ADDITIONS" : "TODAY'S SUBTRACTIONS"}
            </div>
            <div className="tabular mt-1 font-display text-2xl font-bold" style={{ color }}>
              {isAdditions ? "+" : "−"}
              {formatQty(total)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hl-icon-btn flex h-9 w-9 flex-none items-center justify-center rounded-full"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="hl-scroll min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {entries.length === 0 && (
            <div
              className="p-9 text-center text-[13px]"
              style={{ color: "var(--hl-muted)" }}
            >
              {movements ? `No ${mode} today yet.` : "Loading…"}
            </div>
          )}

          {entries.map(({ entry, txs }) => {
            const sideTotal = txs.reduce((sum, t) => sum + Math.abs(t.change), 0);
            return (
              <div
                key={entry.isin}
                className="hl-row rounded-2xl px-3 py-3"
                style={{ borderBottom: "1px solid var(--hl-row-line)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div
                      className="truncate text-[13.5px] font-semibold"
                      style={{ color: "var(--hl-strong)" }}
                      title={entry.description}
                    >
                      {entry.description}
                    </div>
                    <div
                      className="truncate font-mono text-[11px]"
                      style={{ color: "var(--hl-sub)" }}
                    >
                      {entry.isin}
                    </div>
                  </div>
                  <div
                    className="tabular flex-none whitespace-nowrap text-[14px] font-bold"
                    style={{ color }}
                  >
                    {isAdditions ? "+" : "−"}
                    {formatQty(sideTotal)}
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-1">
                  {txs.map((t, i) => (
                    <div
                      key={i}
                      className="tabular flex items-center justify-between text-[11.5px]"
                      style={{ color: "var(--hl-muted)" }}
                    >
                      <span>
                        {formatQty(t.previousQuantity)} → {formatQty(t.currentQuantity)}
                      </span>
                      <span>{formatChangeTime(t.detectedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}