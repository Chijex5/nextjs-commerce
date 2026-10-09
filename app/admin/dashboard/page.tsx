import { getGreeting } from "@/lib/greetings";
import { Sparkline } from "components/admin/charts/sparkline";
import { TrendChart } from "components/admin/charts/trend-chart";
import {
  Delta,
  DeliveryStatus,
  EmptyState,
  Metric,
  MetricGrid,
  OrderStatus,
  Page,
  PageHeader,
  Panel,
} from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import {
  daysSince,
  longDate,
  money,
  moneyCompact,
  count,
  shopHour,
  timeAgo,
} from "lib/admin/format";
import {
  getOperations,
  getRecentOrders,
  getSalesReport,
  type OpenOrder,
  type Operations,
} from "lib/admin/metrics";
import { percentChange, resolveRange } from "lib/admin/range";
import { authOptions } from "lib/auth";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const now = new Date();
  const today = resolveRange("today", now);
  const week = resolveRange("7d", now);

  const [todayReport, weekReport, ops, recent] = await Promise.all([
    getSalesReport(today),
    getSalesReport(week),
    getOperations(),
    getRecentOrders(8),
  ]);

  // getGreeting reads local hours; hand it a date set to the shop's hour.
  const greetingClock = new Date(now);
  greetingClock.setHours(shopHour(now));
  const greeting = getGreeting({
    dateTime: greetingClock,
    name: session.user?.name,
  });

  const w = weekReport;
  const tasks = buildTasks(ops);

  return (
    <Page>
      <PageHeader
        eyebrow={longDate(now)}
        title={greeting}
        actions={
          <>
            <Link
              href="/admin/products/new"
              className={buttonClass("outline", "md")}
            >
              <Plus className="size-4" /> Add product
            </Link>
            <Link href="/admin/orders" className={buttonClass("solid", "md")}>
              Orders
            </Link>
          </>
        }
      />

      {/* ── To do: what needs a human right now ───────────────────────── */}
      <section aria-labelledby="todo-heading" className="mb-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="todo-heading" className="label text-fg-3">
            To do
          </h2>
          {tasks.length ? (
            <span className="label text-fg-3">{tasks.length} open</span>
          ) : null}
        </div>
        {tasks.length === 0 ? (
          <div className="flex items-center gap-3 border border-line px-5 py-4 text-sm text-fg-2">
            <Check className="size-4" /> All clear. No orders, requests or
            reviews are waiting on you.
          </div>
        ) : (
          <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
            {tasks.map((task) => (
              <li key={task.href + task.label} className="bg-canvas">
                <Link
                  href={task.href}
                  className="group flex h-full items-start justify-between gap-4 p-5 transition-colors hover:bg-plate/60"
                >
                  <div>
                    <p className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${task.urgent ? "bg-red-600" : "bg-amber-500"}`}
                        aria-hidden
                      />
                      <span className="font-head text-3xl font-extrabold leading-none tabular-nums [font-stretch:75%]">
                        {task.count}
                      </span>
                    </p>
                    <p className="mt-2 text-sm font-medium text-fg">
                      {task.label}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-3">{task.detail}</p>
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 text-fg-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Today vs yesterday + fulfilment pipeline ──────────────────── */}
      <div className="mb-10 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Today"
          description="Running total since midnight, against yesterday at the same time."
          action={{ href: "/admin/analytics?range=today", label: "Details" }}
        >
          <div className="mb-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
            <TodayStat
              label="Sales"
              value={money(todayReport.current.sales)}
              change={percentChange(
                todayReport.current.sales,
                todayReport.previous.sales,
              )}
            />
            <TodayStat
              label="Orders"
              value={count(todayReport.current.orders)}
              change={percentChange(
                todayReport.current.orders,
                todayReport.previous.orders,
              )}
            />
            <TodayStat
              label="Customers"
              value={count(todayReport.current.customers)}
              change={percentChange(
                todayReport.current.customers,
                todayReport.previous.customers,
              )}
            />
          </div>
          <TrendChart
            series={todayReport.series}
            comparisonLabel={today.comparisonLabel}
            cumulative
            height={220}
          />
        </Panel>

        <Pipeline ops={ops} />
      </div>

      {/* ── Last 7 days ───────────────────────────────────────────────── */}
      <section aria-labelledby="week-heading" className="mb-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="week-heading" className="label text-fg-3">
            Last 7 days{" "}
            <span className="normal-case tracking-normal">
              · {week.comparisonLabel}
            </span>
          </h2>
          <Link
            href="/admin/analytics?range=7d"
            className="label text-fg-3 hover:text-fg"
          >
            Analytics →
          </Link>
        </div>
        <MetricGrid className="grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Sales"
            value={moneyCompact(w.current.sales)}
            change={percentChange(w.current.sales, w.previous.sales)}
            href="/admin/analytics?range=7d"
          >
            <Sparkline
              label="Daily sales"
              values={w.series.map((p) => p.sales)}
              previous={w.series.map((p) => p.previousSales)}
            />
          </Metric>
          <Metric
            label="Orders"
            value={count(w.current.orders)}
            change={percentChange(w.current.orders, w.previous.orders)}
            href="/admin/analytics?range=7d"
          >
            <Sparkline
              label="Daily orders"
              values={w.series.map((p) => p.orders)}
              previous={w.series.map((p) => p.previousOrders)}
            />
          </Metric>
          <Metric
            label="Avg. order value"
            value={moneyCompact(w.current.aov)}
            change={percentChange(w.current.aov, w.previous.aov)}
            hint={`${count(w.current.units)} pairs sold`}
          />
          <Metric
            label="Customers"
            value={count(w.current.customers)}
            change={percentChange(w.current.customers, w.previous.customers)}
            hint={`${count(w.current.newCustomers)} new · ${count(w.current.returningCustomers)} returning`}
          />
        </MetricGrid>
      </section>

      {/* ── Order queues ─────────────────────────────────────────────── */}
      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <Panel
          title="New orders to confirm"
          description="Paid, but nobody has acknowledged them yet. Oldest first."
          action={{ href: "/admin/orders?view=confirm", label: "All orders" }}
          bodyClassName="p-0"
        >
          <OrderQueue
            orders={ops.unacknowledged}
            empty="Every paid order has been acknowledged."
            meta={(o) => `Paid ${timeAgo(o.createdAt, now)}`}
          />
        </Panel>
        <Panel
          title="Running late"
          description="Past their estimated arrival and not yet delivered."
          action={{ href: "/admin/orders?view=late", label: "All orders" }}
          bodyClassName="p-0"
        >
          <OrderQueue
            orders={ops.late}
            empty="Nothing is past its delivery estimate."
            meta={(o) =>
              o.estimatedArrival
                ? `${Math.max(1, daysSince(o.estimatedArrival, now))}d overdue`
                : "No estimate"
            }
            urgent
          />
        </Panel>
      </div>

      {/* ── Recent orders ────────────────────────────────────────────── */}
      <Panel
        title="Recent orders"
        action={{ href: "/admin/orders", label: "View all" }}
        bodyClassName="p-0"
      >
        {recent.length === 0 ? (
          <div className="px-5">
            <EmptyState title="No orders yet">
              Orders appear here as soon as Paystack confirms payment.
            </EmptyState>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-line md:hidden">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">
                        {o.customerName}
                      </p>
                      <p className="mt-0.5 text-xs text-fg-3">
                        <span className="font-mono">{o.orderNumber}</span> ·{" "}
                        {timeAgo(o.createdAt, now)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-medium tabular-nums">
                        {money(o.totalAmount)}
                      </span>
                      {o.status === "cancelled" ? (
                        <OrderStatus status="cancelled" />
                      ) : (
                        <DeliveryStatus status={o.deliveryStatus} />
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-fg-3">
                    <th className="px-5 py-2.5 font-normal">Order</th>
                    <th className="px-3 py-2.5 font-normal">Customer</th>
                    <th className="px-3 py-2.5 font-normal">Status</th>
                    <th className="px-3 py-2.5 font-normal">Delivery</th>
                    <th className="px-5 py-2.5 text-right font-normal">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recent.map((o) => (
                    <tr
                      key={o.id}
                      className="group relative transition-colors hover:bg-plate/60"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-mono text-xs text-fg after:absolute after:inset-0"
                        >
                          {o.orderNumber}
                        </Link>
                        <p className="mt-0.5 text-xs text-fg-3">
                          {timeAgo(o.createdAt, now)}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="max-w-[22ch] truncate text-fg">
                          {o.customerName}
                        </p>
                        {o.orderType === "custom" ? (
                          <p className="text-xs text-fg-3">Custom order</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <OrderStatus status={o.status} />
                      </td>
                      <td className="px-3 py-3">
                        <DeliveryStatus status={o.deliveryStatus} />
                      </td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums">
                        {money(o.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>
    </Page>
  );
}

type Task = {
  count: number;
  label: string;
  detail: string;
  href: string;
  urgent?: boolean;
};

function buildTasks(ops: Operations): Task[] {
  const tasks: Task[] = [
    {
      count: ops.paymentConflicts,
      label:
        ops.paymentConflicts === 1 ? "Payment conflict" : "Payment conflicts",
      detail:
        "Money received that didn't match an order. Resolve in the ledger.",
      href: "/admin/payments?status=conflict",
      urgent: true,
    },
    {
      count: ops.lateCount,
      label: ops.lateCount === 1 ? "Order running late" : "Orders running late",
      detail: "Past the delivery date we promised the customer.",
      href: "/admin/orders?view=late",
      urgent: true,
    },
    {
      count: ops.unacknowledgedCount,
      label:
        ops.unacknowledgedCount === 1
          ? "New order to confirm"
          : "New orders to confirm",
      detail: "Paid and waiting for you to start production.",
      href: "/admin/orders?view=confirm",
    },
    {
      count: ops.requestsToQuote,
      label:
        ops.requestsToQuote === 1
          ? "Custom request to quote"
          : "Custom requests to quote",
      detail: "Customers are waiting for a price.",
      href: "/admin/custom-order-requests",
    },
    {
      count: ops.reviewsToModerate,
      label:
        ops.reviewsToModerate === 1
          ? "Review to moderate"
          : "Reviews to moderate",
      detail: "Approve or hide before they show on product pages.",
      href: "/admin/reviews",
    },
    {
      count: ops.unavailableProducts,
      label:
        ops.unavailableProducts === 1
          ? "Product hidden from shop"
          : "Products hidden from shop",
      detail: "Marked unavailable, so customers can't buy them.",
      href: "/admin/products",
    },
    {
      count: ops.productsWithoutImages,
      label:
        ops.productsWithoutImages === 1
          ? "Product without photos"
          : "Products without photos",
      detail: "Listings without images rarely sell.",
      href: "/admin/products",
    },
  ];
  return tasks.filter((t) => t.count > 0);
}

function TodayStat({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: number | null;
}) {
  return (
    <div className="min-w-0">
      <p className="label text-fg-3">{label}</p>
      <p className="mt-2 truncate font-head text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-none tabular-nums [font-stretch:75%]">
        {value}
      </p>
      <Delta value={change} suffix="vs yesterday" className="mt-2" />
    </div>
  );
}

function Pipeline({ ops }: { ops: Operations }) {
  const total = ops.pipeline.reduce((s, p) => s + p.count, 0);
  return (
    <Panel
      title="In the workshop"
      description={`${count(ops.openOrders)} open ${ops.openOrders === 1 ? "order" : "orders"} by delivery stage.`}
      action={{ href: "/admin/orders", label: "Orders" }}
    >
      {total === 0 ? (
        <EmptyState title="Nothing in progress">
          New paid orders start here in production.
        </EmptyState>
      ) : (
        <>
          <div
            className="mb-6 flex h-2.5 w-full overflow-hidden bg-plate"
            aria-hidden
          >
            {ops.pipeline.map((stage, i) =>
              stage.count > 0 ? (
                <span
                  key={stage.key}
                  className="h-full border-r-2 border-canvas last:border-r-0"
                  style={{
                    width: `${(stage.count / total) * 100}%`,
                    background:
                      stage.key === "paused"
                        ? "rgb(245 158 11)"
                        : `rgba(var(--brand-fg-rgb), ${1 - i * 0.25})`,
                  }}
                />
              ) : null,
            )}
          </div>
          <ol className="space-y-px">
            {ops.pipeline.map((stage, i) => (
              <li
                key={stage.key}
                className="flex items-center justify-between gap-4 py-2"
              >
                <span className="flex items-center gap-3 text-sm text-fg-2">
                  <span className="font-mono text-[10px] text-fg-3">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {stage.label}
                </span>
                <span className="font-head text-2xl font-extrabold leading-none tabular-nums [font-stretch:75%]">
                  {stage.count}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </Panel>
  );
}

function OrderQueue({
  orders,
  empty,
  meta,
  urgent,
}: {
  orders: OpenOrder[];
  empty: string;
  meta: (o: OpenOrder) => string;
  urgent?: boolean;
}) {
  if (orders.length === 0) {
    return (
      <div className="flex items-center gap-2 px-5 py-6 text-sm text-fg-3">
        <Check className="size-4" /> {empty}
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {orders.map((o) => (
        <li key={o.id}>
          <Link
            href={`/admin/orders/${o.id}`}
            className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-plate/60"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">
                {o.customerName}
              </p>
              <p className="mt-0.5 text-xs text-fg-3">
                <span className="font-mono">{o.orderNumber}</span> ·{" "}
                <span
                  className={
                    urgent ? "text-red-700 dark:text-red-400" : undefined
                  }
                >
                  {meta(o)}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm font-medium tabular-nums">
                {money(o.totalAmount)}
              </span>
              <DeliveryStatus status={o.deliveryStatus} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
