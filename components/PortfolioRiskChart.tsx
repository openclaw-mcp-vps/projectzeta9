"use client";

import {
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = ["#34d399", "#38bdf8", "#f59e0b", "#fb7185"];

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: string | number }>;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-slate-700 bg-slate-950/95 px-2.5 py-1.5 text-xs text-slate-100">
      {payload[0].name}: {payload[0].value}
    </div>
  );
}

export function PortfolioRiskChart({
  low,
  medium,
  high,
  critical,
}: {
  low: number;
  medium: number;
  high: number;
  critical: number;
}) {
  const data = [
    { name: "Low", value: low },
    { name: "Medium", value: medium },
    { name: "High", value: high },
    { name: "Critical", value: critical },
  ].filter((entry) => entry.value > 0);

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={45}
            outerRadius={72}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
