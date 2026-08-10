// import { NextResponse } from "next/server";
// import { fetchMovements } from "@/lib/sheets";
// import { istDateString } from "@/lib/dates";
// import { IsinMovements, TodayMovements } from "@/lib/types";

// export const dynamic = "force-dynamic";
// export const revalidate = 0;

// export async function GET() {
//   try {
//     const ledgerDate = istDateString();
//     const rows = await fetchMovements();
//     const todayRows = rows.filter((r) => r.date === ledgerDate);

//     const byIsinMap = new Map<string, IsinMovements>();
//     for (const r of todayRows) {
//       let entry = byIsinMap.get(r.isin);
//       if (!entry) {
//         entry = {
//           isin: r.isin,
//           description: r.description,
//           additions: 0,
//           subtractions: 0,
//           net: 0,
//           transactions: [],
//         };
//         byIsinMap.set(r.isin, entry);
//       }
//       if (r.change > 0) entry.additions += r.change;
//       else entry.subtractions += Math.abs(r.change);
//       entry.net += r.change;
//       entry.transactions.push({
//         previousQuantity: r.previousQuantity,
//         currentQuantity: r.currentQuantity,
//         change: r.change,
//         detectedAt: r.timestamp,
//       });
//     }

//     const byIsin = Array.from(byIsinMap.values()).sort(
//       (a, b) => b.additions + b.subtractions - (a.additions + a.subtractions)
//     );

//     const totals = byIsin.reduce(
//       (acc, e) => ({
//         additions: acc.additions + e.additions,
//         subtractions: acc.subtractions + e.subtractions,
//       }),
//       { additions: 0, subtractions: 0 }
//     );

//     const response: TodayMovements = { ledgerDate, totals, byIsin };
//     return NextResponse.json(response);
//   } catch (err) {
//     const message = err instanceof Error ? err.message : "Unknown error";
//     return NextResponse.json({ error: message }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { fetchMovements } from "@/lib/sheets";
import { istDateString, isLedgerDateToday } from "@/lib/dates";
import { IsinMovements, TodayMovements } from "@/lib/types";

// Same reasoning as /api/holdings: always fresh, the sheet is the source
// of truth and updates every 5 minutes.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const ledgerDate = istDateString();
    const rows = await fetchMovements();

    // Only count a change toward "today" if NSDL's own Last Transaction
    // Date for that holding is today's date — not merely because our poll
    // happened to detect the quantity difference today. NSDL frequently
    // settles a deal a day or more after it actually happened (e.g. a
    // Friday deal not reflected until Monday); this filter means such a
    // deal shows up once NSDL's own record catches up to today's date,
    // not the moment our poll first notices the balance move.
    const todayRows = rows.filter((r) => isLedgerDateToday(r.lastTransactionDate));

    const byIsinMap = new Map<string, IsinMovements>();
    for (const r of todayRows) {
      let entry = byIsinMap.get(r.isin);
      if (!entry) {
        entry = {
          isin: r.isin,
          description: r.description,
          additions: 0,
          subtractions: 0,
          net: 0,
          transactions: [],
        };
        byIsinMap.set(r.isin, entry);
      }
      if (r.change > 0) entry.additions += r.change;
      else entry.subtractions += Math.abs(r.change);
      entry.net += r.change;
      entry.transactions.push({
        previousQuantity: r.previousQuantity,
        currentQuantity: r.currentQuantity,
        change: r.change,
        detectedAt: r.timestamp,
      });
    }

    // Rows come back in the sheet's natural (append) order, i.e. oldest
    // first per ISIN already — keep that so multiple same-day transactions
    // for one stock display chronologically.
    const byIsin = Array.from(byIsinMap.values()).sort(
      (a, b) => b.additions + b.subtractions - (a.additions + a.subtractions)
    );

    const totals = byIsin.reduce(
      (acc, e) => ({
        additions: acc.additions + e.additions,
        subtractions: acc.subtractions + e.subtractions,
      }),
      { additions: 0, subtractions: 0 }
    );

    const response: TodayMovements = { ledgerDate, totals, byIsin };
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}