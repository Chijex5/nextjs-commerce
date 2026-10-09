import {
  BarList,
  DeliveryStatus,
  EmptyState,
  Metric,
  MetricGrid,
  OrderStatus,
  Page,
  Panel,
  StatList,
  StatRow,
} from "components/admin/ui";
import { getCustomer } from "lib/admin/customers";
import {
  count,
  daysSince,
  money,
  pairs,
  shortDate,
  timeAgo,
} from "lib/admin/format";
import { authOptions } from "lib/auth";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function intlPhone(raw: string | null | undefined) {
  const digits = raw?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  if (digits.startsWith("234")) return digits;
  return `234${digits.replace(/^0/, "")}`;
}

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const data = await getCustomer(id);
  if (!data) notFound();

  const { customer: c, orders, products, address } = data;
  const now = new Date();
  const name = c.name || c.email.split("@")[0] || c.email;
  const phone = intlPhone(c.phone ?? address?.phone1);
  const aov = c.orders > 0 ? c.spent / c.orders : 0;
  const tenureDays = c.firstOrder ? daysSince(c.firstOrder, now) : 0;
  const cadence =
    c.orders > 1 && c.firstOrder && c.lastOrder
      ? Math.round(
          (c.lastOrder.getTime() - c.firstOrder.getTime()) /
            86_400_000 /
            (c.orders - 1),
        )
      : null;

  const tag =
    c.orders === 0
      ? "Hasn't ordered yet"
      : c.orders >= 3
        ? "Loyal customer"
        : c.orders === 2
          ? "Repeat customer"
          : "First-time customer";

  return (
    <Page>
      <header className="mb-8 border-b border-line pb-6">
        <Link
          href="/admin/users"
          className="label mb-4 inline-flex items-center gap-1.5 text-fg-3 hover:text-fg"
        >
          <ArrowLeft className="size-3.5" /> Customers
        </Link>
        <h1 className="display text-[clamp(2.4rem,6vw,4.25rem)]">{name}</h1>
        <p className="mt-3 text-sm text-fg-3">
          {tag}
          {c.firstOrder
            ? ` · customer for ${tenureDays < 31 ? `${tenureDays} days` : `${Math.round(tenureDays / 30)} months`}`
            : ""}
          {c.state ? ` · ${c.state}` : ""}
        </p>
      </header>

      <MetricGrid className="mb-6 grid-cols-2 lg:grid-cols-4">
        <Metric label="Total spent" value={money(c.spent)} />
        <Metric label="Orders" value={count(c.orders)} />
        <Metric label="Avg. order" value={c.orders ? money(aov) : "—"} />
        <Metric
          label="Last order"
          value={c.lastOrder ? timeAgo(c.lastOrder, now) : "—"}
          hint={cadence ? `Orders every ~${cadence} days` : undefined}
        />
      </MetricGrid>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Panel title="Orders" bodyClassName="p-0">
            {orders.length === 0 ? (
              <div className="px-5">
                <EmptyState title="No orders yet">
                  {c.signedUp
                    ? `Signed up ${shortDate(c.signedUp)} but hasn't bought anything.`
                    : null}
                </EmptyState>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-plate/60"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-medium text-fg">
                          {o.orderNumber}
                          {o.orderType === "custom" ? (
                            <span className="label ml-2 text-fg-3">Custom</span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-fg-3">
                          {shortDate(o.createdAt)} · {pairs(o.units)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        {o.status === "cancelled" ? (
                          <OrderStatus status="cancelled" />
                        ) : (
                          <DeliveryStatus status={o.deliveryStatus} />
                        )}
                        <span className="w-24 text-right text-sm font-medium tabular-nums">
                          {money(o.total)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="What they buy" description="Products by pairs bought.">
            <BarList
              items={products}
              format={pairs}
              secondary={money}
              empty="No purchases yet."
            />
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Contact">
            <div className="space-y-2.5 text-sm">
              <a
                href={`mailto:${c.email}`}
                className="flex items-center gap-3 text-fg-2 hover:text-fg"
              >
                <Mail className="size-4 text-fg-3" />{" "}
                <span className="truncate">{c.email}</span>
              </a>
              {phone ? (
                <>
                  <a
                    href={`tel:+${phone}`}
                    className="flex items-center gap-3 text-fg-2 hover:text-fg"
                  >
                    <Phone className="size-4 text-fg-3" /> +{phone}
                  </a>
                  <a
                    href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${name.split(" ")[0]}, it's D'FOOTPRINT.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-fg-2 hover:text-fg"
                  >
                    <MessageCircle className="size-4 text-fg-3" /> Message on
                    WhatsApp
                  </a>
                </>
              ) : null}
            </div>
          </Panel>

          {address ? (
            <Panel title="Last delivery address">
              <address className="space-y-0.5 text-sm not-italic text-fg-2">
                {[
                  [address.firstName, address.lastName]
                    .filter(Boolean)
                    .join(" "),
                  address.streetAddress,
                  address.landmark ? `Landmark: ${address.landmark}` : null,
                  [address.ward, address.lga, address.state]
                    .filter(Boolean)
                    .join(", "),
                ]
                  .filter(Boolean)
                  .map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
              </address>
            </Panel>
          ) : null}

          <Panel title="Account">
            <StatList>
              <StatRow
                label="Account"
                value={c.userId ? "Yes" : "Guest checkout"}
              />
              {c.signedUp ? (
                <StatRow label="Signed up" value={shortDate(c.signedUp)} />
              ) : null}
              {c.userId ? (
                <StatRow
                  label="Last sign-in"
                  value={c.lastLogin ? timeAgo(c.lastLogin, now) : "Never"}
                />
              ) : null}
              {c.userId ? (
                <StatRow
                  label="Status"
                  value={c.active ? "Active" : "Deactivated"}
                  tone={c.active ? "positive" : "critical"}
                />
              ) : null}
              <StatRow
                label="Newsletter"
                value={c.subscribed ? "Subscribed" : "Not subscribed"}
              />
              {c.firstOrder ? (
                <StatRow label="First order" value={shortDate(c.firstOrder)} />
              ) : null}
            </StatList>
          </Panel>
        </aside>
      </div>
    </Page>
  );
}
