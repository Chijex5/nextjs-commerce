"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";

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

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function toTime(value: string): Time {
  return value as Time;
}

export default function SalesTrendChart({
  data,
  currencyCode = "NGN",
}: SalesTrendChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const revenueSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const ordersSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const revenueData = useMemo(
    () => data.map((point) => ({ time: toTime(point.time), value: point.revenue })),
    [data],
  );
  const ordersData = useMemo(
    () => data.map((point) => ({ time: toTime(point.time), value: point.orders })),
    [data],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const darkMode = isDarkMode();
    const textColor = darkMode ? "#e5e5e5" : "#404040";
    const gridColor = darkMode ? "rgba(64,64,64,0.6)" : "rgba(212,212,212,0.8)";
    const revenueLine = darkMode ? "#f5f5f5" : "#111827";
    const revenueAreaTop = darkMode
      ? "rgba(244,244,245,0.28)"
      : "rgba(15,23,42,0.16)";
    const revenueAreaBottom = darkMode
      ? "rgba(244,244,245,0.02)"
      : "rgba(15,23,42,0.02)";
    const ordersLine = darkMode ? "#a3a3a3" : "#525252";

    const formatter = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    });

    const chart = createChart(container, {
      width: container.clientWidth || 320,
      height: container.clientHeight || 260,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor,
        fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui",
      },
      rightPriceScale: {
        borderVisible: false,
        textColor,
      },
      leftPriceScale: {
        borderVisible: false,
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: darkMode ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)",
          width: 1,
        },
        horzLine: {
          color: darkMode ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)",
          width: 1,
        },
      },
      timeScale: {
        borderVisible: false,
        tickMarkFormatter: (time: Time) => {
          if (typeof time === "string") {
            return time.slice(5);
          }
          if (typeof time === "number") {
            return new Date(time * 1000).toLocaleDateString("en-NG", {
              month: "short",
              day: "numeric",
            });
          }
          return `${time.month}/${time.day}`;
        },
      },
      localization: {
        priceFormatter: (value: number) => formatter.format(value),
      },
    });

    const revenueSeries = chart.addAreaSeries({
      priceScaleId: "left",
      lineColor: revenueLine,
      topColor: revenueAreaTop,
      bottomColor: revenueAreaBottom,
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (value: number) => formatter.format(value),
      },
    });

    const ordersSeries = chart.addLineSeries({
      priceScaleId: "right",
      color: ordersLine,
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (value: number) => Math.round(value).toLocaleString(),
      },
    });

    revenueSeries.setData(revenueData);
    ordersSeries.setData(ordersData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    revenueSeriesRef.current = revenueSeries;
    ordersSeriesRef.current = ordersSeries;

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({
        width: container.clientWidth || 320,
        height: container.clientHeight || 260,
      });
      chart.timeScale().fitContent();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [currencyCode]);

  useEffect(() => {
    if (!chartRef.current || !revenueSeriesRef.current || !ordersSeriesRef.current)
      return;

    revenueSeriesRef.current.setData(revenueData);
    ordersSeriesRef.current.setData(ordersData);
    chartRef.current.timeScale().fitContent();
  }, [ordersData, revenueData]);

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="h-56 w-full sm:h-64"
        role="img"
        aria-label="Sales trend time series chart"
      />
      <div className="flex flex-wrap gap-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        <span className="flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-neutral-900/70 dark:bg-neutral-100/70" />
          Revenue
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-6 rounded-full bg-neutral-500 dark:bg-neutral-300" />
          Orders
        </span>
      </div>
    </div>
  );
}
