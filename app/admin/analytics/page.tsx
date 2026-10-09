import { Sparkline } from "components/admin/charts/sparkline";
import { TrendChart } from "components/admin/charts/trend-chart";
import {
  BarList,
  Delta,
  EmptyState,
  Metric,
  MetricGrid,
  Page,
  PageHeader,
  Panel,
  SegmentedLinks,
  StatList,
  StatRow,
} from "components/admin/ui";
import {
  count,
  money,
  moneyCompact,
  pairs,
  percent,
  shortDate,
} from "lib/admin/format";
import {
  getCartRecovery,
  getChannelMix,
  getPaymentStats,
  getSalesByState,
  getSalesReport,
  getTopCoupons,
  getTopProducts,
} from "lib/admin/metrics";
import { RANGE_OPTIONS, percentChange, resolveRange } from "lib/admin/range";
import { authOptions } from "lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; timeframe?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  // `timeframe` is the old query param; keep old bookmarks working.
  const legacy: Record<string, string> = {
    "7d": "7d",
    "30d": "30d",
    "90d": "90d",
    "365d": "12m",
  };
  const range = resolveRange(params.range ?? legacy[params.timeframe ?? ""]);

  const [report, products, states, channels, coupons, recovery, payments] =
    await Promise.all([
      getSalesReport(range),
      getTopProducts(range),
      getSalesByState(range),
      getChannelMix(range),
      getTopCoupons(range),
      getCartRecovery(range),
      getPaymentStats(range),
    ]);

  const { current: c, previous: p, series } = report;
  const sparkSales = series.map((s) => s.sales);
  const sparkPrevSales = series.map((s) => s.previousSales);
  const returningRate =
    c.customers > 0 ? (c.returningCustomers / c.customers) * 100 : null;
  const prevReturningRate =
    p.customers > 0 ? (p.returningCustomers / p.customers) * 100 : null;
  const recoveryRate =
    recovery.abandoned > 0
      ? (recovery.recovered / recovery.abandoned) * 100
      : null;
  const periodLabel =
    range.key === "today"
      ? shortDate(range.start)
      : `${shortDate(range.start)} – ${shortDate(range.end)}`;

  return (
    <Page>
      <PageHeader
        eyebrow="Reports"
        title="Analytics"
        description="Sales are paid orders, excluding cancellations. All dates are Lagos time."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SegmentedLinks
            label="Date range"
            options={RANGE_OPTIONS.map((o) => ({ key: o.key, label: o.short }))}
            active={range.key}
            hrefFor={(key) => `/admin/analytics?range=${key}`}
          />
          <p className="text-xs text-fg-3">
            <span className="text-fg">{periodLabel}</span> · compared{" "}
            {range.comparisonLabel.replace(/^vs /, "with ")}
          </p>
        </div>
      </PageHeader>

      {/* ── Headline metrics ─────────────────────────────────────────── */}
      <MetricGrid className="mb-6 grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Total sales"
          value={moneyCompact(c.sales)}
          change={percentChange(c.sales, p.sales)}
          hint={money(c.sales)}
        >
          <Sparkline
            label="Sales trend"
            values={sparkSales}
            previous={sparkPrevSales}
          />
        </Metric>
        <Metric
          label="Orders"
          value={count(c.orders)}
          change={percentChange(c.orders, p.orders)}
          hint={pairs(c.units)}
        >
          <Sparkline
            label="Orders trend"
            values={series.map((s) => s.orders)}
            previous={series.map((s) => s.previousOrders)}
          />
        </Metric>
        <Metric
          label="Avg. order value"
          value={moneyCompact(c.aov)}
          change={percentChange(c.aov, p.aov)}
          hint={`was ${moneyCompact(p.aov)}`}
        />
        <Metric
          label="Returning customers"
          value={percent(returningRate)}
          change={
            returningRate !== null && prevReturningRate !== null
              ? percentChange(returningRate, prevReturningRate)
              : null
          }
          hint={`${count(c.returningCustomers)} of ${count(c.customers)} customers`}
        />
      </MetricGrid>

      {/* ── Over time ───────────────────────────────────────────────── */}
      <Panel
        title="Sales over time"
        description={`By ${range.granularity}. Hover a point to compare with the same ${range.granularity} in the previous period.`}
        className="mb-6"
      >
        <TrendChart
          series={series}
          comparisonLabel={range.comparisonLabel}
          cumulative={range.key === "today"}
        />
      </Panel>

      {/* ── What sold, and where ─────────────────────────────────────── */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Top products"
          description="By sales. Pairs sold on the left."
          action={{ href: "/admin/products", label: "Products" }}
        >
          <BarList items={products} format={moneyCompact} secondary={pairs} />
        </Panel>
        <Panel title="Sales by state" description="Where orders were shipped.">
          <BarList
            items={states}
            format={moneyCompact}
            secondary={(n) => `${count(n)} orders`}
          />
        </Panel>
      </div>

      {/* ── Customers, channels, discounts ───────────────────────────── */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Panel
          title="Customers"
          description="New = first ever order in this period."
        >
          {c.customers === 0 ? (
            <EmptyState title="No customers in this period" />
          ) : (
            <>
              <div
                className="mb-5 flex h-2.5 overflow-hidden bg-plate"
                aria-hidden
              >
                <span
                  className="h-full bg-fg"
                  style={{ width: `${(c.newCustomers / c.customers) * 100}%` }}
                />
                <span
                  className="h-full bg-fg/35"
                  style={{
                    width: `${(c.returningCustomers / c.customers) * 100}%`,
                  }}
                />
              </div>
              <StatList>
                <StatRow
                  label={<Legend swatch="bg-fg">New</Legend>}
                  value={count(c.newCustomers)}
                />
                <StatRow
                  label={<Legend swatch="bg-fg/35">Returning</Legend>}
                  value={count(c.returningCustomers)}
                />
                <StatRow
                  label="Total customers"
                  value={
                    <span className="flex items-center gap-2">
                      {count(c.customers)}{" "}
                      <Delta value={percentChange(c.customers, p.customers)} />
                    </span>
                  }
                />
              </StatList>
            </>
          )}
        </Panel>

        <Panel
          title="Channels"
          description="Ready-made shop orders vs bespoke custom orders."
        >
          <BarList
            items={channels}
            format={moneyCompact}
            secondary={(n) => `${count(n)} orders`}
          />
        </Panel>

        <Panel
          title="Discounts"
          description="Coupon codes used on paid orders."
          action={{ href: "/admin/coupons", label: "Coupons" }}
        >
          <StatList>
            <StatRow label="Total discounted" value={money(c.discounts)} />
            <StatRow
              label="Share of sales"
              value={percent(
                c.sales + c.discounts > 0
                  ? (c.discounts / (c.sales + c.discounts)) * 100
                  : null,
                1,
              )}
            />
          </StatList>
          <div className="mt-4">
            <BarList
              items={coupons}
              format={(n) => `${count(n)} uses`}
              empty="No coupons used in this period."
            />
          </div>
        </Panel>
      </div>

      {/* ── Funnel health ────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Panel
          title="Abandoned carts"
          description="Carts left at checkout, and how many came back."
        >
          <Funnel
            steps={[
              { label: "Abandoned", value: recovery.abandoned },
              { label: "Reminder emailed", value: recovery.emailed },
              { label: "Recovered", value: recovery.recovered },
            ]}
          />
          <StatList>
            <StatRow label="Recovery rate" value={percent(recoveryRate)} />
            <StatRow
              label="Value recovered"
              value={money(recovery.recoveredValue)}
            />
            <StatRow
              label="Value still in carts"
              value={money(recovery.abandonedValue - recovery.recoveredValue)}
            />
          </StatList>
        </Panel>

        <Panel
          title="Payments"
          description="Paystack checkouts started in this period."
          action={{ href: "/admin/payments", label: "Ledger" }}
        >
          <StatList>
            <StatRow
              label="Success rate"
              value={percent(payments.successRate)}
              tone={
                payments.successRate === null
                  ? undefined
                  : payments.successRate >= 90
                    ? "positive"
                    : payments.successRate >= 75
                      ? "warning"
                      : "critical"
              }
            />
            <StatRow label="Paid" value={count(payments.paid)} />
            <StatRow
              label="Failed"
              value={count(payments.failed)}
              tone={payments.failed ? "critical" : undefined}
            />
            <StatRow
              label="Conflicts"
              value={count(payments.conflicts)}
              tone={payments.conflicts ? "critical" : undefined}
              href={
                payments.conflicts
                  ? "/admin/payments?status=conflict"
                  : undefined
              }
            />
            <StatRow
              label="Started, never finished"
              value={count(payments.abandoned)}
            />
          </StatList>
          {payments.failureReasons.length ? (
            <div className="mt-4">
              <p className="label mb-2 text-fg-3">Why payments failed</p>
              <BarList items={payments.failureReasons} format={count} />
            </div>
          ) : null}
        </Panel>

        <Panel title="Sales breakdown" description="What makes up the total.">
          <StatList>
            <StatRow label="Orders" value={count(c.orders)} />
            <StatRow label="Discounts given" value={`−${money(c.discounts)}`} />
            <StatRow label="Shipping collected" value={money(c.shipping)} />
            <StatRow label="Total sales" value={money(c.sales)} />
            <StatRow
              label={`Cancelled (${count(c.cancelledOrders)})`}
              value={money(c.cancelledValue)}
              tone={c.cancelledOrders ? "warning" : undefined}
            />
          </StatList>
          <p className="mt-3 text-xs text-fg-3">
            Cancelled orders are excluded from total sales.
          </p>
        </Panel>
      </div>
    </Page>
  );
}

function Legend({
  swatch,
  children,
}: {
  swatch: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-2">
      <span className={`size-2.5 ${swatch}`} aria-hidden />
      {children}
    </span>
  );
}

function Funnel({ steps }: { steps: Array<{ label: string; value: number }> }) {
  const top = Math.max(steps[0]?.value ?? 0, 1);
  return (
    <ol className="mb-5 space-y-2">
      {steps.map((s) => (
        <li key={s.label}>
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span className="text-fg-2">{s.label}</span>
            <span className="tabular-nums text-fg">{count(s.value)}</span>
          </div>
          <div className="h-2 bg-plate">
            <div
              className="h-full bg-fg"
              style={{ width: `${(s.value / top) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
