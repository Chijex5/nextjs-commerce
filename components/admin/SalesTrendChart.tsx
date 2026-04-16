"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SalesTrendPoint = {
  time: string;
  label: string;
  tooltip: string;
  revenue: number;
  orders: number;
};

type SalesTrendChartProps = {
  data: SalesTrendPoint[];
  currencyCode?: string;
};

function formatCurrencyCompact(amount: number, currencyCode: string): string {
  if (amount >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `₦${(amount / 1_000).toFixed(0)}K`;
  }
  return `₦${Math.round(amount).toLocaleString()}`;
}

function formatCurrencyFull(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₦${Math.round(amount).toLocaleString()}`;
  }
}

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
  currencyCode: string;
  data: SalesTrendPoint[];
};

function CustomTooltip({ active, payload, label, currencyCode, data }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = data.find((d) => d.label === label || d.time === label);
  const displayLabel = point?.tooltip ?? label ?? "";

  const revenue = payload.find((p) => p.dataKey === "revenue")?.value ?? 0;
  const orders = payload.find((p) => p.dataKey === "orders")?.value ?? 0;

  return (
    <div
      style={{
        background: "var(--tooltip-bg)",
        border: "1px solid var(--tooltip-border)",
        borderRadius: "12px",
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        backdropFilter: "blur(8px)",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--tooltip-label)",
          marginBottom: "8px",
        }}
      >
        {displayLabel}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--chart-revenue)",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "13px", color: "var(--tooltip-label)", opacity: 0.7 }}>Revenue</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--tooltip-value)", marginLeft: "auto", paddingLeft: "16px" }}>
            {formatCurrencyFull(revenue, currencyCode)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "3px",
              background: "var(--chart-orders)",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "13px", color: "var(--tooltip-label)", opacity: 0.7 }}>Orders</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--tooltip-value)", marginLeft: "auto", paddingLeft: "16px" }}>
            {Math.round(orders).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SalesTrendChart({ data, currencyCode = "NGN" }: SalesTrendChartProps) {
  const [activeView, setActiveView] = useState<"combined" | "revenue" | "orders">("combined");

  const chartData = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        name: point.label,
      })),
    [data],
  );

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);

  const views = [
    { key: "combined" as const, label: "Combined" },
    { key: "revenue" as const, label: "Revenue" },
    { key: "orders" as const, label: "Orders" },
  ];

  return (
    <div className="space-y-4">
      <style>{`
        :root {
          --chart-revenue: #0f172a;
          --chart-revenue-fill-top: rgba(15,23,42,0.15);
          --chart-revenue-fill-bottom: rgba(15,23,42,0.01);
          --chart-orders: #64748b;
          --chart-grid: rgba(0,0,0,0.06);
          --tooltip-bg: rgba(255,255,255,0.96);
          --tooltip-border: rgba(0,0,0,0.08);
          --tooltip-label: #374151;
          --tooltip-value: #111827;
        }
        .dark {
          --chart-revenue: #f1f5f9;
          --chart-revenue-fill-top: rgba(241,245,249,0.18);
          --chart-revenue-fill-bottom: rgba(241,245,249,0.01);
          --chart-orders: #94a3b8;
          --chart-grid: rgba(255,255,255,0.06);
          --tooltip-bg: rgba(15,23,42,0.96);
          --tooltip-border: rgba(255,255,255,0.08);
          --tooltip-label: #cbd5e1;
          --tooltip-value: #f1f5f9;
        }
      `}</style>

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-800/50">
          {views.map((view) => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all duration-150 ${
                activeView === view.key
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {(activeView === "combined" || activeView === "revenue") && (
            <span className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <span className="h-2 w-5 rounded-full" style={{ background: "var(--chart-revenue)", opacity: 0.8 }} />
              Revenue
            </span>
          )}
          {(activeView === "combined" || activeView === "orders") && (
            <span className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <span className="h-2 w-5 rounded" style={{ background: "var(--chart-orders)", opacity: 0.7 }} />
              Orders
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-60 w-full sm:h-72">
        {(activeView === "combined") && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-revenue)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--chart-revenue)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                className="text-neutral-500 dark:text-neutral-400"
              />
              <YAxis
                yAxisId="revenue"
                orientation="left"
                tickFormatter={(v) => formatCurrencyCompact(v, currencyCode)}
                tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
                tickLine={false}
                axisLine={false}
                width={56}
                className="text-neutral-500 dark:text-neutral-400"
              />
              <YAxis
                yAxisId="orders"
                orientation="right"
                tickFormatter={(v) => Math.round(v).toString()}
                tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
                tickLine={false}
                axisLine={false}
                width={32}
                className="text-neutral-500 dark:text-neutral-400"
              />
              <Tooltip
                content={<CustomTooltip currencyCode={currencyCode} data={data} />}
                cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }}
              />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-revenue)"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Bar
                yAxisId="orders"
                dataKey="orders"
                fill="var(--chart-orders)"
                opacity={0.35}
                radius={[2, 2, 0, 0]}
                maxBarSize={16}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeView === "revenue" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-revenue)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--chart-revenue)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                className="text-neutral-500 dark:text-neutral-400"
              />
              <YAxis
                tickFormatter={(v) => formatCurrencyCompact(v, currencyCode)}
                tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
                tickLine={false}
                axisLine={false}
                width={56}
                className="text-neutral-500 dark:text-neutral-400"
              />
              <Tooltip
                content={<CustomTooltip currencyCode={currencyCode} data={data} />}
                cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-revenue)"
                strokeWidth={2.5}
                fill="url(#revenueGradient2)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeView === "orders" && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-orders)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--chart-orders)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                className="text-neutral-500 dark:text-neutral-400"
              />
              <YAxis
                tickFormatter={(v) => Math.round(v).toString()}
                tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
                tickLine={false}
                axisLine={false}
                width={32}
                className="text-neutral-500 dark:text-neutral-400"
              />
              <Tooltip
                content={<CustomTooltip currencyCode={currencyCode} data={data} />}
                cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }}
              />
              <Bar
                dataKey="orders"
                fill="var(--chart-orders)"
                opacity={0.6}
                radius={[3, 3, 0, 0]}
                maxBarSize={20}
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="var(--chart-orders)"
                strokeWidth={1.5}
                fill="url(#ordersGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}