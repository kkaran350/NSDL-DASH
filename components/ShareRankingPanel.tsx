"use client";

import { useEffect } from "react";
import { CloseIcon } from "./icons";

export interface RankingItem {
  isin: string;
  description: string;
  value: string;
}

interface ShareRankingPanelProps {
  title: string;
  subtitle: string;
  items: RankingItem[];
  onClose: () => void;
}

export default function ShareRankingPanel({
  title,
  subtitle,
  items,
  onClose,
}: ShareRankingPanelProps) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-10 sm:items-center"
      style={{ background: "rgba(10, 20, 15, 0.45)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="hl-table-panel flex max-h-[80vh] w-full max-w-[520px] flex-col overflow-hidden rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
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
              {title.toUpperCase()}
            </div>
            <div className="mt-1 text-[13px]" style={{ color: "var(--hl-muted)" }}>
              {subtitle}
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
          {items.length === 0 && (
            <div
              className="p-9 text-center text-[13px]"
              style={{ color: "var(--hl-muted)" }}
            >
              No data yet.
            </div>
          )}

          {items.map((item, i) => (
            <div
              key={item.isin}
              className="hl-row flex items-center justify-between gap-3 rounded-2xl px-3 py-3"
              style={{ borderBottom: "1px solid var(--hl-row-line)" }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="tabular flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: "rgba(120, 150, 135, 0.18)", color: "var(--hl-sub)" }}
                >
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div
                    className="truncate text-[13.5px] font-semibold"
                    style={{ color: "var(--hl-strong)" }}
                    title={item.description}
                  >
                    {item.description}
                  </div>
                  <div
                    className="truncate font-mono text-[11px]"
                    style={{ color: "var(--hl-sub)" }}
                  >
                    {item.isin}
                  </div>
                </div>
              </div>
              <div
                className="tabular flex-none whitespace-nowrap text-[13px] font-bold"
                style={{ color: "var(--hl-strong)" }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}