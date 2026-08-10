import { NextResponse } from "next/server";
import { fetchMovements } from "@/lib/sheets";
import { FrequencyEntry, FrequencyResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Counts how many individual quantity-change transactions each ISIN has
 * accumulated in the Movements sheet, across all recorded days (not just
 * today) — this is what "most frequently traded" means for a holding.
 */
export async function GET() {
  try {
    const rows = await fetchMovements();

    const counts = new Map<string, FrequencyEntry>();
    for (const r of rows) {
      const existing = counts.get(r.isin);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(r.isin, { isin: r.isin, description: r.description, count: 1 });
      }
    }

    const all = Array.from(counts.values()).sort((a, b) => b.count - a.count);
    const response: FrequencyResponse = { top: all[0] ?? null, all };
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}