import { CouponForm } from "components/admin/coupons/coupon-form";
import { DeleteCouponButton } from "components/admin/coupons/delete-coupon-button";
import {
  EmptyState,
  Metric,
  MetricGrid,
  Page,
  Panel,
  StatusPill,
} from "components/admin/ui";
import { eq, sql } from "drizzle-orm";
import { COUPON_STATE, couponState, toLagosInput } from "lib/admin/coupons";
import { count, money, shortDate, timeAgo } from "lib/admin/format";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { coupons } from "lib/db/schema";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [c] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.id, id))
    .limit(1);
  if (!c) notFound();

  const [[perf], recent] = await Promise.all([
    db.execute(sql`
      select count(*) as orders, coalesce(sum(total_amount), 0) as sales, coalesce(sum(discount_amount), 0) as discount,
        count(distinct lower(email)) as customers
      from orders where upper(coupon_code) = upper(${c.code}) and status <> 'cancelled'
    `) as unknown as Promise<Array<Record<string, unknown>>>,
    db.execute(sql`
      select id, order_number, customer_name, total_amount, discount_amount, created_at::text as created_at
      from orders where upper(coupon_code) = upper(${c.code}) and status <> 'cancelled'
      order by created_at desc limit 10
    `) as unknown as Promise<Array<Record<string, unknown>>>,
  ]);

  const state = couponState({
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
  });
  const s = COUPON_STATE[state];
  const sales = Number(perf?.sales ?? 0);
  const orders = Number(perf?.orders ?? 0);

  return (
    <Page>
      <header className="mb-8 border-b border-line pb-6">
        <Link
          href="/admin/coupons"
          className="label mb-4 inline-flex items-center gap-1.5 text-fg-3 hover:text-fg"
        >
          <ArrowLeft className="size-3.5" /> Coupons
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="display text-[clamp(2.4rem,6vw,4.25rem)] tracking-wide">
              {c.code}
            </h1>
            <div className="mt-3 flex items-center gap-2 text-sm text-fg-3">
              <StatusPill tone={s.tone}>{s.label}</StatusPill>
              <span>Created {shortDate(c.createdAt)}</span>
            </div>
          </div>
          <DeleteCouponButton id={c.id} code={c.code} used={c.usedCount} />
        </div>
      </header>

      <MetricGrid className="mb-8 grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Times used"
          value={count(c.usedCount)}
          hint={c.maxUses ? `of ${count(c.maxUses)} allowed` : "No limit"}
        />
        <Metric
          label="Sales with this code"
          value={money(sales)}
          hint={`${count(orders)} paid orders`}
        />
        <Metric
          label="Discount given"
          value={money(Number(perf?.discount ?? 0))}
        />
        <Metric
          label="Customers"
          value={count(Number(perf?.customers ?? 0))}
          hint={orders ? `Avg. order ${money(sales / orders)}` : undefined}
        />
      </MetricGrid>

      <CouponForm
        id={c.id}
        usedCount={c.usedCount}
        initial={{
          code: c.code,
          description: c.description ?? "",
          discountType: c.discountType as
            | "percentage"
            | "fixed"
            | "free_shipping",
          discountValue:
            c.discountType === "free_shipping"
              ? ""
              : String(Number(c.discountValue)),
          minOrderValue: c.minOrderValue ? String(Number(c.minOrderValue)) : "",
          maxUses: c.maxUses !== null ? String(c.maxUses) : "",
          maxUsesPerUser:
            c.maxUsesPerUser !== null ? String(c.maxUsesPerUser) : "",
          requiresLogin: c.requiresLogin,
          grantsFreeShipping: c.grantsFreeShipping,
          includeShippingInDiscount: c.includeShippingInDiscount,
          startDate: toLagosInput(c.startDate),
          expiryDate: toLagosInput(c.expiryDate),
          isActive: c.isActive,
        }}
      />

      <Panel
        title="Recent orders with this code"
        className="mt-10"
        bodyClassName="p-0"
      >
        {recent.length === 0 ? (
          <div className="px-5">
            <EmptyState title="Not used yet">
              Share the code and paid orders that use it will appear here.
            </EmptyState>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((o) => (
              <li key={String(o.id)}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-plate/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-fg">
                      {String(o.customer_name)}
                    </p>
                    <p className="text-xs text-fg-3">
                      <span className="font-mono">
                        {String(o.order_number)}
                      </span>{" "}
                      ·{" "}
                      {timeAgo(
                        new Date(String(o.created_at).replace(" ", "T") + "Z"),
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {money(Number(o.total_amount))}
                    </p>
                    <p className="text-xs tabular-nums text-fg-3">
                      −{money(Number(o.discount_amount))}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Page>
  );
}
