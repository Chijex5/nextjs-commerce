import { OrdersList, type OrderRow } from "components/admin/orders/orders-list";
import {
  FilterBar,
  Page,
  PageHeader,
  Pagination,
  Select,
  ViewTabs,
  type Tone,
} from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  ne,
  notInArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { orderItems, orders, paymentTransactions } from "lib/db/schema";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

/** Not finished: still needs work from the workshop or the courier. */
const open = and(
  notInArray(orders.status, ["cancelled", "completed"]),
  notInArray(orders.deliveryStatus, ["completed", "cancelled"]),
)!;

const nowUtc = sql`(now() at time zone 'UTC')`;

const VIEWS: Array<{ key: string; label: string; where?: SQL; tone?: Tone }> = [
  { key: "all", label: "All" },
  {
    key: "confirm",
    label: "To confirm",
    where: and(open, isNull(orders.acknowledgedAt)),
    tone: "warning",
  },
  {
    key: "late",
    label: "Late",
    where: and(
      open,
      ne(orders.deliveryStatus, "paused"),
      isNotNull(orders.estimatedArrival),
      lt(orders.estimatedArrival, nowUtc),
    ),
    tone: "critical",
  },
  {
    key: "production",
    label: "In production",
    where: and(open, eq(orders.deliveryStatus, "production")),
  },
  {
    key: "sorting",
    label: "Packing",
    where: and(open, eq(orders.deliveryStatus, "sorting")),
  },
  {
    key: "dispatch",
    label: "Out for delivery",
    where: and(open, eq(orders.deliveryStatus, "dispatch")),
  },
  {
    key: "paused",
    label: "Paused",
    where: and(open, eq(orders.deliveryStatus, "paused")),
    tone: "warning",
  },
  {
    key: "delivered",
    label: "Delivered",
    where: eq(orders.deliveryStatus, "completed"),
  },
  {
    key: "cancelled",
    label: "Cancelled",
    where: eq(orders.status, "cancelled"),
  },
];

const SORTS = {
  newest: desc(orders.createdAt),
  oldest: asc(orders.createdAt),
  "total-desc": desc(orders.totalAmount),
  "total-asc": asc(orders.totalAmount),
} as const;

type Params = {
  view?: string;
  q?: string;
  type?: string;
  sort?: string;
  page?: string;
  // Old query params, still honoured so existing links keep working.
  search?: string;
  status?: string;
  deliveryStatus?: string;
  orderType?: string;
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const legacyView =
    params.status === "cancelled"
      ? "cancelled"
      : params.deliveryStatus === "completed"
        ? "delivered"
        : params.deliveryStatus && params.deliveryStatus !== "all"
          ? params.deliveryStatus
          : undefined;
  const view =
    VIEWS.find((v) => v.key === (params.view ?? legacyView)) ?? VIEWS[0]!;
  const q = (params.q ?? params.search ?? "").trim();
  const type =
    params.type ??
    (params.orderType !== "all" ? params.orderType : undefined) ??
    "all";
  const sort = (
    params.sort && params.sort in SORTS ? params.sort : "newest"
  ) as keyof typeof SORTS;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  // Search and type narrow every view (and the counts on the tabs).
  const narrowing: SQL[] = [];
  if (q) {
    const like = `%${q}%`;
    narrowing.push(
      or(
        ilike(orders.orderNumber, like),
        ilike(orders.customerName, like),
        ilike(orders.email, like),
        ilike(orders.phone, like),
      )!,
    );
  }
  if (type === "catalog" || type === "custom")
    narrowing.push(eq(orders.orderType, type));

  const where = and(...narrowing, ...(view.where ? [view.where] : []));

  const [rows, [totalRow], countRow, [conflicts]] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        email: orders.email,
        status: orders.status,
        deliveryStatus: orders.deliveryStatus,
        orderType: orders.orderType,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        estimatedArrival: orders.estimatedArrival,
        acknowledgedAt: orders.acknowledgedAt,
        state: sql<string | null>`${orders.shippingAddress}->>'state'`,
      })
      .from(orders)
      .where(where)
      .orderBy(SORTS[sort], desc(orders.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(where),
    db
      .select(
        Object.fromEntries(
          VIEWS.map((v) => [
            v.key,
            sql<number>`count(*) filter (where ${v.where ?? sql`true`})`,
          ]),
        ),
      )
      .from(orders)
      .where(narrowing.length ? and(...narrowing) : undefined),
    db
      .select({ count: sql<number>`count(*)` })
      .from(paymentTransactions)
      .where(eq(paymentTransactions.status, "conflict")),
  ]);

  const ids = rows.map((r) => r.id);
  const itemRows = ids.length
    ? await db
        .select({
          orderId: orderItems.orderId,
          units: sql<number>`sum(${orderItems.quantity})`,
          first: sql<string>`min(${orderItems.productTitle})`,
          lines: sql<number>`count(*)`,
        })
        .from(orderItems)
        .where(inArray(orderItems.orderId, ids))
        .groupBy(orderItems.orderId)
    : [];
  const items = new Map(itemRows.map((r) => [r.orderId, r]));

  const counts = (countRow[0] ?? {}) as Record<string, unknown>;
  const total = Number(totalRow?.count ?? 0);
  const conflictCount = Number(conflicts?.count ?? 0);

  const data: OrderRow[] = rows.map((r) => {
    const it = items.get(r.id);
    return {
      id: r.id,
      orderNumber: r.orderNumber,
      customerName: r.customerName,
      email: r.email,
      status: r.status,
      deliveryStatus: r.deliveryStatus,
      orderType: r.orderType,
      total: Number(r.totalAmount),
      createdAt: r.createdAt.toISOString(),
      estimatedArrival: r.estimatedArrival?.toISOString() ?? null,
      acknowledged: Boolean(r.acknowledgedAt),
      state: r.state,
      units: Number(it?.units ?? 0),
      summary: it
        ? Number(it.lines) > 1
          ? `${it.first} + ${Number(it.lines) - 1} more`
          : it.first
        : "",
    };
  });

  const href = (
    overrides: Partial<Record<"view" | "q" | "type" | "sort" | "page", string>>,
  ) => {
    const next = new URLSearchParams();
    const merged = { view: view.key, q, type, sort, ...overrides };
    if (merged.view && merged.view !== "all") next.set("view", merged.view);
    if (merged.q) next.set("q", merged.q);
    if (merged.type && merged.type !== "all") next.set("type", merged.type);
    if (merged.sort && merged.sort !== "newest") next.set("sort", merged.sort);
    if (overrides.page && overrides.page !== "1")
      next.set("page", overrides.page);
    const s = next.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description="Every order here has been paid through Paystack. Confirm new ones, then move them through the workshop."
        actions={
          conflictCount > 0 ? (
            <Link
              href="/admin/payments?status=conflict"
              className={buttonClass("outline", "md")}
            >
              <span className="size-1.5 rounded-full bg-red-600" aria-hidden />
              {conflictCount} payment{" "}
              {conflictCount === 1 ? "conflict" : "conflicts"}
            </Link>
          ) : null
        }
      />

      <ViewTabs
        label="Order views"
        active={view.key}
        hrefFor={(key) => href({ view: key, page: "1" })}
        views={VIEWS.map((v) => ({
          key: v.key,
          label: v.label,
          count: Number(counts[v.key] ?? 0),
          tone: v.tone,
        }))}
      />

      <FilterBar
        action="/admin/orders"
        search={q}
        placeholder="Search order number, name, email or phone"
        hidden={{ view: view.key === "all" ? undefined : view.key }}
      >
        <Select
          name="type"
          label="Order type"
          defaultValue={type}
          options={[
            { value: "all", label: "All types" },
            { value: "catalog", label: "Shop orders" },
            { value: "custom", label: "Custom orders" },
          ]}
        />
        <Select
          name="sort"
          label="Sort"
          defaultValue={sort}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "total-desc", label: "Highest total" },
            { value: "total-asc", label: "Lowest total" },
          ]}
        />
      </FilterBar>

      <OrdersList
        orders={data}
        emptyHint={
          q || type !== "all"
            ? "Try a different search or clear the filters."
            : emptyHintFor(view.key)
        }
      />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        hrefFor={(p) => href({ page: String(p) })}
      />
    </Page>
  );
}

function emptyHintFor(view: string) {
  switch (view) {
    case "confirm":
      return "Every paid order has been confirmed.";
    case "late":
      return "Nothing is past its delivery estimate.";
    case "paused":
      return "No orders are on hold.";
    default:
      return "Orders appear here as soon as Paystack confirms payment.";
  }
}
