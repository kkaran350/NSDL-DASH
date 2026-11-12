import { NextResponse } from "next/server";
import { fetchHoldings } from "@/lib/sheets";
import { fetchZohoItems } from "@/lib/zoho";
import { ZohoDiffRow, ZohoDiffResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [zohoItems, holdings] = await Promise.all([
      fetchZohoItems(),
      fetchHoldings(),
    ]);

    const zohoBySku = new Map(zohoItems.map((i) => [i.sku, i]));
    const nsdlByIsin = new Map(holdings.map((h) => [h.isin.toUpperCase(), h]));

    const allIsins = new Set<string>([...zohoBySku.keys(), ...nsdlByIsin.keys()]);

    const rows: ZohoDiffRow[] = [];
    let matched = 0;
    let mismatched = 0;
    let zohoOnly = 0;
    let nsdlOnly = 0;

    for (const isin of allIsins) {
      const zoho = zohoBySku.get(isin) ?? null;
      const nsdl = nsdlByIsin.get(isin) ?? null;

      if (zoho && nsdl) {
        // NSDL is the base: positive means Zoho's stock is higher than the
        // NSDL balance, negative means Zoho's stock is lower.
        const diff = zoho.stock - nsdl.quantity;
        const status = diff === 0 ? "match" : "mismatch";
        if (status === "match") matched++;
        else mismatched++;
        rows.push({
          isin,
          zohoName: zoho.name,
          nsdlDescription: nsdl.description,
          zohoStock: zoho.stock,
          nsdlBalance: nsdl.quantity,
          diff,
          status,
        });
      } else if (zoho && !nsdl) {
        zohoOnly++;
        rows.push({
          isin,
          zohoName: zoho.name,
          nsdlDescription: null,
          zohoStock: zoho.stock,
          nsdlBalance: null,
          diff: null,
          status: "zoho_only",
        });
      } else if (!zoho && nsdl) {
        nsdlOnly++;
        rows.push({
          isin,
          zohoName: null,
          nsdlDescription: nsdl.description,
          zohoStock: null,
          nsdlBalance: nsdl.quantity,
          diff: null,
          status: "nsdl_only",
        });
      }
    }

    // Mismatches first (biggest gap first), then missing-from-one-side,
    // then clean matches at the bottom — put the things that need
    // attention at the top.
    rows.sort((a, b) => {
      const rank = (r: ZohoDiffRow) =>
        r.status === "mismatch" ? 0 : r.status === "zoho_only" || r.status === "nsdl_only" ? 1 : 2;
      const rankDiff = rank(a) - rank(b);
      if (rankDiff !== 0) return rankDiff;
      return Math.abs(b.diff ?? 0) - Math.abs(a.diff ?? 0);
    });

    const response: ZohoDiffResponse = {
      fetchedAt: new Date().toISOString(),
      rows,
      summary: { matched, mismatched, zohoOnly, nsdlOnly },
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}