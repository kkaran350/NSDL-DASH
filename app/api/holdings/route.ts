import { NextResponse } from "next/server";
import { fetchHoldings } from "@/lib/sheets";

// Always hit the source fresh — the sheet itself updates every 5 minutes,
// so no benefit to caching longer than that, and staleness here would just
// hide new transactions from the dashboard.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const holdings = await fetchHoldings();
    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      holdings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
