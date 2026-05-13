import { getGreeting } from "@/lib/greetings";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "lib/db";
import {
    collections,
    orders,
    paymentTransactions,
    products,
} from "lib/db/schema";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminNav from "../../../components/admin/AdminNav";
import { authOptions } from "../../../lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    console.log("[admin-dashboard] redirecting to login");
    redirect("/admin/login");
  }

  const now = new Date();
  const greeting = getGreeting({
    dateTime: now,
    name: session.user?.name,
  });

  // Date ranges
  const last7DaysStart = new Date(now);
  last7DaysStart.setDate(last7DaysStart.getDate() - 6);
  last7DaysStart.setHours(0, 0, 0, 0);

  const prev7DaysStart = new Date(last7DaysStart);
  prev7DaysStart.setDate(prev7DaysStart.getDate() - 7);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const last24HoursStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const toDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Build day labels for the last 7 days
  const dayLabels: string[] = [];
  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dayKeys.push(toDateKey(d));
    dayLabels.push(
      d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3),
    );
  }

  const [
    productsCountResult,
    collectionsCountResult,
    ordersCountResult,
    pendingOrdersResult,
    processingOrdersResult,
    recentOrders,
    last7DaysRevenueResult,
    prev7DaysRevenueResult,
    last7DaysOrdersCountResult,
    prev7DaysOrdersCountResult,
    todayRevenueResult,
    completedOrdersResult,
    dailyRevenueGroupedRows,
    paymentTotal24hResult,
    paymentFailed24hResult,
    paymentConflict24hResult,
    paymentFailureReasonsResult,
    outOfStockProductsCountResult,
    outOfStockProducts,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(products),
    db.select({ count: sql<number>`count(*)` }).from(collections),
    db.select({ count: sql<number>`count(*)` }).from(orders),

    // Pending orders (need attention)
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.status, "pending"))
      .orderBy(desc(orders.createdAt))
      .limit(5),

    // Processing count
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "processing")),

    // Recent orders for activity feed
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(6),

    // Last 7 days revenue
    db
      .select({ revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)` })
      .from(orders)
      .where(gte(orders.createdAt, last7DaysStart)),

    // Prev 7 days revenue (for % change)
    db
      .select({ revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, prev7DaysStart),
          lt(orders.createdAt, last7DaysStart),
        ),
      ),

    // Last 7 days order count
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(gte(orders.createdAt, last7DaysStart)),

    // Prev 7 days order count
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, prev7DaysStart),
          lt(orders.createdAt, last7DaysStart),
        ),
      ),

    // Today's revenue
    db
      .select({ revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)` })
      .from(orders)
      .where(gte(orders.createdAt, todayStart)),

    // Completed orders count
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "completed")),

    // Daily revenue aggregation (single query for chart)
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
        revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, last7DaysStart))
      .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
      .orderBy(sql`date_trunc('day', ${orders.createdAt}) asc`),

    // Payment health (last 24h)
    db
      .select({ count: sql<number>`count(*)` })
      .from(paymentTransactions)
      .where(gte(paymentTransactions.createdAt, last24HoursStart)),

    db
      .select({ count: sql<number>`count(*)` })
      .from(paymentTransactions)
      .where(
        and(
          gte(paymentTransactions.createdAt, last24HoursStart),
          eq(paymentTransactions.status, "failed"),
        ),
      ),

    db
      .select({ count: sql<number>`count(*)` })
      .from(paymentTransactions)
      .where(
        and(
          gte(paymentTransactions.createdAt, last24HoursStart),
          eq(paymentTransactions.status, "conflict"),
        ),
      ),

    db
      .select({
        reason: sql<string>`coalesce(${paymentTransactions.conflictCode}, ${paymentTransactions.paystackStatus}, ${paymentTransactions.status}, 'unknown')`,
        count: sql<number>`count(*)`,
      })
      .from(paymentTransactions)
      .where(
        and(
          gte(paymentTransactions.createdAt, last7DaysStart),
          sql`${paymentTransactions.status} in ('failed', 'conflict')`,
        ),
      )
      .groupBy(
        sql`coalesce(${paymentTransactions.conflictCode}, ${paymentTransactions.paystackStatus}, ${paymentTransactions.status}, 'unknown')`,
      )
      .orderBy(desc(sql<number>`count(*)`))
      .limit(3),

    // Inventory risk (stock proxy via availability flag)
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.availableForSale, false)),

    db
      .select({
        id: products.id,
        title: products.title,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.availableForSale, false))
      .orderBy(desc(products.updatedAt))
      .limit(5),
  ]);

  const dailyRevenueByDate = new Map(
    dailyRevenueGroupedRows.map((row) => [row.day, Number(row.revenue ?? 0)]),
  );
  const dailyRevenues: number[] = dayKeys.map(
    (dayKey) => dailyRevenueByDate.get(dayKey) ?? 0,
  );

  // Derived values
  const productsCount = Number(productsCountResult[0]?.count ?? 0);
  const collectionsCount = Number(collectionsCountResult[0]?.count ?? 0);
  const totalOrdersCount = Number(ordersCountResult[0]?.count ?? 0);
  const pendingCount = pendingOrdersResult.length;
  const processingCount = Number(processingOrdersResult[0]?.count ?? 0);
  const completedCount = Number(completedOrdersResult[0]?.count ?? 0);

  const last7DaysRevenue = Number(last7DaysRevenueResult[0]?.revenue ?? 0);
  const prev7DaysRevenue = Number(prev7DaysRevenueResult[0]?.revenue ?? 0);
  const last7DaysOrdersCount = Number(
    last7DaysOrdersCountResult[0]?.count ?? 0,
  );
  const prev7DaysOrdersCount = Number(
    prev7DaysOrdersCountResult[0]?.count ?? 0,
  );
  const todayRevenue = Number(todayRevenueResult[0]?.revenue ?? 0);
  const paymentTotal24h = Number(paymentTotal24hResult[0]?.count ?? 0);
  const paymentFailed24h = Number(paymentFailed24hResult[0]?.count ?? 0);
  const paymentConflict24h = Number(paymentConflict24hResult[0]?.count ?? 0);
  const paymentProblem24h = paymentFailed24h + paymentConflict24h;
  const paymentFailureRate24h =
    paymentTotal24h > 0
      ? Math.round((paymentProblem24h / paymentTotal24h) * 100)
      : 0;

  const outOfStockCount = Number(outOfStockProductsCountResult[0]?.count ?? 0);
  const inStockCount = Math.max(0, productsCount - outOfStockCount);
  const outOfStockRate =
    productsCount > 0 ? Math.round((outOfStockCount / productsCount) * 100) : 0;

  const revenueChange =
    prev7DaysRevenue > 0
      ? ((last7DaysRevenue - prev7DaysRevenue) / prev7DaysRevenue) * 100
      : last7DaysRevenue > 0
        ? 100
        : 0;

  const ordersChange =
    prev7DaysOrdersCount > 0
      ? ((last7DaysOrdersCount - prev7DaysOrdersCount) / prev7DaysOrdersCount) *
        100
      : last7DaysOrdersCount > 0
        ? 100
        : 0;

  const aov =
    last7DaysOrdersCount > 0 ? last7DaysRevenue / last7DaysOrdersCount : 0;

  const fulfillmentRate =
    totalOrdersCount > 0
      ? Math.round((completedCount / totalOrdersCount) * 100)
      : 0;

  const maxDailyRevenue = Math.max(...dailyRevenues, 1);

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400";
    }
  };

  const timeSince = (date: Date | string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="dashboard" userEmail={session.user?.email} />

      <div className="py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* ── Header ── */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {now.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                {greeting}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Add Product
              </Link>
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                View Orders
              </Link>
            </div>
          </div>

          {/* ── Attention Banner ── */}
          {pendingCount > 0 && (
            <Link
              href="/admin/orders?status=pending"
              className="mb-6 flex items-center justify-between rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 transition-colors hover:bg-yellow-100 dark:border-yellow-900/40 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/20"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-200 dark:bg-yellow-900/40">
                  <svg
                    className="h-4 w-4 text-yellow-700 dark:text-yellow-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                </span>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  {pendingCount} order{pendingCount !== 1 ? "s" : ""} waiting
                  for confirmation
                </p>
              </div>
              <span className="shrink-0 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                Review →
              </span>
            </Link>
          )}

          {/* ── KPI Row ── */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Revenue 7d */}
            <div className="col-span-2 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                Revenue · 7d
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                ₦{last7DaysRevenue.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    revenueChange >= 0
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {revenueChange >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(Math.round(revenueChange))}%
                </span>
                <span className="text-xs text-neutral-400">vs prev week</span>
              </div>
            </div>

            {/* Orders 7d */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                Orders · 7d
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                {last7DaysOrdersCount}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    ordersChange >= 0
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {ordersChange >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(Math.round(ordersChange))}%
                </span>
                <span className="text-xs text-neutral-400">vs prev week</span>
              </div>
            </div>

            {/* Today */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                Today
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                ₦{todayRevenue.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-neutral-400">
                Avg order ₦{Math.round(aov).toLocaleString()}
              </p>
            </div>

            {/* Fulfillment */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                Fulfillment
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                {fulfillmentRate}%
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${fulfillmentRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── Revenue Chart + Order Status ── */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Revenue Bar Chart */}
            <div className="col-span-1 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-2">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Revenue
                  </h2>
                  <p className="text-xs text-neutral-400">Last 7 days</p>
                </div>
                <Link
                  href="/admin/analytics"
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Full analytics →
                </Link>
              </div>

              <div className="flex h-40 items-end gap-2">
                {dailyRevenues.map((rev, i) => {
                  const heightPct = Math.max(
                    (rev / maxDailyRevenue) * 100,
                    rev > 0 ? 4 : 0,
                  );
                  const isToday = i === dailyRevenues.length - 1;
                  return (
                    <div
                      key={i}
                      className="group relative flex flex-1 flex-col items-center justify-end gap-1.5"
                    >
                      {/* Hover tooltip */}
                      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-900 shadow-md group-hover:block dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 z-10">
                        ₦{rev.toLocaleString()}
                        <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
                      </div>
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          isToday
                            ? "bg-neutral-900 dark:bg-neutral-100"
                            : "bg-neutral-200 group-hover:bg-neutral-300 dark:bg-neutral-700 dark:group-hover:bg-neutral-600"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span
                        className={`text-[10px] font-medium ${
                          isToday
                            ? "text-neutral-700 dark:text-neutral-300"
                            : "text-neutral-400"
                        }`}
                      >
                        {dayLabels[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Status + Catalog mini-stats */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Order Status
                </h2>
                <p className="text-xs text-neutral-400">
                  {totalOrdersCount} total
                </p>
              </div>

              <div className="space-y-3.5">
                {[
                  {
                    label: "Completed",
                    count: completedCount,
                    barColor: "bg-green-500",
                    textColor: "text-green-700 dark:text-green-400",
                  },
                  {
                    label: "Processing",
                    count: processingCount,
                    barColor: "bg-blue-500",
                    textColor: "text-blue-700 dark:text-blue-400",
                  },
                  {
                    label: "Pending",
                    count: pendingCount,
                    barColor: "bg-yellow-400",
                    textColor: "text-yellow-700 dark:text-yellow-400",
                  },
                  {
                    label: "Other",
                    count: Math.max(
                      0,
                      totalOrdersCount -
                        completedCount -
                        processingCount -
                        pendingCount,
                    ),
                    barColor: "bg-neutral-300 dark:bg-neutral-600",
                    textColor: "text-neutral-500",
                  },
                ].map(({ label, count, barColor, textColor }) => (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {label}
                      </span>
                      <span className={`text-xs font-semibold ${textColor}`}>
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{
                          width:
                            totalOrdersCount > 0
                              ? `${(count / totalOrdersCount) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Catalog mini-stats */}
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <Link
                  href="/admin/products"
                  className="group rounded-lg border border-neutral-100 p-3 transition-colors hover:border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/50"
                >
                  <p className="text-xs text-neutral-400 group-hover:text-neutral-500">
                    Products
                  </p>
                  <p className="mt-0.5 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {productsCount}
                  </p>
                </Link>
                <Link
                  href="/admin/collections"
                  className="group rounded-lg border border-neutral-100 p-3 transition-colors hover:border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/50"
                >
                  <p className="text-xs text-neutral-400 group-hover:text-neutral-500">
                    Collections
                  </p>
                  <p className="mt-0.5 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {collectionsCount}
                  </p>
                </Link>
              </div>
            </div>
          </div>

          {/* ── Payment Health + Inventory Risk ── */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Payment Health
                  </h2>
                  <p className="text-xs text-neutral-400">Last 24 hours</p>
                </div>
                <Link
                  href="/admin/payments"
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Open ledger →
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
                  <p className="text-xs text-neutral-400">Transactions</p>
                  <p className="mt-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {paymentTotal24h}
                  </p>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50/60 p-3 dark:border-red-900/30 dark:bg-red-900/10">
                  <p className="text-xs text-red-500">Failed</p>
                  <p className="mt-1 text-xl font-semibold text-red-700 dark:text-red-300">
                    {paymentFailed24h}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3 dark:border-amber-900/30 dark:bg-amber-900/10">
                  <p className="text-xs text-amber-600">Conflicts</p>
                  <p className="mt-1 text-xl font-semibold text-amber-700 dark:text-amber-300">
                    {paymentConflict24h}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Problem rate
                  </p>
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {paymentFailureRate24h}%
                  </p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className={`h-full rounded-full ${
                      paymentFailureRate24h >= 20
                        ? "bg-red-500"
                        : paymentFailureRate24h >= 10
                          ? "bg-amber-500"
                          : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(paymentFailureRate24h, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Top failure reasons · 7d
                </p>
                {paymentFailureReasonsResult.length === 0 ? (
                  <p className="text-xs text-neutral-400">
                    No failed/conflict payments in the last 7 days.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {paymentFailureReasonsResult.map((reason) => (
                      <div
                        key={reason.reason}
                        className="flex items-center justify-between rounded-md border border-neutral-100 px-2.5 py-1.5 text-xs dark:border-neutral-800"
                      >
                        <span className="truncate text-neutral-600 dark:text-neutral-300">
                          {reason.reason}
                        </span>
                        <span className="ml-2 shrink-0 font-semibold text-neutral-800 dark:text-neutral-100">
                          {reason.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Inventory Risk
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Availability-based stock proxy
                  </p>
                </div>
                <Link
                  href="/admin/products"
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Manage products →
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
                  <p className="text-xs text-neutral-400">Catalog</p>
                  <p className="mt-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {productsCount}
                  </p>
                </div>
                <div className="rounded-lg border border-green-100 bg-green-50/60 p-3 dark:border-green-900/30 dark:bg-green-900/10">
                  <p className="text-xs text-green-600">In stock</p>
                  <p className="mt-1 text-xl font-semibold text-green-700 dark:text-green-300">
                    {inStockCount}
                  </p>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50/60 p-3 dark:border-red-900/30 dark:bg-red-900/10">
                  <p className="text-xs text-red-500">Out of stock</p>
                  <p className="mt-1 text-xl font-semibold text-red-700 dark:text-red-300">
                    {outOfStockCount}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Out-of-stock rate
                  </p>
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {outOfStockRate}%
                  </p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className={`h-full rounded-full ${
                      outOfStockRate >= 30
                        ? "bg-red-500"
                        : outOfStockRate >= 15
                          ? "bg-amber-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(outOfStockRate, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Recently unavailable
                </p>
                {outOfStockProducts.length === 0 ? (
                  <p className="text-xs text-neutral-400">
                    No unavailable products right now.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {outOfStockProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={`/admin/products/${product.id}/edit`}
                        className="flex items-center justify-between rounded-md border border-neutral-100 px-2.5 py-1.5 text-xs transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/60"
                      >
                        <span className="truncate text-neutral-700 dark:text-neutral-200">
                          {product.title}
                        </span>
                        <span className="ml-2 shrink-0 text-neutral-400">
                          {timeSince(product.updatedAt)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Bottom: Needs Attention + Recent Activity ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Needs Attention */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Needs Attention
                  </h2>
                  {pendingCount > 0 && (
                    <span className="flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-bold leading-none text-yellow-900">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <Link
                  href="/admin/orders?status=pending"
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {pendingOrdersResult.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 px-5 py-12">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                      <svg
                        className="h-5 w-5 text-green-600 dark:text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </span>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      All caught up
                    </p>
                    <p className="text-xs text-neutral-400">
                      No pending orders right now
                    </p>
                  </div>
                ) : (
                  pendingOrdersResult.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {order.orderNumber} · {timeSince(order.createdAt)}
                        </p>
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          ₦{Number(order.totalAmount).toLocaleString()}
                        </p>
                        <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                          pending
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Recent Activity
                </h2>
                <Link
                  href="/admin/orders"
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {recentOrders.length === 0 ? (
                  <div className="px-5 py-12 text-center text-sm text-neutral-400">
                    No orders yet
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                    >
                      {/* Initials avatar */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                        {order.customerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {order.orderNumber} · {timeSince(order.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          ₦{Number(order.totalAmount).toLocaleString()}
                        </p>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
