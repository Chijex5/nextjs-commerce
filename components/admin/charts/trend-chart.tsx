"use client";

import { money, moneyCompact, count as formatCount } from "lib/admin/format";
import { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "lib/admin/metrics";

type MetricKey = "sales" | "orders";

const METRICS: Record<
  MetricKey,
  {
    label: string;
    current: keyof SeriesPoint;
    previous: keyof SeriesPoint;
    full: (n: number) => string;
    axis: (n: number) => string;
  }
> = {
  sales: {
    label: "Sales",
    current: "sales",
    previous: "previousSales",
    full: money,
    axis: moneyCompact,
  },
  orders: {
    label: "Orders",
    current: "orders",
    previous: "previousOrders",
    full: formatCount,
    axis: formatCount,
  },
};

/**
 * Sales-over-time chart. One metric at a time (no dual axes), the comparison
 * period as a dashed grey line, and a tooltip that states both values and the
 * change so nobody has to eyeball two lines.
 */
export function TrendChart({
  series,
  comparisonLabel,
  cumulative = false,
  height = 300,
}: {
  series: SeriesPoint[];
  comparisonLabel: string;
  /** Running totals (good for "today so far" vs yesterday). */
  cumulative?: boolean;
  height?: number;
}) {
  const [metric, setMetric] = useState<MetricKey>("sales");
  const m = METRICS[metric];

  let runCur = 0;
  let runPrev = 0;
  const data = series.map((p) => {
    const cur = Number(p[m.current]);
    const prev = Number(p[m.previous]);
    runPrev += prev;
    if (Number.isFinite(cur)) runCur += cur;
    return {
      label: p.label,
      title: p.title,
      previousTitle: p.previousTitle,
      current: Number.isFinite(cur) ? (cumulative ? runCur : cur) : null,
      previous: cumulative ? runPrev : prev,
    };
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Chart metric"
          className="flex border border-line"
        >
          {(Object.keys(METRICS) as MetricKey[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={metric === key}
              onClick={() => setMetric(key)}
              className={`h-8 px-3 font-mono text-[11px] uppercase tracking-wide transition-colors ${
                metric === key ? "bg-fg text-canvas" : "text-fg-3 hover:text-fg"
              }`}
            >
              {METRICS[key].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-fg-3">
          <span className="flex items-center gap-2">
            <span className="h-0.5 w-5 bg-fg" aria-hidden />
            This period
          </span>
          <span className="flex items-center gap-2">
            <span
              className="w-5 border-t-2 border-dashed border-fg-3"
              aria-hidden
            />
            {comparisonLabel.replace(/^vs /, "")}
          </span>
        </div>
      </div>

      <div style={{ height }} className="w-full text-fg-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--brand-cream)"
                  stopOpacity={0.12}
                />
                <stop
                  offset="100%"
                  stopColor="var(--brand-cream)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="rgba(var(--brand-fg-rgb), 0.08)"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "rgba(var(--brand-fg-rgb), 0.14)" }}
              tick={{
                fontSize: 11,
                fill: "var(--brand-muted)",
                fontFamily: "var(--font-geist-mono)",
              }}
              interval="preserveStartEnd"
              minTickGap={24}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{
                fontSize: 11,
                fill: "var(--brand-muted)",
                fontFamily: "var(--font-geist-mono)",
              }}
              tickFormatter={(v: number) => m.axis(v)}
              width={64}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{
                stroke: "rgba(var(--brand-fg-rgb), 0.3)",
                strokeWidth: 1,
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0]!.payload as (typeof data)[number];
                const change =
                  point.current !== null && point.previous > 0
                    ? Math.round(
                        ((point.current - point.previous) / point.previous) *
                          100,
                      )
                    : null;
                return (
                  <div className="min-w-48 border border-line bg-canvas px-3.5 py-3 text-xs text-fg shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                    <p className="label mb-2 text-fg-3">{point.title}</p>
                    <div className="flex items-baseline justify-between gap-6">
                      <span className="flex items-center gap-2">
                        <span className="h-0.5 w-3 bg-fg" aria-hidden />
                        {cumulative ? "So far" : m.label}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {point.current === null ? "—" : m.full(point.current)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-baseline justify-between gap-6 text-fg-3">
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 border-t-2 border-dashed border-fg-3"
                          aria-hidden
                        />
                        {point.previousTitle || "Previous"}
                      </span>
                      <span className="tabular-nums">
                        {m.full(point.previous)}
                      </span>
                    </div>
                    {change !== null ? (
                      <p
                        className={`mt-2 border-t border-line pt-2 tabular-nums ${
                          change > 0
                            ? "text-emerald-700 dark:text-emerald-400"
                            : change < 0
                              ? "text-red-700 dark:text-red-400"
                              : "text-fg-3"
                        }`}
                      >
                        {change > 0 ? "+" : ""}
                        {change}% {comparisonLabel}
                      </p>
                    ) : null}
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke="var(--brand-muted)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="current"
              stroke="var(--brand-cream)"
              strokeWidth={2}
              fill="url(#trend-fill)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "var(--brand-cream)",
                stroke: "var(--brand-espresso)",
                strokeWidth: 2,
              }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
