"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Holding } from "@/lib/types";

interface TopHoldingsChartProps {
  holdings: Holding[];
}

function shortName(desc: string): string {
  const cleaned = desc.replace(/\bEQ\b.*$/i, "").trim();
  return cleaned.length > 28 ? `${cleaned.slice(0, 26)}…` : cleaned;
}

export default function TopHoldingsChart({ holdings }: TopHoldingsChartProps) {
  const top = [...holdings]
    .filter((h) => h.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map((h) => ({ name: shortName(h.description), quantity: h.quantity }))
    .reverse();

  return (
    <div className="rounded border border-border bg-paper-raised p-4">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
        Top 10 holdings by quantity
      </div>
      <div className="mt-3 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={top}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="2 4" stroke="#D9D6C8" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#4B5A55" }}
              tickFormatter={(v) => v.toLocaleString("en-IN")}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 11, fill: "#1A2A26" }}
            />
            <Tooltip
              formatter={(value: number) => value.toLocaleString("en-IN")}
              contentStyle={{
                fontSize: 12,
                borderRadius: 2,
                border: "1px solid #D9D6C8",
              }}
            />
            <Bar dataKey="quantity" fill="#2F6F5E" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
