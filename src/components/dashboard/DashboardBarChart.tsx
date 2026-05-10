"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

interface Props {
  data: { date: string; count: number }[];
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function DashboardBarChart({ data }: Props) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div style={{ height: 220 }} />
    );
  }

  const tickFormatter = (value: string, idx: number) => idx % 5 === 0 ? formatDate(value) : "";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A7FFF" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#1A6BDD" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(42,127,255,0.06)" strokeDasharray="0" />
        <XAxis
          dataKey="date"
          tickFormatter={tickFormatter}
          tick={{ fill: "#334D75", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#334D75", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "#0B1524",
            border: "1px solid rgba(42,127,255,0.2)",
            borderRadius: 10,
            fontSize: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
          labelFormatter={(label) => formatDate(String(label))}
          formatter={(value) => [Number(value), ""]}
          labelStyle={{ color: "#6B8AB8", marginBottom: 4 }}
          itemStyle={{ color: "#2A7FFF", fontFamily: "'JetBrains Mono', monospace" }}
          cursor={{ fill: "rgba(42,127,255,0.06)" }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={20} fill="url(#barGradient)">
          {data.map((entry, idx) => (
            <Cell
              key={idx}
              fill={entry.count > 0 ? "url(#barGradient)" : "#0F1D33"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
