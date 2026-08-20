"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export function GrowthChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div style={{ width: "100%", height: 130 }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EA580C" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(value) => `$${Number(value).toLocaleString("en-US")}`} />
          <Area type="monotone" dataKey="value" stroke="#EA580C" fill="url(#growthGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
