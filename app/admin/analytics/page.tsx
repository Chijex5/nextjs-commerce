import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { and, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import AdminNav from "components/admin/AdminNav";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import {
  customOrderRequests,
  orderItems,
  orders,
  productCollections,
  productImages,
  productVariants,
  products,
} from "lib/db/schema";

type TimeframeKey = "7d" | "30d" | "90d" | "365d";

type TimeframeOption = {
  label: string;
  value: TimeframeKey;
  days: number;
};

type DeltaTone = "positive" | "negative" | "neutral";

type ChartPoint = {
  label: string;
  tooltip: string;
  revenue: number;
  orders: number;
};

type ProductPerformanceRow = {
  productId: string;
  title: string;
  unitsSold: number;
  revenue: number;
  orderCount: number;
};

const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { label: "7 Days", value: "7d", days: 7 },
  { label: "30 Days", value: "30d", days: 30 },
  { label: "90 Days", value: "90d", days: 90 },
  { label: "12 Months", value: "365d", days: 365 },
];
const DEFAULT_TIMEFRAME: TimeframeOption = {
  label: "30 Days",
  value: "30d",
  days: 30,
};

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function formatCurrency(amount: number, currencyCode = "NGN"): string {
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

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatDelta(
  current: number,
  previous: number,
): { label: string; tone: DeltaTone } {
  if (previous <= 0) {
    if (current > 0) {
      return { label: "New activity in this period", tone: "positive" };
    }
    return { label: "No change from previous period", tone: "neutral" };
  }

  const change = ((current - previous) / previous) * 100;
  const prefix = change > 0 ? "+" : "";
  if (change > 0) {
    return {
      label: `${prefix}${change.toFixed(1)}% vs previous period`,
      tone: "positive",
    };
  }
  if (change < 0) {
    return {
      label: `${change.toFixed(1)}% vs previous period`,
      tone: "negative",
    };
  }

  return { label: "No change from previous period", tone: "neutral" };
}

function deltaToneClass(tone: DeltaTone): string {
  if (tone === "positive") {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (tone === "negative") {
    return "text-rose-600 dark:text-rose-400";
  }
  return "text-neutral-500 dark:text-neutral-400";
}

function toDayKey(value: string | Date): string {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  return value.slice(0, 10);
}

function buildChartSeries(
  days: number,
  periodStart: Date,
  trendRows: Array<{ day: string; revenue: unknown; orderCount: unknown }>,
): ChartPoint[] {
  const trendMap = new Map<string, { revenue: number; orders: number }>();
  for (const row of trendRows) {
    const key = toDayKey(row.day);
    trendMap.set(key, {
      revenue: toNumber(row.revenue),
      orders: toNumber(row.orderCount),
    });
  }

  const fullSeries: Array<{
    date: Date;
    label: string;
    key: string;
    revenue: number;
    orders: number;
  }> = [];

  for (let i = 0; i < days; i += 1) {
    const currentDate = new Date(periodStart);
    currentDate.setDate(periodStart.getDate() + i);

    const key = toDayKey(currentDate);
    const values = trendMap.get(key);
    const label = currentDate.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
    });

    fullSeries.push({
      date: currentDate,
      label,
      key,
      revenue: values?.revenue ?? 0,
      orders: values?.orders ?? 0,
    });
  }

  if (days <= 31) {
    return fullSeries.map((point) => ({
      label: point.label,
      tooltip: point.label,
      revenue: point.revenue,
      orders: point.orders,
    }));
  }

  if (days <= 120) {
    const buckets: ChartPoint[] = [];
    for (let index = 0; index < fullSeries.length; index += 7) {
      const chunk = fullSeries.slice(index, index + 7);
      if (!chunk.length) continue;

      const chunkRevenue = chunk.reduce((sum, point) => sum + point.revenue, 0);
      const chunkOrders = chunk.reduce((sum, point) => sum + point.orders, 0);
      const startLabel = chunk[0]?.label ?? "";
      const endLabel = chunk[chunk.length - 1]?.label ?? startLabel;
      const weekLabel = `W${Math.floor(index / 7) + 1}`;

      buckets.push({
        label: weekLabel,
        tooltip: `${startLabel} - ${endLabel}`,
        revenue: chunkRevenue,
        orders: chunkOrders,
      });
    }

    return buckets;
  }

  const monthBuckets = new Map<
    string,
    {
      revenue: number;
      orders: number;
      firstDate: Date;
    }
  >();

  for (const point of fullSeries) {
    const monthKey = `${point.date.getFullYear()}-${point.date.getMonth() + 1}`;
    const existing = monthBuckets.get(monthKey);
    if (existing) {
      existing.revenue += point.revenue;
      existing.orders += point.orders;
      continue;
    }

    monthBuckets.set(monthKey, {
      revenue: point.revenue,
      orders: point.orders,
      firstDate: point.date,
    });
  }

  return [...monthBuckets.entries()]
    .sort((a, b) => a[1].firstDate.getTime() - b[1].firstDate.getTime())
    .map(([, bucket]) => {
      const monthLabel = bucket.firstDate.toLocaleDateString("en-NG", {
        month: "short",
      });
      const tooltip = bucket.firstDate.toLocaleDateString("en-NG", {
        month: "long",
        year: "numeric",
      });

      return {
        label: monthLabel,
        tooltip,
        revenue: bucket.revenue,
        orders: bucket.orders,
      };
    });
}

function formatUptime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const days = Math.floor(safeSeconds / 86400);
  const hours = Math.floor((safeSeconds % 86400) / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ timeframe?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const selectedTimeframe =
    TIMEFRAME_OPTIONS.find((option) => option.value === params.timeframe) ??
    DEFAULT_TIMEFRAME;
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

  let periodOrders = 0;
  let periodRevenue = 0;
  let periodAov = 0;
  let previousOrders = 0;
  let previousRevenue = 0;
  let previousAov = 0;
  let completionRate = 0;
  let chartSeries: ChartPoint[] = [];
  let topProducts: ProductPerformanceRow[] = [];
  let totalProducts = 0;
  let activeProducts = 0;
  let totalVariants = 0;
  let activeVariants = 0;
  let productsWithoutVariants = 0;
  let productsWithoutImages = 0;
  let productsWithoutCollections = 0;
  let catalogOrders = 0;
  let customOrders = 0;
  let orderStatusCounts: Record<string, number> = {};
  let previousOrderStatusCounts: Record<string, number> = {};
  let customRequestStatusCounts: Record<string, number> = {};
  let recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: unknown;
    currencyCode: string;
    status: string;
    createdAt: Date;
  }> = [];
  let loadError: string | null = null;

  try {
    const dayExpression = sql<string>`date(${orders.createdAt})`;

    const [
      periodSummaryRows,
      previousSummaryRows,
      trendRows,
      statusRows,
      previousStatusRows,
      orderTypeRows,
      topProductRows,
      totalProductsResult,
      activeProductsResult,
      totalVariantsResult,
      activeVariantsResult,
      missingVariantsResult,
      missingImagesResult,
      missingCollectionsResult,
      customRequestStatusRows,
      recentOrderRows,
    ] = await Promise.all([
      db
        .select({
          orderCount: sql<number>`count(*)`,
          revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
          averageOrderValue: sql<string>`coalesce(avg(${orders.totalAmount}), 0)`,
        })
        .from(orders)
        .where(gte(orders.createdAt, periodStart)),
      db
        .select({
          orderCount: sql<number>`count(*)`,
          revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
          averageOrderValue: sql<string>`coalesce(avg(${orders.totalAmount}), 0)`,
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, previousPeriodStart),
            lt(orders.createdAt, periodStart),
          ),
        ),
      db
        .select({
          day: dayExpression,
          revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
          orderCount: sql<number>`count(*)`,
        })
        .from(orders)
        .where(gte(orders.createdAt, periodStart))
        .groupBy(dayExpression)
        .orderBy(dayExpression),
      db
        .select({
          status: orders.status,
          count: sql<number>`count(*)`,
        })
        .from(orders)
        .where(gte(orders.createdAt, periodStart))
        .groupBy(orders.status),
      db
        .select({
          status: orders.status,
          count: sql<number>`count(*)`,
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, previousPeriodStart),
            lt(orders.createdAt, periodStart),
          ),
        )
        .groupBy(orders.status),
      db
        .select({
          orderType: orders.orderType,
          count: sql<number>`count(*)`,
        })
        .from(orders)
        .where(gte(orders.createdAt, periodStart))
        .groupBy(orders.orderType),
      db
        .select({
          productId: orderItems.productId,
          title: orderItems.productTitle,
          unitsSold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
          revenue: sql<string>`coalesce(sum(${orderItems.totalAmount}), 0)`,
          orderCount: sql<number>`count(distinct ${orderItems.orderId})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(gte(orders.createdAt, periodStart))
        .groupBy(orderItems.productId, orderItems.productTitle)
        .orderBy(desc(sql`sum(${orderItems.quantity})`))
        .limit(8),
      db.select({ count: sql<number>`count(*)` }).from(products),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.availableForSale, true)),
      db.select({ count: sql<number>`count(*)` }).from(productVariants),
      db
        .select({ count: sql<number>`count(*)` })
        .from(productVariants)
        .where(eq(productVariants.availableForSale, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .leftJoin(productVariants, eq(products.id, productVariants.productId))
        .where(isNull(productVariants.id)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .leftJoin(productImages, eq(products.id, productImages.productId))
        .where(isNull(productImages.id)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .leftJoin(
          productCollections,
          eq(products.id, productCollections.productId),
        )
        .where(isNull(productCollections.id)),
      db
        .select({
          status: customOrderRequests.status,
          count: sql<number>`count(*)`,
        })
        .from(customOrderRequests)
        .where(gte(customOrderRequests.createdAt, periodStart))
        .groupBy(customOrderRequests.status),
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerName: orders.customerName,
          totalAmount: orders.totalAmount,
          currencyCode: orders.currencyCode,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(6),
    ]);

    periodOrders = toNumber(periodSummaryRows[0]?.orderCount);
    periodRevenue = toNumber(periodSummaryRows[0]?.revenue);
    periodAov = toNumber(periodSummaryRows[0]?.averageOrderValue);

    previousOrders = toNumber(previousSummaryRows[0]?.orderCount);
    previousRevenue = toNumber(previousSummaryRows[0]?.revenue);
    previousAov = toNumber(previousSummaryRows[0]?.averageOrderValue);

    orderStatusCounts = statusRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = toNumber(row.count);
      return acc;
    }, {});
    previousOrderStatusCounts = previousStatusRows.reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.status] = toNumber(row.count);
        return acc;
      },
      {},
    );

    const completedOrders = orderStatusCounts.completed ?? 0;
    completionRate =
      periodOrders > 0 ? (completedOrders / Math.max(periodOrders, 1)) * 100 : 0;

    chartSeries = buildChartSeries(days, periodStart, trendRows);

    topProducts = topProductRows.map((row) => ({
      productId: row.productId,
      title: row.title,
      unitsSold: toNumber(row.unitsSold),
      revenue: toNumber(row.revenue),
      orderCount: toNumber(row.orderCount),
    }));

    totalProducts = toNumber(totalProductsResult[0]?.count);
    activeProducts = toNumber(activeProductsResult[0]?.count);
    totalVariants = toNumber(totalVariantsResult[0]?.count);
    activeVariants = toNumber(activeVariantsResult[0]?.count);
    productsWithoutVariants = toNumber(missingVariantsResult[0]?.count);
    productsWithoutImages = toNumber(missingImagesResult[0]?.count);
    productsWithoutCollections = toNumber(missingCollectionsResult[0]?.count);

    for (const row of orderTypeRows) {
      if (row.orderType === "custom") {
        customOrders = toNumber(row.count);
      } else {
        catalogOrders += toNumber(row.count);
      }
    }

    customRequestStatusCounts = customRequestStatusRows.reduce<
      Record<string, number>
    >((acc, row) => {
      acc[row.status] = toNumber(row.count);
      return acc;
    }, {});

    recentOrders = recentOrderRows;
  } catch (error) {
    console.error("Failed to load admin analytics:", error);
    loadError = "Some analytics data could not be loaded. Showing available metrics.";
  }

  const revenueDelta = formatDelta(periodRevenue, previousRevenue);
  const ordersDelta = formatDelta(periodOrders, previousOrders);
  const aovDelta = formatDelta(periodAov, previousAov);
  const previousCompletionRate =
    previousOrders > 0
      ? ((previousOrderStatusCounts.completed ?? 0) /
          Math.max(previousOrders, 1)) *
        100
      : 0;
  const completionDelta = formatDelta(
    completionRate,
    previousCompletionRate,
  );

  const maxRevenuePoint = Math.max(
    ...chartSeries.map((point) => point.revenue),
    1,
  );
  const maxProductUnits = Math.max(
    ...topProducts.map((product) => product.unitsSold),
    1,
  );

  const paidCustomRequests = customRequestStatusCounts.paid ?? 0;
  const quotedCustomRequests =
    (customRequestStatusCounts.quoted ?? 0) +
    (customRequestStatusCounts.awaiting_payment ?? 0);
  const openCustomRequests =
    (customRequestStatusCounts.submitted ?? 0) +
    (customRequestStatusCounts.reviewing ?? 0) +
    (customRequestStatusCounts.quoted ?? 0);

  const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
  const paystackConfigured = Boolean(
    process.env.PAYSTACK_PUBLIC_KEY && process.env.PAYSTACK_SECRET_KEY,
  );
  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY && process.env.SMTP_FROM_EMAIL,
  );
  const uptimeLabel = formatUptime(process.uptime());

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="analytics" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:space-y-8 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                Analytics
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Sales, product performance, operations, and system health in one
                view.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <form
                action="/admin/analytics"
                method="get"
                className="flex flex-col gap-3 sm:hidden"
              >
                <label
                  htmlFor="timeframe"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400"
                >
                  Timeframe
                </label>
                <div className="flex items-center gap-2">
                  <select
                    id="timeframe"
                    name="timeframe"
                    defaultValue={selectedTimeframe.value}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    {TIMEFRAME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    Apply
                  </button>
                </div>
              </form>

              <div className="hidden items-center justify-between gap-4 sm:flex">
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  Showing {selectedTimeframe.label.toLowerCase()} of analytics
                  data
                </p>
                <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-700 dark:bg-neutral-800">
                  {TIMEFRAME_OPTIONS.map((option) => {
                    const active = option.value === selectedTimeframe.value;
                    return (
                      <Link
                        key={option.value}
                        href={`/admin/analytics?timeframe=${option.value}`}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          active
                            ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100"
                            : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                        }`}
                      >
                        {option.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {loadError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
              {loadError}
            </div>
          ) : null}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                Revenue
              </p>
              <p className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {formatCurrency(periodRevenue)}
              </p>
              <p className={`mt-2 text-sm ${deltaToneClass(revenueDelta.tone)}`}>
                {revenueDelta.label}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                Orders
              </p>
              <p className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {periodOrders.toLocaleString()}
              </p>
              <p className={`mt-2 text-sm ${deltaToneClass(ordersDelta.tone)}`}>
                {ordersDelta.label}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                Avg. Order Value
              </p>
              <p className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {formatCurrency(periodAov)}
              </p>
              <p className={`mt-2 text-sm ${deltaToneClass(aovDelta.tone)}`}>
                {aovDelta.label}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                Completion Rate
              </p>
              <p className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {formatPercent(completionRate)}
              </p>
              <p className={`mt-2 text-sm ${deltaToneClass(completionDelta.tone)}`}>
                {completionDelta.label}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Sales Trend
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Revenue bars with order count labels for the selected period.
                  </p>
                </div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  {chartSeries.length} data points
                </p>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/40 sm:p-4">
                {chartSeries.length === 0 ? (
                  <div className="flex h-56 w-full items-center justify-center text-sm text-neutral-500 dark:text-neutral-400 sm:h-64">
                    No sales data for this timeframe.
                  </div>
                ) : (
                  <div className="h-56 overflow-x-auto sm:h-64">
                    <div className="flex h-full min-w-max items-end gap-2">
                      {chartSeries.map((point) => {
                        const heightPercent =
                          (point.revenue / Math.max(maxRevenuePoint, 1)) * 100;
                        return (
                          <div
                            key={point.tooltip}
                            className="flex h-full min-w-[2.5rem] flex-col justify-end"
                            title={`${point.tooltip}: ${formatCurrency(point.revenue)} from ${point.orders} orders`}
                          >
                            <div className="flex flex-1 items-end rounded-md bg-neutral-100 px-0.5 dark:bg-neutral-800">
                              <div
                                className="w-full rounded-md bg-neutral-900 transition-[height] duration-300 dark:bg-neutral-200"
                                style={{ height: `${Math.max(8, heightPercent)}%` }}
                              />
                            </div>
                            <div className="mt-2 text-center">
                              <p className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-200">
                                {point.label}
                              </p>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                {point.orders}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Order Mix
                </h2>
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
                      Catalog Orders
                    </p>
                    <p className="mt-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                      {catalogOrders.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
                      Custom Orders
                    </p>
                    <p className="mt-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                      {customOrders.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
                      Open Custom Requests
                    </p>
                    <p className="mt-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                      {openCustomRequests.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {quotedCustomRequests.toLocaleString()} quoted,{" "}
                      {paidCustomRequests.toLocaleString()} paid
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  System Health
                </h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Database
                    </span>
                    <span
                      className={
                        databaseStatus === "healthy"
                          ? "font-semibold text-emerald-600 dark:text-emerald-400"
                          : "font-semibold text-rose-600 dark:text-rose-400"
                      }
                    >
                      {databaseStatus === "healthy" ? "Healthy" : "Degraded"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      DB Latency
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {databaseLatencyMs}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Runtime Uptime
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {uptimeLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Cloudinary
                      </span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {cloudinaryConfigured ? "Configured" : "Missing config"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Paystack
                      </span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {paystackConfigured ? "Configured" : "Missing config"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Email
                      </span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {emailConfigured ? "Configured" : "Missing config"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Top Products by Sales
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Ranked by units sold in the selected timeframe.
                </p>
              </div>

              <div className="space-y-4">
                {topProducts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                    No product sales found for this period.
                  </div>
                ) : (
                  topProducts.map((product) => {
                    const width = (product.unitsSold / maxProductUnits) * 100;
                    return (
                      <div key={product.productId} className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {product.title}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {product.orderCount.toLocaleString()} orders
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {product.unitsSold.toLocaleString()} units
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {formatCurrency(product.revenue)}
                            </p>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
                          <div
                            className="h-full rounded-full bg-neutral-900 dark:bg-neutral-200"
                            style={{ width: `${Math.max(5, width)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Order Status Breakdown
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                    <p className="text-xs uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
                      Pending
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {(orderStatusCounts.pending ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                    <p className="text-xs uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
                      Processing
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {(orderStatusCounts.processing ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                    <p className="text-xs uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
                      Completed
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {(orderStatusCounts.completed ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                    <p className="text-xs uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
                      Cancelled
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {(orderStatusCounts.cancelled ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Catalog Health
                </h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Active Products
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {activeProducts.toLocaleString()} /{" "}
                      {totalProducts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Active Variants
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {activeVariants.toLocaleString()} /{" "}
                      {totalVariants.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Missing Variants
                    </span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      {productsWithoutVariants.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Missing Images
                    </span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      {productsWithoutImages.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Missing Collections
                    </span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      {productsWithoutCollections.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800 sm:px-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Recent Activity
              </h2>
            </div>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {recentOrders.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  No recent orders found.
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {order.orderNumber} - {order.customerName}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(order.createdAt).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(
                          toNumber(order.totalAmount),
                          order.currencyCode,
                        )}
                      </span>
                      <span className="inline-flex rounded-full border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
