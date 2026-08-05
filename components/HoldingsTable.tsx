// "use client";

// import { useMemo, useState } from "react";
// import { Holding, DailyChange } from "@/lib/types";
// import { parseLedgerDate } from "@/lib/dates";
// import { SearchIcon } from "./icons";

// interface HoldingsTableProps {
//   holdings: Holding[];
//   dailyChanges: DailyChange[];
//   /** Per-ISIN ISO timestamp of the last quantity change this browser saw. */
//   changeTimes: Record<string, string>;
// }

// type SortKey = "isin" | "description" | "date" | "quantity" | "faceValue" | "today";
// type SortDir = "asc" | "desc";

// /** Shared by the sticky header row and every body row, so they stay aligned. */
// const GRID_COLUMNS =
//   "minmax(96px,1.1fr) minmax(150px,2.8fr) minmax(80px,1fr) minmax(84px,1.05fr) minmax(100px,1.2fr) minmax(84px,1fr)";

// const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
//   { key: "isin", label: "ISIN", align: "left" },
//   { key: "description", label: "DESCRIPTION", align: "left" },
//   { key: "date", label: "LAST TXN", align: "right" },
//   { key: "quantity", label: "QUANTITY", align: "right" },
//   { key: "faceValue", label: "FACE VALUE", align: "right" },
//   { key: "today", label: "TODAY'S CHANGE", align: "right" },
// ];

// /**
//  * The sheet's date cell sometimes carries a time alongside the date
//  * ("16-Jul-2026 2:15 PM"). Split it so the time can sit under the date.
//  */
// function splitDateTime(raw: string): { date: string; time: string } {
//   const value = String(raw ?? "").trim();
//   const match = value.match(/^(\S+)[ T](\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i);
//   if (match) return { date: match[1], time: match[2] };
//   return { date: value, time: "" };
// }

// /** Turn an ISO timestamp into a short "3:59 pm" for the change stamp. */
// function formatChangeTime(iso: string | undefined): string {
//   if (!iso) return "";
//   const d = new Date(iso);
//   if (Number.isNaN(d.getTime())) return "";
//   return d
//     .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
//     .toLowerCase();
// }

// function formatQty(n: number): string {
//   return Math.round(n).toLocaleString("en-IN");
// }

// function formatSigned(n: number): string {
//   if (n > 0) return `+${formatQty(n)}`;
//   if (n < 0) return `−${formatQty(-n)}`;
//   return "—";
// }

// /** Face value comes through as the sheet's price column. */
// function formatFaceValue(price: number): string {
//   if (!price) return "—";
//   const shown = price % 1 === 0 ? String(price) : price.toFixed(2);
//   return `₹${shown}/-`;
// }

// export default function HoldingsTable({
//   holdings,
//   dailyChanges,
//   changeTimes,
// }: HoldingsTableProps) {
//   const [query, setQuery] = useState("");
//   const [sortKey, setSortKey] = useState<SortKey>("quantity");
//   const [sortDir, setSortDir] = useState<SortDir>("desc");
//   const [hideZero, setHideZero] = useState(false);

//   const dailyMap = useMemo(
//     () => new Map(dailyChanges.map((d) => [d.isin, d])),
//     [dailyChanges]
//   );

//   const rows = useMemo(() => {
//     const q = query.trim().toLowerCase();

//     let list = holdings.map((h) => {
//       const daily = dailyMap.get(h.isin);
//       return {
//         holding: h,
//         ...splitDateTime(h.lastTransactionDate),
//         changedAt: formatChangeTime(changeTimes[h.isin]),
//         today: daily ? daily.net : 0,
//       };
//     });

//     if (q) {
//       list = list.filter(
//         (r) =>
//           r.holding.isin.toLowerCase().includes(q) ||
//           r.holding.description.toLowerCase().includes(q)
//       );
//     }
//     if (hideZero) list = list.filter((r) => r.holding.quantity > 0);

//     const compare = (a: (typeof list)[number], b: (typeof list)[number]) => {
//       switch (sortKey) {
//         case "quantity":
//           return a.holding.quantity - b.holding.quantity;
//         case "faceValue":
//           return a.holding.price - b.holding.price;
//         case "today":
//           return a.today - b.today;
//         case "date":
//           return (
//             parseLedgerDate(a.holding.lastTransactionDate) -
//             parseLedgerDate(b.holding.lastTransactionDate)
//           );
//         default:
//           return a.holding[sortKey].localeCompare(b.holding[sortKey]);
//       }
//     };

//     return [...list].sort((a, b) => (sortDir === "asc" ? compare(a, b) : -compare(a, b)));
//   }, [holdings, dailyMap, changeTimes, query, sortKey, sortDir, hideZero]);

//   function toggleSort(key: SortKey) {
//     if (key === sortKey) {
//       setSortDir((d) => (d === "asc" ? "desc" : "asc"));
//     } else {
//       setSortKey(key);
//       // Text columns read better A→Z; numbers read better largest-first.
//       setSortDir(key === "isin" || key === "description" ? "asc" : "desc");
//     }
//   }

//   return (
//     <div className="hl-table-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl">
//       {/* Toolbar */}
//       <div
//         className="flex flex-none flex-col gap-3 px-[22px] py-3.5 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4"
//         style={{ borderBottom: "1px solid var(--hl-line)" }}
//       >
//         <div
//           className="text-[11px] font-semibold tracking-[0.2em]"
//           style={{ color: "var(--hl-strong)" }}
//         >
//           NSDL HOLDINGS LEDGER{" "}
//           <span
//             className="font-medium tracking-[0.06em]"
//             style={{ color: "var(--hl-muted)" }}
//           >
//             · {rows.length} of {holdings.length}
//           </span>
//         </div>

//         <div className="relative flex items-center justify-self-center">
//           <SearchIcon
//             className="pointer-events-none absolute left-[14px]"
//             size={14}
//           />
//           <input
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             placeholder="Search ISIN or company…"
//             aria-label="Search holdings"
//             className="hl-input box-border w-full rounded-full py-[9px] pl-[38px] pr-[15px] text-[13px] md:w-[320px]"
//           />
//         </div>

//         <button
//           onClick={() => setHideZero((v) => !v)}
//           data-on={hideZero}
//           className="hl-chip self-start whitespace-nowrap rounded-full px-2.5 py-[5px] text-[9.5px] font-bold tracking-[0.03em] md:justify-self-end"
//         >
//           {hideZero ? "Showing non-zero only" : "Remove 0 qty shares"}
//         </button>
//       </div>

//       {/* Ledger body */}
//       <div className="hl-scroll min-h-0 flex-1 overflow-auto overscroll-contain scroll-smooth">
//         <div className="min-w-[720px]">
//           <div
//             className="sticky top-0 z-[2] grid gap-x-3.5 px-[22px] backdrop-blur-md"
//             style={{
//               gridTemplateColumns: GRID_COLUMNS,
//               background: "var(--hl-head-solid)",
//               borderBottom: "1px solid var(--hl-line)",
//             }}
//           >
//             {COLUMNS.map((col) => (
//               <button
//                 key={col.key}
//                 onClick={() => toggleSort(col.key)}
//                 data-active={sortKey === col.key}
//                 className="hl-col-btn cursor-pointer border-none bg-transparent py-[13px] text-[10.5px] font-semibold tracking-[0.12em]"
//                 style={{ textAlign: col.align }}
//               >
//                 {col.label}
//                 {sortKey === col.key && (sortDir === "desc" ? " ↓" : " ↑")}
//               </button>
//             ))}
//           </div>

//           {rows.map((row) => {
//             const h = row.holding;
//             const todayColor =
//               row.today > 0
//                 ? "var(--hl-up)"
//                 : row.today < 0
//                 ? "var(--hl-down)"
//                 : "var(--hl-muted)";

//             return (
//               <div
//                 key={h.isin}
//                 className="hl-row grid gap-x-3.5 px-[22px]"
//                 style={{
//                   gridTemplateColumns: GRID_COLUMNS,
//                   borderBottom: "1px solid var(--hl-row-line)",
//                 }}
//               >
//                 <div
//                   className="truncate py-[13px] font-mono text-[11.5px]"
//                   style={{ color: "var(--hl-sub)" }}
//                 >
//                   {h.isin}
//                 </div>
//                 <div
//                   className="truncate py-[13px] text-[13.5px] font-medium"
//                   style={{ color: "var(--hl-strong)" }}
//                   title={h.description}
//                 >
//                   {h.description}
//                 </div>
//                 <div
//                   className="tabular py-[13px] text-right text-xs leading-[1.35]"
//                   style={{ color: "var(--hl-sub)" }}
//                 >
//                   {row.date || "—"}
//                   {/* Prefer a time carried in the sheet's date cell; otherwise
//                       show when this browser last saw the quantity move. */}
//                   {row.time ? (
//                     <div
//                       className="tabular text-[10.5px]"
//                       style={{ color: "var(--hl-muted)" }}
//                     >
//                       {row.time}
//                     </div>
//                   ) : (
//                     row.changedAt && (
//                       <div
//                         className="tabular text-[10.5px]"
//                         style={{ color: "var(--hl-muted)" }}
//                         title="Last quantity change seen by this dashboard"
//                       >
//                         chg {row.changedAt}
//                       </div>
//                     )
//                   )}
//                 </div>
//                 <div
//                   className="tabular py-[13px] text-right text-[13.5px] font-bold"
//                   style={{ color: "var(--hl-strong)" }}
//                 >
//                   {formatQty(h.quantity)}
//                 </div>
//                 <div
//                   className="tabular py-[13px] text-right text-[12.5px] font-medium"
//                   style={{ color: "var(--hl-val)" }}
//                 >
//                   {formatFaceValue(h.price)}
//                 </div>
//                 <div
//                   className="tabular py-[13px] text-right text-[12.5px] font-semibold"
//                   style={{ color: todayColor }}
//                 >
//                   {formatSigned(row.today)}
//                 </div>
//               </div>
//             );
//           })}

//           {rows.length === 0 && (
//             <div
//               className="p-9 text-center text-[13px]"
//               style={{ color: "var(--hl-muted)" }}
//             >
//               {holdings.length === 0
//                 ? "Waiting for the first sync…"
//                 : `No holdings match “${query}”.`}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useMemo, useState } from "react";
import { Holding, DailyChange } from "@/lib/types";
import { parseLedgerDate } from "@/lib/dates";
import { SearchIcon } from "./icons";

interface HoldingsTableProps {
  holdings: Holding[];
  dailyChanges: DailyChange[];
  /** Per-ISIN ISO timestamp of the last quantity change recorded today. */
  changeTimes: Record<string, string>;
}

type SortKey = "isin" | "description" | "date" | "quantity" | "faceValue" | "today";
type SortDir = "asc" | "desc";

/** Shared by the sticky header row and every body row, so they stay aligned. */
const GRID_COLUMNS =
  "minmax(96px,1.1fr) minmax(150px,2.8fr) minmax(80px,1fr) minmax(84px,1.05fr) minmax(100px,1.2fr) minmax(84px,1fr)";

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "isin", label: "ISIN", align: "left" },
  { key: "description", label: "DESCRIPTION", align: "left" },
  { key: "date", label: "LAST TXN", align: "right" },
  { key: "quantity", label: "QUANTITY", align: "right" },
  { key: "faceValue", label: "FACE VALUE", align: "right" },
  { key: "today", label: "TODAY'S CHANGE", align: "right" },
];

/**
 * The sheet's date cell sometimes carries a time alongside the date
 * ("16-Jul-2026 2:15 PM"). Split it so the time can sit under the date.
 */
function splitDateTime(raw: string): { date: string; time: string } {
  const value = String(raw ?? "").trim();
  const match = value.match(/^(\S+)[ T](\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i);
  if (match) return { date: match[1], time: match[2] };
  return { date: value, time: "" };
}

/** Turn an ISO timestamp into a short "3:59 pm" for the change stamp. */
function formatChangeTime(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

function formatQty(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

function formatSigned(n: number): string {
  if (n > 0) return `+${formatQty(n)}`;
  if (n < 0) return `−${formatQty(-n)}`;
  return "—";
}

/** Face value comes through as the sheet's price column. */
function formatFaceValue(price: number): string {
  if (!price) return "—";
  const shown = price % 1 === 0 ? String(price) : price.toFixed(2);
  return `₹${shown}/-`;
}

export default function HoldingsTable({
  holdings,
  dailyChanges,
  changeTimes,
}: HoldingsTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("quantity");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [hideZero, setHideZero] = useState(false);

  const dailyMap = useMemo(
    () => new Map(dailyChanges.map((d) => [d.isin, d])),
    [dailyChanges]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = holdings.map((h) => {
      const daily = dailyMap.get(h.isin);
      return {
        holding: h,
        ...splitDateTime(h.lastTransactionDate),
        changedAt: formatChangeTime(changeTimes[h.isin]),
        today: daily ? daily.net : 0,
      };
    });

    if (q) {
      list = list.filter(
        (r) =>
          r.holding.isin.toLowerCase().includes(q) ||
          r.holding.description.toLowerCase().includes(q)
      );
    }
    if (hideZero) list = list.filter((r) => r.holding.quantity > 0);

    const compare = (a: (typeof list)[number], b: (typeof list)[number]) => {
      switch (sortKey) {
        case "quantity":
          return a.holding.quantity - b.holding.quantity;
        case "faceValue":
          return a.holding.price - b.holding.price;
        case "today":
          return a.today - b.today;
        case "date":
          return (
            parseLedgerDate(a.holding.lastTransactionDate) -
            parseLedgerDate(b.holding.lastTransactionDate)
          );
        default:
          return a.holding[sortKey].localeCompare(b.holding[sortKey]);
      }
    };

    return [...list].sort((a, b) => (sortDir === "asc" ? compare(a, b) : -compare(a, b)));
  }, [holdings, dailyMap, changeTimes, query, sortKey, sortDir, hideZero]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Text columns read better A→Z; numbers read better largest-first.
      setSortDir(key === "isin" || key === "description" ? "asc" : "desc");
    }
  }

  return (
    <div className="hl-table-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl">
      {/* Toolbar — shared by both the table and the card layout below */}
      <div
        className="flex flex-none flex-col gap-3 px-[22px] py-3.5 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4"
        style={{ borderBottom: "1px solid var(--hl-line)" }}
      >
        <div
          className="text-[11px] font-semibold tracking-[0.2em]"
          style={{ color: "var(--hl-strong)" }}
        >
          NSDL HOLDINGS LEDGER{" "}
          <span
            className="font-medium tracking-[0.06em]"
            style={{ color: "var(--hl-muted)" }}
          >
            · {rows.length} of {holdings.length}
          </span>
        </div>

        <div className="relative flex items-center justify-self-center">
          <SearchIcon
            className="pointer-events-none absolute left-[14px]"
            size={14}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ISIN or company…"
            aria-label="Search holdings"
            className="hl-input box-border w-full rounded-full py-[9px] pl-[38px] pr-[15px] text-[13px] md:w-[320px]"
          />
        </div>

        <button
          onClick={() => setHideZero((v) => !v)}
          data-on={hideZero}
          className="hl-chip self-start whitespace-nowrap rounded-full px-2.5 py-[5px] text-[9.5px] font-bold tracking-[0.03em] md:justify-self-end"
        >
          {hideZero ? "Showing non-zero only" : "Remove 0 qty shares"}
        </button>
      </div>

      {/* Desktop / tablet: the sortable ledger table, md breakpoint and up */}
      <div className="hl-scroll hidden min-h-0 flex-1 overflow-auto overscroll-contain scroll-smooth md:block">
        <div className="min-w-[720px]">
          <div
            className="sticky top-0 z-[2] grid gap-x-3.5 px-[22px] backdrop-blur-md"
            style={{
              gridTemplateColumns: GRID_COLUMNS,
              background: "var(--hl-head-solid)",
              borderBottom: "1px solid var(--hl-line)",
            }}
          >
            {COLUMNS.map((col) => (
              <button
                key={col.key}
                onClick={() => toggleSort(col.key)}
                data-active={sortKey === col.key}
                className="hl-col-btn cursor-pointer border-none bg-transparent py-[13px] text-[10.5px] font-semibold tracking-[0.12em]"
                style={{ textAlign: col.align }}
              >
                {col.label}
                {sortKey === col.key && (sortDir === "desc" ? " ↓" : " ↑")}
              </button>
            ))}
          </div>

          {rows.map((row) => {
            const h = row.holding;
            const todayColor =
              row.today > 0
                ? "var(--hl-up)"
                : row.today < 0
                ? "var(--hl-down)"
                : "var(--hl-muted)";

            return (
              <div
                key={h.isin}
                className="hl-row grid gap-x-3.5 px-[22px]"
                style={{
                  gridTemplateColumns: GRID_COLUMNS,
                  borderBottom: "1px solid var(--hl-row-line)",
                }}
              >
                <div
                  className="truncate py-[13px] font-mono text-[11.5px]"
                  style={{ color: "var(--hl-sub)" }}
                >
                  {h.isin}
                </div>
                <div
                  className="truncate py-[13px] text-[13.5px] font-medium"
                  style={{ color: "var(--hl-strong)" }}
                  title={h.description}
                >
                  {h.description}
                </div>
                <div
                  className="tabular py-[13px] text-right text-xs leading-[1.35]"
                  style={{ color: "var(--hl-sub)" }}
                >
                  {row.date || "—"}
                  {row.time ? (
                    <div
                      className="tabular text-[10.5px]"
                      style={{ color: "var(--hl-muted)" }}
                    >
                      {row.time}
                    </div>
                  ) : (
                    row.changedAt && (
                      <div
                        className="tabular text-[10.5px]"
                        style={{ color: "var(--hl-muted)" }}
                        title="Last quantity change recorded today"
                      >
                        chg {row.changedAt}
                      </div>
                    )
                  )}
                </div>
                <div
                  className="tabular py-[13px] text-right text-[13.5px] font-bold"
                  style={{ color: "var(--hl-strong)" }}
                >
                  {formatQty(h.quantity)}
                </div>
                <div
                  className="tabular py-[13px] text-right text-[12.5px] font-medium"
                  style={{ color: "var(--hl-val)" }}
                >
                  {formatFaceValue(h.price)}
                </div>
                <div
                  className="tabular py-[13px] text-right text-[12.5px] font-semibold"
                  style={{ color: todayColor }}
                >
                  {formatSigned(row.today)}
                </div>
              </div>
            );
          })}

          {rows.length === 0 && (
            <div
              className="p-9 text-center text-[13px]"
              style={{ color: "var(--hl-muted)" }}
            >
              {holdings.length === 0
                ? "Waiting for the first sync…"
                : `No holdings match “${query}”.`}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: one card per holding, below the md breakpoint */}
      <div className="hl-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto overscroll-contain px-3 py-3 md:hidden">
        {rows.map((row) => {
          const h = row.holding;
          const todayColor =
            row.today > 0
              ? "var(--hl-up)"
              : row.today < 0
              ? "var(--hl-down)"
              : "var(--hl-muted)";

          return (
            <div key={h.isin} className="hl-panel rounded-2xl px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <span
                  className="text-[10px] font-semibold tracking-[0.14em]"
                  style={{ color: "var(--hl-sub)" }}
                >
                  ISIN
                </span>
                <span
                  className="font-mono text-[12.5px]"
                  style={{ color: "var(--hl-strong)" }}
                >
                  {h.isin}
                </span>
              </div>

              <div className="mt-2.5 pt-2.5" style={{ borderTop: "1px solid var(--hl-row-line)" }}>
                <div
                  className="text-[10px] font-semibold tracking-[0.14em]"
                  style={{ color: "var(--hl-sub)" }}
                >
                  DESCRIPTION
                </div>
                <div
                  className="mt-1 text-[14px] font-semibold leading-snug"
                  style={{ color: "var(--hl-strong)" }}
                >
                  {h.description}
                </div>
              </div>

              <div
                className="mt-2.5 flex flex-col gap-2 pt-2.5"
                style={{ borderTop: "1px solid var(--hl-row-line)" }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-semibold tracking-[0.14em]"
                    style={{ color: "var(--hl-sub)" }}
                  >
                    LAST TXN
                  </span>
                  <span className="tabular text-right text-[12.5px]" style={{ color: "var(--hl-sub)" }}>
                    {row.date || "—"}
                    {row.time ? (
                      <span className="ml-1.5" style={{ color: "var(--hl-muted)" }}>
                        {row.time}
                      </span>
                    ) : (
                      row.changedAt && (
                        <span
                          className="ml-1.5"
                          style={{ color: "var(--hl-muted)" }}
                          title="Last quantity change recorded today"
                        >
                          chg {row.changedAt}
                        </span>
                      )
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-semibold tracking-[0.14em]"
                    style={{ color: "var(--hl-sub)" }}
                  >
                    QUANTITY
                  </span>
                  <span
                    className="tabular text-[16px] font-bold"
                    style={{ color: "var(--hl-strong)" }}
                  >
                    {formatQty(h.quantity)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-semibold tracking-[0.14em]"
                    style={{ color: "var(--hl-sub)" }}
                  >
                    FACE VALUE
                  </span>
                  <span
                    className="tabular text-[13px] font-medium"
                    style={{ color: "var(--hl-val)" }}
                  >
                    {formatFaceValue(h.price)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-semibold tracking-[0.14em]"
                    style={{ color: "var(--hl-sub)" }}
                  >
                    TODAY&apos;S CHANGE
                  </span>
                  <span
                    className="tabular text-[13.5px] font-bold"
                    style={{ color: todayColor }}
                  >
                    {formatSigned(row.today)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <div
            className="p-9 text-center text-[13px]"
            style={{ color: "var(--hl-muted)" }}
          >
            {holdings.length === 0
              ? "Waiting for the first sync…"
              : `No holdings match “${query}”.`}
          </div>
        )}
      </div>
    </div>
  );
}