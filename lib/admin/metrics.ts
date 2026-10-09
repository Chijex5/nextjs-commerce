/**
 * Server-side metrics for the admin home and analytics pages.
 *
 * One definition of a sale everywhere: orders only exist once Paystack has
 * confirmed payment (see lib/payments/paystack-reconcile.ts), so every order
 * row is paid money — except cancelled ones, which are excluded from sales and
 * reported separately. All bucketing is in shop time (Africa/Lagos).
 */
import { sql, type SQL } from "drizzle-orm";
import { db } from "lib/db";
import {
  buildBuckets,
  bucketSqlFormat,
  type Granularity,
  type ReportRange,
} from "./range";

const SHOP_TZ = "Africa/Lagos";

/** Shop-local wall-clock time for a stored UTC timestamp column. */
const local = (column: SQL) =>
  sql`((${column}) at time zone 'UTC') at time zone ${sql.raw(`'${SHOP_TZ}'`)}`;

const SALE = sql`o.status <> 'cancelled'`;

const num = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/** Parse a `timestamp::text` value (stored as UTC wall-clock) to a Date. */
const utcDate = (value: unknown) =>
  new Date(String(value).replace(" ", "T") + "Z");

/** Bind a Date as UTC wall-clock time, matching how timestamps are stored. */
const utc = (date: Date) => date.toISOString().replace("Z", "");

async function rows<T>(query: SQL): Promise<T[]> {
  return (await db.execute(query)) as unknown as T[];
}

function bucketExpr(granularity: Granularity) {
  const ts = local(sql`o.created_at`);
  const truncated =
    granularity === "hour"
      ? sql`date_trunc('hour', ${ts})`
      : granularity === "week"
        ? sql`date_trunc('week', ${ts})`
        : granularity === "month"
          ? sql`date_trunc('month', ${ts})`
          : sql`date_trunc('day', ${ts})`;
  return sql`to_char(${truncated}, ${bucketSqlFormat(granularity)})`;
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export type SalesTotals = {
  sales: number;
  orders: number;
  aov: number;
  units: number;
  discounts: number;
  shipping: number;
  customers: number;
  newCustomers: number;
  returningCustomers: number;
  cancelledOrders: number;
  cancelledValue: number;
};

async function salesTotals(start: Date, end: Date): Promise<SalesTotals> {
  const [summary] = await rows<Record<string, unknown>>(sql`
    select
      count(*) filter (where ${SALE}) as orders,
      coalesce(sum(o.total_amount) filter (where ${SALE}), 0) as sales,
      coalesce(sum(o.discount_amount) filter (where ${SALE}), 0) as discounts,
      coalesce(sum(o.shipping_amount) filter (where ${SALE}), 0) as shipping,
      count(*) filter (where o.status = 'cancelled') as cancelled_orders,
      coalesce(sum(o.total_amount) filter (where o.status = 'cancelled'), 0) as cancelled_value,
      count(distinct lower(o.email)) filter (where ${SALE}) as customers
    from orders o
    where o.created_at >= ${utc(start)} and o.created_at < ${utc(end)}
  `);

  const [units] = await rows<Record<string, unknown>>(sql`
    select coalesce(sum(oi.quantity), 0) as units
    from order_items oi
    join orders o on o.id = oi.order_id
    where o.created_at >= ${utc(start)} and o.created_at < ${utc(end)} and ${SALE}
  `);

  // A customer is "new" if their first ever paid order falls inside the window.
  const [mix] = await rows<Record<string, unknown>>(sql`
    with buyers as (
      select distinct lower(o.email) as email
      from orders o
      where o.created_at >= ${utc(start)} and o.created_at < ${utc(end)} and ${SALE}
    ),
    firsts as (
      select lower(o.email) as email, min(o.created_at) as first_order
      from orders o
      where ${SALE}
      group by lower(o.email)
    )
    select
      count(*) filter (where f.first_order >= ${utc(start)}) as new_customers,
      count(*) filter (where f.first_order < ${utc(start)}) as returning_customers
    from buyers b join firsts f using (email)
  `);

  const orders = num(summary?.orders);
  const sales = num(summary?.sales);
  return {
    sales,
    orders,
    aov: orders > 0 ? sales / orders : 0,
    units: num(units?.units),
    discounts: num(summary?.discounts),
    shipping: num(summary?.shipping),
    customers: num(summary?.customers),
    newCustomers: num(mix?.new_customers),
    returningCustomers: num(mix?.returning_customers),
    cancelledOrders: num(summary?.cancelled_orders),
    cancelledValue: num(summary?.cancelled_value),
  };
}

export type SeriesPoint = {
  key: string;
  label: string;
  title: string;
  sales: number;
  orders: number;
  previousSales: number;
  previousOrders: number;
  previousTitle: string;
};

async function bucketed(start: Date, end: Date, granularity: Granularity) {
  const bucket = bucketExpr(granularity);
  const result = await rows<{
    bucket: string;
    sales: unknown;
    orders: unknown;
  }>(sql`
    select ${bucket} as bucket,
      coalesce(sum(o.total_amount), 0) as sales,
      count(*) as orders
    from orders o
    where o.created_at >= ${utc(start)} and o.created_at < ${utc(end)} and ${SALE}
    group by 1
  `);
  return new Map(
    result.map((r) => [
      r.bucket,
      { sales: num(r.sales), orders: num(r.orders) },
    ]),
  );
}

export type SalesReport = {
  current: SalesTotals;
  previous: SalesTotals;
  series: SeriesPoint[];
};

export async function getSalesReport(range: ReportRange): Promise<SalesReport> {
  const [current, previous, currentBuckets, previousBuckets] =
    await Promise.all([
      salesTotals(range.start, range.end),
      salesTotals(range.previousStart, range.previousEnd),
      bucketed(range.start, range.end, range.granularity),
      // The previous window runs to the end of its period so the dashed line
      // shows the full shape of yesterday / last month, not just up to "now".
      bucketed(
        range.previousStart,
        new Date(
          range.previousStart.getTime() +
            (range.start.getTime() - range.previousStart.getTime()),
        ),
        range.granularity,
      ),
    ]);

  const buckets = buildBuckets(range.start, range.end, range.granularity);
  const previousBucketList = buildBuckets(
    range.previousStart,
    range.start,
    range.granularity,
  );

  const series = buckets.map((bucket, i) => {
    const prevBucket = previousBucketList[i];
    const cur = currentBuckets.get(bucket.key);
    const prev = prevBucket ? previousBuckets.get(prevBucket.key) : undefined;
    return {
      key: bucket.key,
      label: bucket.label,
      title: bucket.title,
      sales: cur?.sales ?? 0,
      orders: cur?.orders ?? 0,
      previousSales: prev?.sales ?? 0,
      previousOrders: prev?.orders ?? 0,
      previousTitle: prevBucket?.title ?? "",
    };
  });

  // For "today", hours that haven't happened yet shouldn't plot as zero.
  if (range.granularity === "hour") {
    const hourNow = new Date(
      range.end.getTime() + 60 * 60 * 1000,
    ).getUTCHours();
    return {
      current,
      previous,
      series: series.map((p, i) =>
        i > hourNow ? { ...p, sales: NaN, orders: NaN } : p,
      ),
    };
  }

  return { current, previous, series };
}

// ─── Breakdowns ───────────────────────────────────────────────────────────────

export type RankedRow = {
  id: string;
  label: string;
  value: number;
  secondary?: number;
  href?: string;
};

export async function getTopProducts(
  range: ReportRange,
  limit = 8,
): Promise<RankedRow[]> {
  const result = await rows<{
    product_id: string;
    title: string;
    revenue: unknown;
    units: unknown;
  }>(sql`
    select oi.product_id, max(oi.product_title) as title,
      coalesce(sum(oi.total_amount), 0) as revenue,
      coalesce(sum(oi.quantity), 0) as units
    from order_items oi
    join orders o on o.id = oi.order_id
    where o.created_at >= ${utc(range.start)} and o.created_at < ${utc(range.end)} and ${SALE}
    group by oi.product_id
    order by revenue desc
    limit ${limit}
  `);
  return result.map((r) => ({
    id: r.product_id,
    label: r.title,
    value: num(r.revenue),
    secondary: num(r.units),
    href: `/admin/products/${r.product_id}/edit`,
  }));
}

export async function getSalesByState(
  range: ReportRange,
  limit = 8,
): Promise<RankedRow[]> {
  const result = await rows<{
    state: string | null;
    revenue: unknown;
    orders: unknown;
  }>(sql`
    select nullif(trim(o.shipping_address->>'state'), '') as state,
      coalesce(sum(o.total_amount), 0) as revenue,
      count(*) as orders
    from orders o
    where o.created_at >= ${utc(range.start)} and o.created_at < ${utc(range.end)} and ${SALE}
    group by 1
    order by revenue desc
    limit ${limit}
  `);
  return result.map((r) => ({
    id: r.state ?? "unknown",
    label: r.state ?? "No address (custom orders)",
    value: num(r.revenue),
    secondary: num(r.orders),
  }));
}

export async function getChannelMix(range: ReportRange): Promise<RankedRow[]> {
  const result = await rows<{
    order_type: string;
    revenue: unknown;
    orders: unknown;
  }>(sql`
    select o.order_type, coalesce(sum(o.total_amount), 0) as revenue, count(*) as orders
    from orders o
    where o.created_at >= ${utc(range.start)} and o.created_at < ${utc(range.end)} and ${SALE}
    group by 1
    order by revenue desc
  `);
  return result.map((r) => ({
    id: r.order_type,
    label: r.order_type === "custom" ? "Custom" : "Shop",
    value: num(r.revenue),
    secondary: num(r.orders),
  }));
}

export async function getTopCoupons(
  range: ReportRange,
  limit = 5,
): Promise<RankedRow[]> {
  const result = await rows<{
    code: string;
    discount: unknown;
    orders: unknown;
  }>(sql`
    select upper(o.coupon_code) as code, coalesce(sum(o.discount_amount), 0) as discount, count(*) as orders
    from orders o
    where o.created_at >= ${utc(range.start)} and o.created_at < ${utc(range.end)} and ${SALE}
      and o.coupon_code is not null and o.coupon_code <> ''
    group by 1
    order by orders desc
    limit ${limit}
  `);
  return result.map((r) => ({
    id: r.code,
    label: r.code,
    value: num(r.orders),
    secondary: num(r.discount),
  }));
}

export type RecoveryStats = {
  abandoned: number;
  emailed: number;
  recovered: number;
  abandonedValue: number;
  recoveredValue: number;
};

export async function getCartRecovery(
  range: ReportRange,
): Promise<RecoveryStats> {
  const [r] = await rows<Record<string, unknown>>(sql`
    select count(*) as abandoned,
      count(*) filter (where email_sent) as emailed,
      count(*) filter (where recovered) as recovered,
      coalesce(sum(cart_total), 0) as abandoned_value,
      coalesce(sum(cart_total) filter (where recovered), 0) as recovered_value
    from abandoned_carts
    where created_at >= ${utc(range.start)} and created_at < ${utc(range.end)}
  `);
  return {
    abandoned: num(r?.abandoned),
    emailed: num(r?.emailed),
    recovered: num(r?.recovered),
    abandonedValue: num(r?.abandoned_value),
    recoveredValue: num(r?.recovered_value),
  };
}

export type PaymentStats = {
  attempts: number;
  paid: number;
  failed: number;
  conflicts: number;
  abandoned: number;
  successRate: number | null;
  failureReasons: RankedRow[];
};

export async function getPaymentStats(
  range: ReportRange,
): Promise<PaymentStats> {
  const [[r], reasons] = await Promise.all([
    rows<Record<string, unknown>>(sql`
      select count(*) as attempts,
        count(*) filter (where status = 'paid') as paid,
        count(*) filter (where status = 'failed') as failed,
        count(*) filter (where status = 'conflict') as conflicts,
        count(*) filter (where status in ('initialized', 'processing')) as abandoned
      from payment_transactions
      where created_at >= ${utc(range.start)} and created_at < ${utc(range.end)}
    `),
    rows<{ reason: string; count: unknown }>(sql`
      select coalesce(conflict_code, paystack_status, status, 'unknown') as reason, count(*) as count
      from payment_transactions
      where created_at >= ${utc(range.start)} and created_at < ${utc(range.end)}
        and status in ('failed', 'conflict')
      group by 1 order by 2 desc limit 4
    `),
  ]);
  const paid = num(r?.paid);
  const failed = num(r?.failed);
  const conflicts = num(r?.conflicts);
  const settled = paid + failed + conflicts;
  return {
    attempts: num(r?.attempts),
    paid,
    failed,
    conflicts,
    abandoned: num(r?.abandoned),
    successRate: settled > 0 ? (paid / settled) * 100 : null,
    failureReasons: reasons.map((x) => ({
      id: x.reason,
      label: x.reason.replace(/_/g, " "),
      value: num(x.count),
    })),
  };
}

// ─── Operations (not time-ranged: what needs doing right now) ────────────────

export const PIPELINE_STAGES = [
  { key: "production", label: "In production" },
  { key: "sorting", label: "Sorting & packing" },
  { key: "dispatch", label: "Out for delivery" },
  { key: "paused", label: "Paused" },
] as const;

export type OpenOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  createdAt: Date;
  deliveryStatus: string;
  estimatedArrival: Date | null;
  acknowledged: boolean;
  orderType: string;
};

export type Operations = {
  pipeline: Array<{ key: string; label: string; count: number }>;
  openOrders: number;
  unacknowledged: OpenOrder[];
  unacknowledgedCount: number;
  late: OpenOrder[];
  lateCount: number;
  requestsToQuote: number;
  quotesAwaitingPayment: number;
  reviewsToModerate: number;
  paymentConflicts: number;
  unavailableProducts: number;
  productsWithoutImages: number;
};

const OPEN = sql`o.status not in ('cancelled', 'completed') and o.delivery_status not in ('completed', 'cancelled')`;

function toOpenOrder(r: Record<string, unknown>): OpenOrder {
  return {
    id: String(r.id),
    orderNumber: String(r.order_number),
    customerName: String(r.customer_name),
    totalAmount: num(r.total_amount),
    createdAt: utcDate(r.created_at),
    deliveryStatus: String(r.delivery_status),
    estimatedArrival: r.estimated_arrival ? utcDate(r.estimated_arrival) : null,
    acknowledged: Boolean(r.acknowledged_at),
    orderType: String(r.order_type),
  };
}

const OPEN_ORDER_COLUMNS = sql`o.id, o.order_number, o.customer_name, o.total_amount,
  o.created_at::text as created_at, o.delivery_status, o.estimated_arrival::text as estimated_arrival,
  o.acknowledged_at, o.order_type`;

export async function getOperations(): Promise<Operations> {
  const [pipelineRows, unacknowledged, late, [counts]] = await Promise.all([
    rows<{ delivery_status: string; count: unknown }>(sql`
      select o.delivery_status, count(*) as count from orders o where ${OPEN} group by 1
    `),
    rows<Record<string, unknown>>(sql`
      select ${OPEN_ORDER_COLUMNS} from orders o
      where ${OPEN} and o.acknowledged_at is null
      order by o.created_at asc limit 6
    `),
    rows<Record<string, unknown>>(sql`
      select ${OPEN_ORDER_COLUMNS} from orders o
      where ${OPEN} and o.delivery_status <> 'paused'
        and o.estimated_arrival is not null and o.estimated_arrival < now() at time zone 'UTC'
      order by o.estimated_arrival asc limit 6
    `),
    rows<Record<string, unknown>>(sql`
      select
        (select count(*) from orders o where ${OPEN}) as open_orders,
        (select count(*) from orders o where ${OPEN} and o.acknowledged_at is null) as unacknowledged,
        (select count(*) from orders o where ${OPEN} and o.delivery_status <> 'paused'
           and o.estimated_arrival is not null and o.estimated_arrival < now() at time zone 'UTC') as late,
        (select count(*) from custom_order_requests where status in ('submitted', 'under_review')) as requests_to_quote,
        (select count(*) from custom_order_requests where status in ('quoted', 'awaiting_payment')) as quotes_awaiting,
        (select count(*) from reviews where status = 'pending') as reviews_pending,
        (select count(*) from payment_transactions where status = 'conflict') as conflicts,
        (select count(*) from products where available_for_sale = false) as unavailable,
        (select count(*) from products p where not exists
           (select 1 from product_images i where i.product_id = p.id)) as no_images
    `),
  ]);

  const byStage = new Map(
    pipelineRows.map((r) => [r.delivery_status, num(r.count)]),
  );

  return {
    pipeline: PIPELINE_STAGES.map((s) => ({
      ...s,
      count: byStage.get(s.key) ?? 0,
    })),
    openOrders: num(counts?.open_orders),
    unacknowledged: unacknowledged.map(toOpenOrder),
    unacknowledgedCount: num(counts?.unacknowledged),
    late: late.map(toOpenOrder),
    lateCount: num(counts?.late),
    requestsToQuote: num(counts?.requests_to_quote),
    quotesAwaitingPayment: num(counts?.quotes_awaiting),
    reviewsToModerate: num(counts?.reviews_pending),
    paymentConflicts: num(counts?.conflicts),
    unavailableProducts: num(counts?.unavailable),
    productsWithoutImages: num(counts?.no_images),
  };
}

export type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  deliveryStatus: string;
  orderType: string;
  createdAt: Date;
};

export async function getRecentOrders(limit = 8): Promise<RecentOrder[]> {
  const result = await rows<Record<string, unknown>>(sql`
    select o.id, o.order_number, o.customer_name, o.total_amount, o.status,
      o.delivery_status, o.order_type, o.created_at::text as created_at
    from orders o order by o.created_at desc limit ${limit}
  `);
  return result.map((r) => ({
    id: String(r.id),
    orderNumber: String(r.order_number),
    customerName: String(r.customer_name),
    totalAmount: num(r.total_amount),
    status: String(r.status),
    deliveryStatus: String(r.delivery_status),
    orderType: String(r.order_type),
    createdAt: utcDate(r.created_at),
  }));
}

// ─── Navigation badges ────────────────────────────────────────────────────────

export type NavBadges = Record<string, { count: number; urgent?: boolean }>;

/** One cheap round-trip for the sidebar counts shown on every admin page. */
export async function getNavBadges(): Promise<NavBadges> {
  const [r] = await rows<Record<string, unknown>>(sql`
    select
      (select count(*) from orders o where ${OPEN} and o.acknowledged_at is null) as to_confirm,
      (select count(*) from orders o where ${OPEN} and o.delivery_status <> 'paused'
         and o.estimated_arrival is not null and o.estimated_arrival < now() at time zone 'UTC') as late,
      (select count(*) from custom_order_requests where status in ('submitted', 'under_review')) as requests,
      (select count(*) from reviews where status = 'pending') as reviews,
      (select count(*) from payment_transactions where status = 'conflict') as conflicts
  `);
  const late = num(r?.late);
  return {
    "/admin/orders": { count: num(r?.to_confirm) + late, urgent: late > 0 },
    "/admin/custom-order-requests": { count: num(r?.requests) },
    "/admin/reviews": { count: num(r?.reviews) },
    "/admin/payments": { count: num(r?.conflicts), urgent: true },
  };
}
