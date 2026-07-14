"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Holding } from "@/lib/types";

interface AllocationChartProps {
  holdings: Holding[];
}

const COLORS = [
  "#2F6F5E",
  "#A9823C",
  "#4B5A55",
  "#7FA898",
  "#C9A868",
  "#1A2A26",
  "#88A99B",
];

function shortName(desc: string): string {
  const cleaned = desc.replace(/\bEQ\b.*$/i, "").trim();
  return cleaned.length > 22 ? `${cleaned.slice(0, 20)}…` : cleaned;
}

export default function AllocationChart({ holdings }: AllocationChartProps) {
  const active = [...holdings]
    .filter((h) => h.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);

  const topN = active.slice(0, 6);
  const rest = active.slice(6);
  const restTotal = rest.reduce((sum, h) => sum + h.quantity, 0);

  const data = [
    ...topN.map((h) => ({ name: shortName(h.description), value: h.quantity })),
    ...(restTotal > 0 ? [{ name: `Other (${rest.length})`, value: restTotal }] : []),
  ];

  return (
    <div className="rounded border border-border bg-paper-raised p-4">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
        Quantity share by holding
      </div>
      <div className="mt-3 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={1}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => value.toLocaleString("en-IN")}
              contentStyle={{
                fontSize: 12,
                borderRadius: 2,
                border: "1px solid #D9D6C8",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#4B5A55" }}
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
