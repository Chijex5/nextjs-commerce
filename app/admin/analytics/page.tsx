import AdminNav from "components/admin/AdminNav";
import { and, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import {
  customOrderRequests,
  orderItems,
  orders,
  paymentTransactions,
  productCollections,
  productImages,
  productVariants,
  products,
} from "lib/db/schema";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import SalesTrendChart from "../../../components/admin/SalesTrendChartClient";

type TimeframeKey = "7d" | "30d" | "90d" | "365d";
type TimeframeOption = { label: string; value: TimeframeKey; days: number };
type DeltaTone = "positive" | "negative" | "neutral";
type ChartPoint = { time: string; label: string; tooltip: string; revenue: number; orders: number };
type ProductPerformanceRow = { productId: string; title: string; unitsSold: number; revenue: number; orderCount: number };

const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { label: "7D", value: "7d", days: 7 },
  { label: "30D", value: "30d", days: 30 },
  { label: "90D", value: "90d", days: 90 },
  { label: "1Y", value: "365d", days: 365 },
];
const DEFAULT_TIMEFRAME: TimeframeOption = { label: "30D", value: "30d", days: 30 };

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") { const p = Number(value); return Number.isFinite(p) ? p : 0; }
  return 0;
}

function formatCurrency(amount: number, currencyCode = "NGN"): string {
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: currencyCode, maximumFractionDigits: 0 }).format(amount);
  } catch { return `₦${Math.round(amount).toLocaleString()}`; }
}

function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`;
  return `₦${Math.round(amount).toLocaleString()}`;
}

function formatPercent(value: number): string { return `${value.toFixed(1)}%`; }

function formatDelta(current: number, previous: number): { label: string; tone: DeltaTone; value: string } {
  if (previous <= 0) {
    if (current > 0) return { label: "vs prev period", tone: "positive", value: "New" };
    return { label: "vs prev period", tone: "neutral", value: "—" };
  }
  const change = ((current - previous) / previous) * 100;
  const prefix = change > 0 ? "+" : "";
  const tone: DeltaTone = change > 0 ? "positive" : change < 0 ? "negative" : "neutral";
  return { label: "vs prev period", tone, value: `${prefix}${change.toFixed(1)}%` };
}

function toDayKey(value: string | Date): string {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  return value.slice(0, 10);
}

function buildChartSeries(days: number, periodStart: Date, trendRows: Array<{ day: string; revenue: unknown; orderCount: unknown }>): ChartPoint[] {
  const trendMap = new Map<string, { revenue: number; orders: number }>();
  for (const row of trendRows) {
    trendMap.set(toDayKey(row.day), { revenue: toNumber(row.revenue), orders: toNumber(row.orderCount) });
  }

  const fullSeries = Array.from({ length: days }, (_, i) => {
    const d = new Date(periodStart);
    d.setDate(periodStart.getDate() + i);
    const key = toDayKey(d);
    const values = trendMap.get(key);
    return { date: d, label: d.toLocaleDateString("en-NG", { month: "short", day: "numeric" }), key, revenue: values?.revenue ?? 0, orders: values?.orders ?? 0 };
  });

  if (days <= 31) return fullSeries.map((p) => ({ time: p.key, label: p.label, tooltip: p.label, revenue: p.revenue, orders: p.orders }));

  if (days <= 120) {
    return Array.from({ length: Math.ceil(fullSeries.length / 7) }, (_, i) => {
      const chunk = fullSeries.slice(i * 7, i * 7 + 7);
      if (!chunk.length) return null;
      return {
        time: toDayKey(chunk[0]!.date),
        label: `W${i + 1}`,
        tooltip: `${chunk[0]!.label} – ${chunk[chunk.length - 1]!.label}`,
        revenue: chunk.reduce((s, p) => s + p.revenue, 0),
        orders: chunk.reduce((s, p) => s + p.orders, 0),
      };
    }).filter(Boolean) as ChartPoint[];
  }

  const monthBuckets = new Map<string, { revenue: number; orders: number; firstDate: Date }>();
  for (const p of fullSeries) {
    const k = `${p.date.getFullYear()}-${p.date.getMonth() + 1}`;
    const existing = monthBuckets.get(k);
    if (existing) { existing.revenue += p.revenue; existing.orders += p.orders; }
    else monthBuckets.set(k, { revenue: p.revenue, orders: p.orders, firstDate: p.date });
  }

  return [...monthBuckets.entries()]
    .sort((a, b) => a[1].firstDate.getTime() - b[1].firstDate.getTime())
    .map(([, b]) => ({
      time: toDayKey(b.firstDate),
      label: b.firstDate.toLocaleDateString("en-NG", { month: "short" }),
      tooltip: b.firstDate.toLocaleDateString("en-NG", { month: "long", year: "numeric" }),
      revenue: b.revenue,
      orders: b.orders,
    }));
}

function formatUptime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── UI Primitives ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  delta,
  sub,
}: {
  label: string;
  value: string;
  delta: { value: string; tone: DeltaTone; label: string };
  sub?: string;
}) {
  const toneClass =
    delta.tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
      : delta.tone === "negative"
        ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20"
        : "text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
        {label}
      </p>
      <p className="mt-2.5 text-[1.75rem] font-bold leading-none tracking-tight text-neutral-900 dark:text-neutral-100">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{sub}</p>}
      <div className="mt-3 flex items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}>
          {delta.value}
        </span>
        <span className="text-[11px] text-neutral-400 dark:text-neutral-500">{delta.label}</span>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${className}`}>
      {children}
    </div>
  );
}

function StatusRow({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className={`text-sm font-semibold text-neutral-900 dark:text-neutral-100 ${valueClass}`}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-neutral-100 dark:bg-neutral-800" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ timeframe?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const selectedTimeframe = TIMEFRAME_OPTIONS.find((o) => o.value === params.timeframe) ?? DEFAULT_TIMEFRAME;
  const days = selectedTimeframe.days;

  const periodStart = new Date();
  periodStart.setHours(0, 0, 0, 0);
  periodStart.setDate(periodStart.getDate() - (days - 1));

  const previousPeriodStart = new Date(periodStart);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

  const healthProbeStart = Date.now();
  let databaseStatus: "healthy" | "degraded" = "healthy";
  let databaseLatencyMs = 0;

  try {
    await db.execute(sql`select 1`);
    databaseLatencyMs = Date.now() - healthProbeStart;
  } catch {
    databaseStatus = "degraded";
    databaseLatencyMs = Date.now() - healthProbeStart;
  }

  let periodOrders = 0, periodRevenue = 0, periodAov = 0;
  let previousOrders = 0, previousRevenue = 0, previousAov = 0;
  let completionRate = 0;
  let chartSeries: ChartPoint[] = [];
  let topProducts: ProductPerformanceRow[] = [];
  let totalProducts = 0, activeProducts = 0, totalVariants = 0, activeVariants = 0;
  let productsWithoutVariants = 0, productsWithoutImages = 0, productsWithoutCollections = 0;
  let catalogOrders = 0, customOrders = 0;
  let orderStatusCounts: Record<string, number> = {};
  let previousOrderStatusCounts: Record<string, number> = {};
  let customRequestStatusCounts: Record<string, number> = {};
  let paymentConflicts = 0;
  let recentOrders: Array<{ id: string; orderNumber: string; customerName: string; totalAmount: unknown; currencyCode: string; status: string; createdAt: Date }> = [];
  let loadError: string | null = null;

  try {
    const dayExpr = sql<string>`date(${orders.createdAt})`;

    const [
      periodSummaryRows, previousSummaryRows, trendRows, statusRows, previousStatusRows,
      orderTypeRows, topProductRows,
      totalProductsResult, activeProductsResult, totalVariantsResult, activeVariantsResult,
      missingVariantsResult, missingImagesResult, missingCollectionsResult,
      customRequestStatusRows, recentOrderRows, paymentConflictRows,
    ] = await Promise.all([
      db.select({ orderCount: sql<number>`count(*)`, revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`, averageOrderValue: sql<string>`coalesce(avg(${orders.totalAmount}), 0)` }).from(orders).where(gte(orders.createdAt, periodStart)),
      db.select({ orderCount: sql<number>`count(*)`, revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`, averageOrderValue: sql<string>`coalesce(avg(${orders.totalAmount}), 0)` }).from(orders).where(and(gte(orders.createdAt, previousPeriodStart), lt(orders.createdAt, periodStart))),
      db.select({ day: dayExpr, revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`, orderCount: sql<number>`count(*)` }).from(orders).where(gte(orders.createdAt, periodStart)).groupBy(dayExpr).orderBy(dayExpr),
      db.select({ status: orders.status, count: sql<number>`count(*)` }).from(orders).where(gte(orders.createdAt, periodStart)).groupBy(orders.status),
      db.select({ status: orders.status, count: sql<number>`count(*)` }).from(orders).where(and(gte(orders.createdAt, previousPeriodStart), lt(orders.createdAt, periodStart))).groupBy(orders.status),
      db.select({ orderType: orders.orderType, count: sql<number>`count(*)` }).from(orders).where(gte(orders.createdAt, periodStart)).groupBy(orders.orderType),
      db.select({ productId: orderItems.productId, title: orderItems.productTitle, unitsSold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`, revenue: sql<string>`coalesce(sum(${orderItems.totalAmount}), 0)`, orderCount: sql<number>`count(distinct ${orderItems.orderId})` }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(gte(orders.createdAt, periodStart)).groupBy(orderItems.productId, orderItems.productTitle).orderBy(desc(sql`sum(${orderItems.quantity})`)).limit(8),
      db.select({ count: sql<number>`count(*)` }).from(products),
      db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.availableForSale, true)),
      db.select({ count: sql<number>`count(*)` }).from(productVariants),
      db.select({ count: sql<number>`count(*)` }).from(productVariants).where(eq(productVariants.availableForSale, true)),
      db.select({ count: sql<number>`count(*)` }).from(products).leftJoin(productVariants, eq(products.id, productVariants.productId)).where(isNull(productVariants.id)),
      db.select({ count: sql<number>`count(*)` }).from(products).leftJoin(productImages, eq(products.id, productImages.productId)).where(isNull(productImages.id)),
      db.select({ count: sql<number>`count(*)` }).from(products).leftJoin(productCollections, eq(products.id, productCollections.productId)).where(isNull(productCollections.id)),
      db.select({ status: customOrderRequests.status, count: sql<number>`count(*)` }).from(customOrderRequests).where(gte(customOrderRequests.createdAt, periodStart)).groupBy(customOrderRequests.status),
      db.select({ id: orders.id, orderNumber: orders.orderNumber, customerName: orders.customerName, totalAmount: orders.totalAmount, currencyCode: orders.currencyCode, status: orders.status, createdAt: orders.createdAt }).from(orders).orderBy(desc(orders.createdAt)).limit(6),
      db.select({ count: sql<number>`count(*)` }).from(paymentTransactions).where(eq(paymentTransactions.status, "conflict")),
    ]);

    periodOrders = toNumber(periodSummaryRows[0]?.orderCount);
    periodRevenue = toNumber(periodSummaryRows[0]?.revenue);
    periodAov = toNumber(periodSummaryRows[0]?.averageOrderValue);
    previousOrders = toNumber(previousSummaryRows[0]?.orderCount);
    previousRevenue = toNumber(previousSummaryRows[0]?.revenue);
    previousAov = toNumber(previousSummaryRows[0]?.averageOrderValue);

    orderStatusCounts = statusRows.reduce<Record<string, number>>((a, r) => { a[r.status] = toNumber(r.count); return a; }, {});
    previousOrderStatusCounts = previousStatusRows.reduce<Record<string, number>>((a, r) => { a[r.status] = toNumber(r.count); return a; }, {});

    completionRate = periodOrders > 0 ? ((orderStatusCounts.completed ?? 0) / periodOrders) * 100 : 0;
    chartSeries = buildChartSeries(days, periodStart, trendRows);
    topProducts = topProductRows.map((r) => ({ productId: r.productId, title: r.title, unitsSold: toNumber(r.unitsSold), revenue: toNumber(r.revenue), orderCount: toNumber(r.orderCount) }));

    totalProducts = toNumber(totalProductsResult[0]?.count);
    activeProducts = toNumber(activeProductsResult[0]?.count);
    totalVariants = toNumber(totalVariantsResult[0]?.count);
    activeVariants = toNumber(activeVariantsResult[0]?.count);
    productsWithoutVariants = toNumber(missingVariantsResult[0]?.count);
    productsWithoutImages = toNumber(missingImagesResult[0]?.count);
    productsWithoutCollections = toNumber(missingCollectionsResult[0]?.count);

    for (const r of orderTypeRows) {
      if (r.orderType === "custom") customOrders = toNumber(r.count);
      else catalogOrders += toNumber(r.count);
    }

    customRequestStatusCounts = customRequestStatusRows.reduce<Record<string, number>>((a, r) => { a[r.status] = toNumber(r.count); return a; }, {});
    recentOrders = recentOrderRows;
    paymentConflicts = toNumber(paymentConflictRows[0]?.count);
  } catch (error) {
    console.error("Failed to load admin analytics:", error);
    loadError = "Some analytics data could not be loaded. Showing available metrics.";
  }

  const revenueDelta = formatDelta(periodRevenue, previousRevenue);
  const ordersDelta = formatDelta(periodOrders, previousOrders);
  const aovDelta = formatDelta(periodAov, previousAov);
  const previousCompletionRate = previousOrders > 0 ? ((previousOrderStatusCounts.completed ?? 0) / previousOrders) * 100 : 0;
  const completionDelta = formatDelta(completionRate, previousCompletionRate);

  const currencyCode = recentOrders.find((o) => o.currencyCode)?.currencyCode ?? "NGN";
  const maxProductUnits = Math.max(...topProducts.map((p) => p.unitsSold), 1);

  const openCustomRequests = (customRequestStatusCounts.submitted ?? 0) + (customRequestStatusCounts.reviewing ?? 0) + (customRequestStatusCounts.quoted ?? 0);
  const quotedCustomRequests = (customRequestStatusCounts.quoted ?? 0) + (customRequestStatusCounts.awaiting_payment ?? 0);
  const paidCustomRequests = customRequestStatusCounts.paid ?? 0;

  const cloudinaryConfigured = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  const paystackConfigured = Boolean(process.env.PAYSTACK_PUBLIC_KEY && process.env.PAYSTACK_SECRET_KEY);
  const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.SMTP_FROM_EMAIL);
  const uptimeLabel = formatUptime(process.uptime());

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
      case "processing": return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
      case "cancelled": return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800";
      default: return "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/60 dark:bg-neutral-950">
      <AdminNav currentPage="analytics" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                Analytics
              </h1>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Sales performance, product insights & system health
              </p>
            </div>

            {/* Timeframe pills */}
            <div className="flex items-center gap-1 self-start rounded-xl border border-neutral-200 bg-white p-1 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:self-auto">
              {TIMEFRAME_OPTIONS.map((option) => {
                const active = option.value === selectedTimeframe.value;
                return (
                  <Link
                    key={option.value}
                    href={`/admin/analytics?timeframe=${option.value}`}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all duration-150 ${
                      active
                        ? "bg-neutral-900 text-white shadow-sm dark:bg-neutral-100 dark:text-neutral-900"
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile timeframe select */}
          <form action="/admin/analytics" method="get" className="flex gap-2 sm:hidden">
            <select
              name="timeframe"
              defaultValue={selectedTimeframe.value}
              className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              {TIMEFRAME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button type="submit" className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
              Apply
            </button>
          </form>

          {loadError && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
              <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {loadError}
            </div>
          )}

          {/* ── KPI Cards ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard label="Revenue" value={formatCurrencyCompact(periodRevenue)} delta={revenueDelta} sub={formatCurrency(periodRevenue, currencyCode)} />
            <StatCard label="Orders" value={periodOrders.toLocaleString()} delta={ordersDelta} />
            <StatCard label="Avg. Order Value" value={formatCurrencyCompact(periodAov)} delta={aovDelta} sub={formatCurrency(periodAov, currencyCode)} />
            <StatCard label="Completion Rate" value={formatPercent(completionRate)} delta={completionDelta} sub={`${(orderStatusCounts.completed ?? 0).toLocaleString()} completed`} />
          </div>

          {/* ── Chart + Order Mix ──────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
            <Card className="p-5 sm:p-6">
              <SectionHeader
                title="Sales Trend"
                description="Revenue and order volume over the selected period"
              />
              <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-800/30 sm:p-4">
                {chartSeries.length === 0 ? (
                  <div className="flex h-60 items-center justify-center text-sm text-neutral-400 dark:text-neutral-500">
                    No sales data for this timeframe
                  </div>
                ) : (
                  <SalesTrendChart data={chartSeries} currencyCode={currencyCode} />
                )}
              </div>
            </Card>

            <div className="flex flex-col gap-4">
              {/* Order Mix */}
              <Card className="p-5">
                <SectionHeader title="Order Mix" />
                <div className="space-y-2">
                  {[
                    { label: "Catalog", value: catalogOrders, color: "bg-neutral-900 dark:bg-neutral-100" },
                    { label: "Custom", value: customOrders, color: "bg-neutral-400 dark:bg-neutral-500" },
                  ].map(({ label, value, color }) => {
                    const total = catalogOrders + customOrders;
                    const pct = total > 0 ? (value / total) * 100 : 0;
                    return (
                      <div key={label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
                          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{value.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.max(pct, 2)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <Divider />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Open requests</span>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{openCustomRequests}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Quoted</span>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{quotedCustomRequests}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Paid</span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{paidCustomRequests}</span>
                  </div>
                </div>
              </Card>

              {/* Order Status */}
              <Card className="p-5">
                <SectionHeader title="Order Status" />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Pending", key: "pending", color: "text-amber-600 dark:text-amber-400" },
                    { label: "Processing", key: "processing", color: "text-blue-600 dark:text-blue-400" },
                    { label: "Completed", key: "completed", color: "text-emerald-600 dark:text-emerald-400" },
                    { label: "Cancelled", key: "cancelled", color: "text-rose-600 dark:text-rose-400" },
                  ].map(({ label, key, color }) => (
                    <div key={key} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">{label}</p>
                      <p className={`mt-1 text-xl font-bold ${color}`}>{(orderStatusCounts[key] ?? 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* ── Top Products + Catalog Health ─────────────────────── */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
            <Card className="p-5 sm:p-6">
              <SectionHeader title="Top Products by Sales" description="Ranked by units sold in this period" />
              {topProducts.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-neutral-200 text-sm text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
                  No product sales found for this period
                </div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product, idx) => {
                    const pct = (product.unitsSold / maxProductUnits) * 100;
                    return (
                      <div key={product.productId}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{product.title}</p>
                              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{product.orderCount.toLocaleString()} orders</p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{product.unitsSold.toLocaleString()} <span className="font-normal text-neutral-400 text-xs">units</span></p>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{formatCurrency(product.revenue, currencyCode)}</p>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                          <div
                            className="h-full rounded-full bg-neutral-900 transition-all dark:bg-neutral-200"
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <div className="flex flex-col gap-4">
              {/* Catalog Health */}
              <Card className="p-5">
                <SectionHeader title="Catalog Health" />
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <StatusRow
                    label="Active Products"
                    value={`${activeProducts.toLocaleString()} / ${totalProducts.toLocaleString()}`}
                  />
                  <StatusRow
                    label="Active Variants"
                    value={`${activeVariants.toLocaleString()} / ${totalVariants.toLocaleString()}`}
                  />
                  <StatusRow
                    label="Missing Variants"
                    value={productsWithoutVariants > 0 ? productsWithoutVariants.toLocaleString() : "None"}
                    valueClass={productsWithoutVariants > 0 ? "!text-amber-600 dark:!text-amber-400" : "!text-emerald-600 dark:!text-emerald-400"}
                  />
                  <StatusRow
                    label="Missing Images"
                    value={productsWithoutImages > 0 ? productsWithoutImages.toLocaleString() : "None"}
                    valueClass={productsWithoutImages > 0 ? "!text-amber-600 dark:!text-amber-400" : "!text-emerald-600 dark:!text-emerald-400"}
                  />
                  <StatusRow
                    label="Missing Collections"
                    value={productsWithoutCollections > 0 ? productsWithoutCollections.toLocaleString() : "None"}
                    valueClass={productsWithoutCollections > 0 ? "!text-amber-600 dark:!text-amber-400" : "!text-emerald-600 dark:!text-emerald-400"}
                  />
                </div>
              </Card>

              {/* System Health */}
              <Card className="p-5">
                <SectionHeader title="System Health" />
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Database</span>
                    <span className={`flex items-center gap-1.5 text-sm font-semibold ${databaseStatus === "healthy" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${databaseStatus === "healthy" ? "bg-emerald-500" : "bg-rose-500"}`} />
                      {databaseStatus === "healthy" ? "Healthy" : "Degraded"}
                    </span>
                  </div>
                  <StatusRow label="DB Latency" value={`${databaseLatencyMs}ms`} />
                  <StatusRow label="Uptime" value={uptimeLabel} />
                  <StatusRow
                    label="Cloudinary"
                    value={cloudinaryConfigured ? "OK" : "Missing"}
                    valueClass={cloudinaryConfigured ? "!text-emerald-600 dark:!text-emerald-400" : "!text-amber-600 dark:!text-amber-400"}
                  />
                  <StatusRow
                    label="Paystack"
                    value={paystackConfigured ? "OK" : "Missing"}
                    valueClass={paystackConfigured ? "!text-emerald-600 dark:!text-emerald-400" : "!text-amber-600 dark:!text-amber-400"}
                  />
                  <StatusRow
                    label="Email"
                    value={emailConfigured ? "OK" : "Missing"}
                    valueClass={emailConfigured ? "!text-emerald-600 dark:!text-emerald-400" : "!text-amber-600 dark:!text-amber-400"}
                  />
                  <StatusRow
                    label="Payment Conflicts"
                    value={paymentConflicts > 0 ? paymentConflicts.toLocaleString() : "None"}
                    valueClass={paymentConflicts > 0 ? "!text-rose-600 dark:!text-rose-400" : "!text-emerald-600 dark:!text-emerald-400"}
                  />
                </div>
              </Card>
            </div>
          </div>

          {/* ── Recent Orders ─────────────────────────────────────── */}
          <Card>
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800 sm:px-6">
              <h2 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
                View all →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">No recent orders found.</div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex flex-col gap-2 px-5 py-3.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500">{order.orderNumber}</span>
                        {" · "}
                        {order.customerName}
                      </p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        {new Date(order.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(toNumber(order.totalAmount), order.currencyCode)}
                      </span>
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}