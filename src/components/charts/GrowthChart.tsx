"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function formatCompact(value: number) {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

// Ticks بأرقام "مدوّرة" فعليًا (0, 25, 50...) بدل ما نترك Recharts يخمّن — بيخلي
// محور القيم يحس إنه محسوب، مش عشوائي. لازم آخر tick يغطي أعلى قيمة فعليًا
// (وإلا القمة بتنقص عن حدود الرسم وبتنقص علامة القمة معها).
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const rawStep = max / (count - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const niceResidual = residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1;
  const step = niceResidual * magnitude;
  const ticks: number[] = [];
  let v = 0;
  while (v < max) {
    ticks.push(v);
    v += step;
  }
  ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

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
      <p className="num-mono font-black text-sm text-slate-800">{formatCompact(payload[0].value)}</p>
    </div>
  );
}

function PlotDot({
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
  if (cx == null || cy == null) return null;
  const isLast = index === lastIndex;
  return (
    <g>
      {isLast && <circle cx={cx} cy={cy} r={8} fill="#EA580C" fillOpacity={0.16} />}
      <circle cx={cx} cy={cy} r={isLast ? 4 : 2.5} fill={isLast ? "#EA580C" : "white"} stroke="#EA580C" strokeWidth={isLast ? 2 : 1.75} />
    </g>
  );
}

export function GrowthChart({ data, rtl = true }: { data: { label: string; value: number }[]; rtl?: boolean }) {
  const lastIndex = data.length - 1;
  const max = Math.max(0, ...data.map((d) => d.value));
  const ticks = niceTicks(max);
  // هامش فوق آخر tick كرمال علامة القمة تاخد مسافة تنفّس وما تلزق بحافة الرسم.
  const domainMax = Math.max(ticks[ticks.length - 1], max * 1.2);

  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 22, right: 6, left: 2, bottom: 0 }}>
          <defs>
            <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EA580C" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 5" />
          <XAxis
            dataKey="label"
            reversed={rtl}
            tick={{ fontSize: 10.5, fill: "#64748b", fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            orientation={rtl ? "right" : "left"}
            ticks={ticks}
            domain={[0, domainMax]}
            tickFormatter={formatCompact}
            tick={{ fontSize: 10.5, fill: "#64748b", fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#EA580C", strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#EA580C"
            strokeWidth={2.5}
            fill="url(#growthGradient)"
            dot={(props: { cx?: number; cy?: number; index?: number }) => (
              <PlotDot key={props.index} {...props} lastIndex={lastIndex} />
            )}
            activeDot={{ r: 4, fill: "#EA580C", stroke: "white", strokeWidth: 2 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={(props: any) => {
              if (props.index !== lastIndex || props.x == null || props.y == null) return null;
              return (
                <text
                  key="growth-label"
                  x={props.x}
                  y={Number(props.y) - 14}
                  textAnchor="middle"
                  className="num-mono"
                  fontSize={12}
                  fontWeight={800}
                  fill="#9a3412"
                >
                  {formatCompact(Number(props.value) || 0)}
                </text>
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
