"use client";

import { useEffect, useMemo, useState } from "react";
import { ZohoDiffResponse, ZohoDiffRow } from "@/lib/types";
import { SearchIcon, RefreshIcon, DownloadIcon } from "./icons";

const GRID_COLUMNS =
  "minmax(96px,1fr) minmax(150px,2.6fr) minmax(90px,1fr) minmax(90px,1fr) minmax(90px,1fr) minmax(110px,1fr)";

function formatQty(n: number | null): string {
  if (n === null) return "—";
  return Math.round(n).toLocaleString("en-IN");
}

function formatDiff(n: number | null): string {
  if (n === null) return "—";
  if (n > 0) return `+${formatQty(n)}`;
  if (n < 0) return `−${formatQty(-n)}`;
  return "0";
}

function statusLabel(status: ZohoDiffRow["status"]): string {
  switch (status) {
    case "match":
      return "Match";
    case "mismatch":
      return "Mismatch";
    case "zoho_only":
      return "Only in Zoho";
    case "nsdl_only":
      return "Only in NSDL";
  }
}

export default function ZohoDiffPanel() {
  const [data, setData] = useState<ZohoDiffResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "mismatch" | "zoho_only" | "nsdl_only">(
    "mismatch"
  );
  const [exporting, setExporting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/zoho/diff", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load Zoho diff");
      setData(json as ZohoDiffResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.isin.toLowerCase().includes(q) ||
        (r.zohoName ?? "").toLowerCase().includes(q) ||
        (r.nsdlDescription ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, query, filter]);

  async function handleExport() {
    if (rows.length === 0) return;
    setExporting(true);
    try {
      // Dynamically imported so the xlsx library (and its size) is only
      // loaded when someone actually clicks Export, not on every page load.
      const XLSX = await import("xlsx");

      const sheetData = rows.map((r) => ({
        ISIN: r.isin,
        Name: r.zohoName ?? r.nsdlDescription ?? "",
        "Zoho Stock": r.zohoStock ?? "",
        "NSDL Balance": r.nsdlBalance ?? "",
        Difference: r.diff ?? "",
        Status: statusLabel(r.status),
      }));

      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      worksheet["!cols"] = [
        { wch: 16 }, // ISIN
        { wch: 42 }, // Name
        { wch: 12 }, // Zoho Stock
        { wch: 14 }, // NSDL Balance
        { wch: 12 }, // Difference
        { wch: 14 }, // Status
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Zoho vs NSDL");

      const dateStamp = new Date().toISOString().slice(0, 10);
      const fileName = `zoho-nsdl-${filter}-${dateStamp}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="hl-table-panel flex min-h-0 flex-1 flex-col rounded-2xl">
      <div className="flex flex-none flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--hl-table-border)" }}>
        <div className="flex items-center gap-2">
          {(
            [
              ["mismatch", `Mismatches (${data?.summary.mismatched ?? 0})`],
              ["zoho_only", `Only in Zoho (${data?.summary.zohoOnly ?? 0})`],
              ["nsdl_only", `Only in NSDL (${data?.summary.nsdlOnly ?? 0})`],
              ["all", "All"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              data-on={filter === key}
              className="hl-chip rounded-full px-3 py-1.5 text-[12px] font-semibold"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="hl-input flex items-center gap-2 rounded-full px-3 py-1.5">
            <SearchIcon className="h-4 w-4" style={{ color: "var(--hl-sub)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ISIN or name…"
              className="w-40 bg-transparent text-[13px] outline-none sm:w-56"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || rows.length === 0}
            title="Export the current view to Excel"
            className="hl-panel flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold disabled:opacity-40"
          >
            <DownloadIcon size={15} />
            {exporting ? "Exporting…" : "Export"}
          </button>
          <button
            onClick={load}
            disabled={loading}
            title="Refresh"
            aria-label="Refresh"
            className="hl-panel hl-icon-btn flex h-9 w-9 items-center justify-center rounded-full"
          >
            <RefreshIcon className={loading ? "hl-spin" : undefined} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex-none px-4 py-3 text-[12.5px]" style={{ color: "var(--hl-red)" }}>
          {error}
        </div>
      )}

      {data && (
        <div className="flex-none px-4 pt-3 text-[12px]" style={{ color: "var(--hl-sub)" }}>
          Compared {data.summary.matched + data.summary.mismatched + data.summary.zohoOnly + data.summary.nsdlOnly} ISINs as of{" "}
          {new Date(data.fetchedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
          {" · "}
          <span style={{ color: data.summary.mismatched > 0 ? "var(--hl-down)" : "var(--hl-up)" }}>
            {data.summary.mismatched} mismatched
          </span>
        </div>
      )}

      <div
        className="grid flex-none gap-2 border-b px-4 py-2 text-[11px] font-bold tracking-wide"
        style={{ gridTemplateColumns: GRID_COLUMNS, borderColor: "var(--hl-table-border)", color: "var(--hl-sub)" }}
      >
        <div>ISIN</div>
        <div>NAME</div>
        <div className="text-right">ZOHO STOCK</div>
        <div className="text-right">NSDL BALANCE</div>
        <div className="text-right">DIFFERENCE</div>
        <div className="text-right">STATUS</div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && !data && (
          <div className="px-4 py-8 text-center text-[13px]" style={{ color: "var(--hl-sub)" }}>
            Loading…
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="px-4 py-8 text-center text-[13px]" style={{ color: "var(--hl-sub)" }}>
            No rows match this filter.
          </div>
        )}

        {rows.map((r) => (
          <div
            key={r.isin}
            className="grid items-center gap-2 border-b px-4 py-2.5 text-[13px]"
            style={{ gridTemplateColumns: GRID_COLUMNS, borderColor: "var(--hl-table-border)" }}
          >
            <div className="truncate font-mono text-[12px]" style={{ color: "var(--hl-sub)" }}>
              {r.isin}
            </div>
            <div className="truncate" style={{ color: "var(--hl-text)" }}>
              {r.zohoName ?? r.nsdlDescription}
            </div>
            <div className="tabular text-right">{formatQty(r.zohoStock)}</div>
            <div className="tabular text-right">{formatQty(r.nsdlBalance)}</div>
            <div
              className="tabular text-right font-semibold"
              style={{
                color:
                  r.diff === null || r.diff === 0
                    ? "var(--hl-sub)"
                    : r.diff > 0
                    ? "var(--hl-up)"
                    : "var(--hl-down)",
              }}
            >
              {formatDiff(r.diff)}
            </div>
            <div className="text-right text-[12px]" style={{ color: "var(--hl-sub)" }}>
              {statusLabel(r.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}