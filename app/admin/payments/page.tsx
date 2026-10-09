import {
  EmptyState,
  FilterBar,
  Metric,
  MetricGrid,
  Page,
  PageHeader,
  Pagination,
  Select,
  PAYMENT_STATUS,
  StatusPill,
  ViewTabs,
  type Tone,
} from "components/admin/ui";
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { count, money, percent, timeAgo } from "lib/admin/format";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { orders, paymentTransactions } from "lib/db/schema";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

const SOURCE_LABEL: Record<string, string> = {
  catalog_checkout: "Shop checkout",
  custom_quote: "Custom quote",
};

const VIEWS: Array<{ key: string; label: string; where?: SQL; tone?: Tone }> = [
  { key: "all", label: "All" },
  {
    key: "conflict",
    label: "Needs review",
    where: eq(paymentTransactions.status, "conflict"),
    tone: "critical",
  },
  { key: "paid", label: "Paid", where: eq(paymentTransactions.status, "paid") },
  {
    key: "failed",
    label: "Failed",
    where: eq(paymentTransactions.status, "failed"),
  },
  {
    key: "unfinished",
    label: "Unfinished",
    where: inArray(paymentTransactions.status, ["initialized", "processing"]),
  },
  {
    key: "duplicate",
    label: "Duplicates",
    where: eq(paymentTransactions.status, "duplicate"),
  },
];

type Params = {
  view?: string;
  status?: string;
  q?: string;
  search?: string;
  source?: string;
  page?: string;
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  // `status` is the old param (dashboard and order pages link with ?status=conflict).
  const legacy =
    params.status === "initialized" || params.status === "processing"
      ? "unfinished"
      : params.status;
  const view =
    VIEWS.find((v) => v.key === (params.view ?? legacy)) ?? VIEWS[0]!;
  const q = (params.q ?? params.search ?? "").trim();
  const source = params.source ?? "all";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const narrowing: SQL[] = [];
  if (q) {
    const like = `%${q}%`;
    narrowing.push(
      or(
        ilike(paymentTransactions.reference, like),
        ilike(paymentTransactions.conflictCode, like),
        ilike(orders.orderNumber, like),
        ilike(orders.email, like),
        sql`${paymentTransactions.customer}->>'email' ilike ${like}`,
      )!,
    );
  }
  if (source !== "all") narrowing.push(eq(paymentTransactions.source, source));
  const where = and(...narrowing, ...(view.where ? [view.where] : []));

  const since = new Date(Date.now() - 30 * 86_400_000);
  const [rows, [totalRow], [countRow], [summary]] = await Promise.all([
    db
      .select({
        id: paymentTransactions.id,
        reference: paymentTransactions.reference,
        source: paymentTransactions.source,
        status: paymentTransactions.status,
        amount: paymentTransactions.amount,
        paystackStatus: paymentTransactions.paystackStatus,
        conflictCode: paymentTransactions.conflictCode,
        conflictMessage: paymentTransactions.conflictMessage,
        orderId: paymentTransactions.orderId,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        email: sql<
          string | null
        >`coalesce(${orders.email}, ${paymentTransactions.customer}->>'email')`,
        createdAt: paymentTransactions.createdAt,
      })
      .from(paymentTransactions)
      .leftJoin(orders, eq(paymentTransactions.orderId, orders.id))
      .where(where)
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)` })
      .from(paymentTransactions)
      .leftJoin(orders, eq(paymentTransactions.orderId, orders.id))
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
      .from(paymentTransactions)
      .leftJoin(orders, eq(paymentTransactions.orderId, orders.id))
      .where(narrowing.length ? and(...narrowing) : undefined),
    db
      .select({
        collected: sql<string>`coalesce(sum(${paymentTransactions.amount}) filter (where ${paymentTransactions.status} = 'paid'), 0)`,
        paid: sql<number>`count(*) filter (where ${paymentTransactions.status} = 'paid')`,
        failed: sql<number>`count(*) filter (where ${paymentTransactions.status} = 'failed')`,
        conflicts: sql<number>`count(*) filter (where ${paymentTransactions.status} = 'conflict')`,
      })
      .from(paymentTransactions)
      .where(gte(paymentTransactions.createdAt, since)),
  ]);

  const counts = (countRow ?? {}) as Record<string, unknown>;
  const paid = Number(summary?.paid ?? 0);
  const failed = Number(summary?.failed ?? 0);
  const conflicts = Number(summary?.conflicts ?? 0);
  const settled = paid + failed + conflicts;

  const href = (
    o: Partial<Record<"view" | "q" | "source" | "page", string>>,
  ) => {
    const m = { view: view.key, q, source, ...o };
    const s = new URLSearchParams();
    if (m.view !== "all") s.set("view", m.view);
    if (m.q) s.set("q", m.q);
    if (m.source !== "all") s.set("source", m.source);
    if (o.page && o.page !== "1") s.set("page", o.page);
    const str = s.toString();
    return str ? `/admin/payments?${str}` : "/admin/payments";
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Sales"
        title="Payments"
        description="Every Paystack checkout, including ones that never finished. Anything marked “Needs review” took money that didn't line up with an order."
      />

      <MetricGrid className="mb-8 grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Collected · 30d"
          value={money(Number(summary?.collected ?? 0) / 100)}
          hint={`${count(paid)} payments`}
        />
        <Metric
          label="Success rate · 30d"
          value={percent(settled ? (paid / settled) * 100 : null)}
          hint="Of payments that finished"
        />
        <Metric label="Failed · 30d" value={count(failed)} />
        <Metric
          label="Needs review"
          value={count(Number(counts.conflict ?? 0))}
          hint={
            Number(counts.conflict ?? 0)
              ? "Open the payment to resolve"
              : "Nothing to review"
          }
          href={
            Number(counts.conflict ?? 0)
              ? href({ view: "conflict", page: "1" })
              : undefined
          }
        />
      </MetricGrid>

      <ViewTabs
        label="Payment views"
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
        action="/admin/payments"
        search={q}
        placeholder="Search reference, order number or email"
        hidden={{ view: view.key === "all" ? undefined : view.key }}
      >
        <Select
          name="source"
          label="Source"
          defaultValue={source}
          options={[
            { value: "all", label: "All sources" },
            { value: "catalog_checkout", label: "Shop checkout" },
            { value: "custom_quote", label: "Custom quote" },
          ]}
        />
      </FilterBar>

      {rows.length === 0 ? (
        <div className="border border-line px-5">
          <EmptyState title="No payments here">
            {view.key === "conflict"
              ? "Nothing needs review. Every payment matched its order."
              : "Try another view or search."}
          </EmptyState>
        </div>
      ) : (
        <div className="border border-line">
          <table className="w-full text-sm">
            <thead className="hidden md:table-header-group">
              <tr className="border-b border-line text-left text-fg-3">
                <th className="px-4 py-2.5 font-normal">Payment</th>
                <th className="px-3 py-2.5 font-normal">Customer</th>
                <th className="px-3 py-2.5 font-normal">Status</th>
                <th className="hidden px-3 py-2.5 font-normal lg:table-cell">
                  Order
                </th>
                <th className="px-4 py-2.5 text-right font-normal">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const s = PAYMENT_STATUS[r.status] ?? {
                  label: r.status,
                  tone: "neutral" as Tone,
                };
                return (
                  <tr
                    key={r.id}
                    className="group relative transition-colors hover:bg-plate/60"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/payments/${r.id}`}
                        className="block max-w-[26ch] truncate font-mono text-xs text-fg after:absolute after:inset-0"
                      >
                        {r.reference}
                      </Link>
                      <p className="mt-0.5 text-xs text-fg-3">
                        {SOURCE_LABEL[r.source] ?? r.source} ·{" "}
                        {timeAgo(r.createdAt)}
                      </p>
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      <p className="max-w-[24ch] truncate text-fg">
                        {r.customerName ?? "—"}
                      </p>
                      <p className="max-w-[28ch] truncate text-xs text-fg-3">
                        {r.email ?? ""}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill tone={s.tone}>{s.label}</StatusPill>
                      {r.conflictCode ? (
                        <p
                          className="mt-1 max-w-[26ch] truncate text-xs text-red-700 dark:text-red-400"
                          title={r.conflictMessage ?? undefined}
                        >
                          {r.conflictCode.replace(/_/g, " ")}
                        </p>
                      ) : r.status === "failed" && r.paystackStatus ? (
                        <p className="mt-1 text-xs text-fg-3">
                          {r.paystackStatus.replace(/_/g, " ")}
                        </p>
                      ) : null}
                    </td>
                    <td className="hidden px-3 py-3 lg:table-cell">
                      {r.orderId && r.orderNumber ? (
                        <Link
                          href={`/admin/orders/${r.orderId}`}
                          className="relative z-10 font-mono text-xs text-fg underline-offset-2 hover:underline"
                        >
                          {r.orderNumber}
                        </Link>
                      ) : (
                        <span className="text-xs text-fg-3">No order</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {money(r.amount / 100)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={Number(totalRow?.count ?? 0)}
        hrefFor={(p) => href({ page: String(p) })}
      />
    </Page>
  );
}
