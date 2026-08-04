import { NextResponse } from "next/server";
import { fetchMovements } from "@/lib/sheets";
import { istDateString } from "@/lib/dates";
import { IsinMovements, TodayMovements } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const ledgerDate = istDateString();
    const rows = await fetchMovements();
    const todayRows = rows.filter((r) => r.date === ledgerDate);

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