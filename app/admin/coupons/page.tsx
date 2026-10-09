import {
  EmptyState,
  Metric,
  MetricGrid,
  Page,
  PageHeader,
  StatusPill,
  ViewTabs,
} from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import { desc, sql } from "drizzle-orm";
import {
  COUPON_STATE,
  couponState,
  describeDiscount,
  describeRules,
  type CouponState,
} from "lib/admin/coupons";
import { count, money } from "lib/admin/format";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { coupons } from "lib/db/schema";
import { Plus } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const VIEWS: Array<{ key: "all" | CouponState; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "scheduled", label: "Scheduled" },
  { key: "used-up", label: "Used up" },
  { key: "expired", label: "Expired" },
  { key: "off", label: "Off" },
];

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const view = VIEWS.find((v) => v.key === params.view)?.key ?? "all";

  const [rows, perf] = await Promise.all([
    db.select().from(coupons).orderBy(desc(coupons.createdAt)),
    db.execute(sql`
      select upper(coupon_code) as code, count(*) as orders,
        coalesce(sum(total_amount), 0) as sales, coalesce(sum(discount_amount), 0) as discount,
        max(created_at)::text as last_used
      from orders where coupon_code is not null and coupon_code <> '' and status <> 'cancelled'
      group by 1
    `) as unknown as Promise<
      Array<{
        code: string;
        orders: unknown;
        sales: unknown;
        discount: unknown;
        last_used: string | null;
      }>
    >,
  ]);

  const perfBy = new Map(perf.map((p) => [p.code, p]));
  const now = new Date();
  const list = rows.map((c) => {
    const like = {
      discountType: c.discountType,
      discountValue: Number(c.discountValue),
      minOrderValue: c.minOrderValue ? Number(c.minOrderValue) : null,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      maxUsesPerUser: c.maxUsesPerUser,
      requiresLogin: c.requiresLogin,
      grantsFreeShipping: c.grantsFreeShipping,
      isActive: c.isActive,
      startDate: c.startDate,
      expiryDate: c.expiryDate,
    };
    const p = perfBy.get(c.code.toUpperCase());
    return {
      id: c.id,
      code: c.code,
      note: c.description,
      state: couponState(like, now),
      discount: describeDiscount(like),
      rules: describeRules(like),
      used: c.usedCount,
      max: c.maxUses,
      orders: Number(p?.orders ?? 0),
      sales: Number(p?.sales ?? 0),
      given: Number(p?.discount ?? 0),
    };
  });

  const counts = Object.fromEntries(
    VIEWS.map((v) => [
      v.key,
      v.key === "all"
        ? list.length
        : list.filter((c) => c.state === v.key).length,
    ]),
  );
  const visible = view === "all" ? list : list.filter((c) => c.state === view);
  const totals = list.reduce(
    (acc, c) => ({
      orders: acc.orders + c.orders,
      sales: acc.sales + c.sales,
      given: acc.given + c.given,
    }),
    { orders: 0, sales: 0, given: 0 },
  );

  return (
    <Page>
      <PageHeader
        eyebrow="Marketing"
        title="Coupons"
        description="Discount codes customers type at checkout. Sales figures count paid orders that used the code."
        actions={
          <Link
            href="/admin/coupons/new"
            className={buttonClass("solid", "md")}
          >
            <Plus className="size-4" /> New coupon
          </Link>
        }
      />

      <MetricGrid className="mb-8 grid-cols-2 lg:grid-cols-4">
        <Metric label="Active codes" value={count(counts.active ?? 0)} />
        <Metric label="Orders with a code" value={count(totals.orders)} />
        <Metric label="Sales from codes" value={money(totals.sales)} />
        <Metric
          label="Discount given"
          value={money(totals.given)}
          hint={
            totals.sales
              ? `${((totals.given / (totals.sales + totals.given)) * 100).toFixed(1)}% of gross`
              : undefined
          }
        />
      </MetricGrid>

      <ViewTabs
        label="Coupon views"
        active={view}
        hrefFor={(k) =>
          k === "all" ? "/admin/coupons" : `/admin/coupons?view=${k}`
        }
        views={VIEWS.map((v) => ({
          key: v.key,
          label: v.label,
          count: counts[v.key],
        }))}
      />

      <div className="mt-4">
        {visible.length === 0 ? (
          <div className="border border-line px-5">
            <EmptyState title="No coupons here">
              <Link href="/admin/coupons/new" className="underline">
                Create a coupon
              </Link>{" "}
              to reward customers or run a promotion.
            </EmptyState>
          </div>
        ) : (
          <ul className="divide-y divide-line border border-line">
            {visible.map((c) => {
              const s = COUPON_STATE[c.state];
              const pct = c.max ? Math.min(100, (c.used / c.max) * 100) : null;
              return (
                <li
                  key={c.id}
                  className="group relative grid gap-3 px-4 py-4 transition-colors hover:bg-plate/60 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/coupons/${c.id}`}
                        className="border border-dashed border-fg px-2 py-0.5 font-mono text-sm tracking-widest text-fg after:absolute after:inset-0"
                      >
                        {c.code}
                      </Link>
                      <StatusPill tone={s.tone}>{s.label}</StatusPill>
                    </div>
                    <p className="mt-2 text-sm text-fg">{c.discount}</p>
                    <p className="text-xs text-fg-3">
                      {c.rules}
                      {c.note ? ` · ${c.note}` : ""}
                    </p>
                  </div>
                  <div>
                    <p className="label text-fg-3">Used</p>
                    <p className="text-sm tabular-nums">
                      {count(c.used)}
                      {c.max ? (
                        <span className="text-fg-3"> / {count(c.max)}</span>
                      ) : null}
                    </p>
                    {pct !== null ? (
                      <div className="mt-1.5 h-1 w-full max-w-40 bg-plate">
                        <div
                          className="h-full bg-fg"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <p className="label text-fg-3">Sales</p>
                    <p className="text-sm font-medium tabular-nums">
                      {c.sales ? money(c.sales) : "—"}
                    </p>
                    {c.given ? (
                      <p className="text-xs tabular-nums text-fg-3">
                        {money(c.given)} discounted
                      </p>
                    ) : null}
                  </div>
                  <span className="label hidden text-fg-3 group-hover:text-fg md:block">
                    Edit →
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Page>
  );
}
