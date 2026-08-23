"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg ring-1 ring-slate-900/5 px-3 py-2">
      <p className="text-[10px] font-bold text-slate-400">{label}</p>
      <p className="num-mono font-black text-sm text-slate-800">
        ${Number(payload[0].value).toLocaleString("en-US")}
      </p>
    </div>
  );
}

function EndpointDot({
  cx,
  cy,
  index,
  lastIndex,
}: {
  cx?: number;
  cy?: number;
  index?: number;
  lastIndex: number;
}) {
  if (index !== lastIndex || cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill="#EA580C" fillOpacity={0.18} />
      <circle cx={cx} cy={cy} r={3.5} fill="#EA580C" stroke="white" strokeWidth={2} />
    </g>
  );
}

export function GrowthChart({ data }: { data: { label: string; value: number }[] }) {
  const lastIndex = data.length - 1;

  return (
    <div style={{ width: "100%", height: 150 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EA580C" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 5" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#EA580C", strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#EA580C"
            strokeWidth={2.5}
            fill="url(#growthGradient)"
            dot={(props: { cx?: number; cy?: number; index?: number }) => (
              <EndpointDot key={props.index} {...props} lastIndex={lastIndex} />
            )}
            activeDot={{ r: 4, fill: "#EA580C", stroke: "white", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
