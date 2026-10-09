import PaymentDetailActions from "components/admin/PaymentDetailActions";
import {
  PAYMENT_STATUS,
  Page,
  Panel,
  StatList,
  StatRow,
  StatusPill,
  type Tone,
} from "components/admin/ui";
import { desc, eq } from "drizzle-orm";
import { money, timeAgo } from "lib/admin/format";
import { SHOP_TIME_ZONE } from "lib/admin/range";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { orders, paymentEvents, paymentTransactions } from "lib/db/schema";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const when = (d: Date) =>
  d.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SHOP_TIME_ZONE,
  });

/** Plain-language explanations for the reconcile conflict codes. */
const CONFLICT_HELP: Record<string, string> = {
  amount_mismatch:
    "Paystack charged a different amount from what the order or quote expected. Check the customer wasn't over- or under-charged before fulfilling.",
  currency_mismatch: "The payment currency doesn't match the order currency.",
  cart_not_found:
    "The cart behind this checkout no longer exists, so no order could be created automatically.",
  quote_not_found: "The custom quote this payment was for couldn't be found.",
  request_not_found:
    "The custom request this payment was for couldn't be found.",
  metadata_mismatch:
    "The checkout details sent to Paystack don't match what we have on record.",
  missing_metadata:
    "Paystack didn't return the checkout details needed to match this payment to an order.",
  invalid_status:
    "Paystack reported a status we didn't expect for a completed checkout.",
};

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [payment] = await db
    .select({
      id: paymentTransactions.id,
      provider: paymentTransactions.provider,
      reference: paymentTransactions.reference,
      source: paymentTransactions.source,
      status: paymentTransactions.status,
      amount: paymentTransactions.amount,
      paystackStatus: paymentTransactions.paystackStatus,
      customer: paymentTransactions.customer,
      metadata: paymentTransactions.metadata,
      payload: paymentTransactions.payload,
      conflictCode: paymentTransactions.conflictCode,
      conflictMessage: paymentTransactions.conflictMessage,
      orderId: paymentTransactions.orderId,
      createdAt: paymentTransactions.createdAt,
      updatedAt: paymentTransactions.updatedAt,
      lastVerifiedAt: paymentTransactions.lastVerifiedAt,
      resolvedAt: paymentTransactions.resolvedAt,
      orderNumber: orders.orderNumber,
      orderTotal: orders.totalAmount,
      orderEmail: orders.email,
      orderCustomerName: orders.customerName,
    })
    .from(paymentTransactions)
    .leftJoin(orders, eq(paymentTransactions.orderId, orders.id))
    .where(eq(paymentTransactions.id, id))
    .limit(1);
  if (!payment) notFound();

  const events = await db
    .select()
    .from(paymentEvents)
    .where(eq(paymentEvents.paymentTransactionId, payment.id))
    .orderBy(desc(paymentEvents.createdAt));

  const status = PAYMENT_STATUS[payment.status] ?? {
    label: payment.status,
    tone: "neutral" as Tone,
  };
  const customer = (payment.customer ?? {}) as Record<
    string,
    string | undefined
  >;
  const email = payment.orderEmail ?? customer.email ?? null;
  const name =
    payment.orderCustomerName ??
    ([customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
      null);
  const amount = payment.amount / 100;
  const orderTotal =
    payment.orderTotal !== null ? Number(payment.orderTotal) : null;

  return (
    <Page>
      <header className="mb-8 border-b border-line pb-6">
        <Link
          href="/admin/payments"
          className="label mb-4 inline-flex items-center gap-1.5 text-fg-3 hover:text-fg"
        >
          <ArrowLeft className="size-3.5" /> Payments
        </Link>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="display text-[clamp(2.4rem,6vw,4.25rem)]">
              {money(amount)}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-fg-3">
              <StatusPill tone={status.tone}>{status.label}</StatusPill>
              <span className="font-mono text-xs">{payment.reference}</span>
              <span>· {when(payment.createdAt)}</span>
            </div>
          </div>
          <PaymentDetailActions
            paymentId={payment.id}
            provider={payment.provider}
          />
        </div>
      </header>

      {payment.conflictCode && !payment.resolvedAt ? (
        <div className="mb-6 border border-red-600/40 bg-red-600/5 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-medium text-fg">
            <span className="size-2 rounded-full bg-red-600" aria-hidden />
            Needs review: {payment.conflictCode.replace(/_/g, " ")}
          </p>
          <p className="mt-1 text-sm text-fg-2">
            {CONFLICT_HELP[payment.conflictCode] ??
              payment.conflictMessage ??
              "This payment couldn't be matched to an order automatically."}
          </p>
          {payment.conflictMessage && CONFLICT_HELP[payment.conflictCode] ? (
            <p className="mt-1 font-mono text-xs text-fg-3">
              {payment.conflictMessage}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-fg-3">
            Fix the cause, then use “Match to order again”. Use “Check with
            Paystack” to pull the latest status first.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Panel
            title="History"
            description="What happened to this payment, newest first."
          >
            {events.length === 0 ? (
              <p className="text-sm text-fg-3">No events recorded.</p>
            ) : (
              <ol className="relative space-y-5 border-l border-line pl-5">
                {events.map((e) => {
                  const tone = PAYMENT_STATUS[e.status]?.tone;
                  return (
                    <li key={e.id} className="relative">
                      <span
                        className={`absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-canvas ${
                          tone === "critical"
                            ? "bg-red-600"
                            : tone === "positive"
                              ? "bg-emerald-600"
                              : "bg-fg"
                        }`}
                        aria-hidden
                      />
                      <p className="text-sm text-fg">
                        {e.eventType.replace(/[._]/g, " ")}
                        <span className="text-fg-3">
                          {" "}
                          · {PAYMENT_STATUS[e.status]?.label ?? e.status}
                        </span>
                      </p>
                      {e.message ? (
                        <p className="mt-0.5 text-xs text-fg-2">{e.message}</p>
                      ) : null}
                      <p className="text-xs text-fg-3">
                        {when(e.createdAt)} · {timeAgo(e.createdAt)}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>

          <Panel
            title="Raw data"
            description="What Paystack sent. Useful when talking to Paystack support."
          >
            <details className="group">
              <summary className="label cursor-pointer text-fg-3 hover:text-fg">
                Show payload
              </summary>
              <pre className="mt-3 max-h-[480px] overflow-auto bg-plate p-4 font-mono text-[11px] leading-relaxed text-fg-2">
                {JSON.stringify(
                  {
                    metadata: payment.metadata,
                    customer: payment.customer,
                    payload: payment.payload,
                  },
                  null,
                  2,
                )}
              </pre>
            </details>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Order">
            {payment.orderId && payment.orderNumber ? (
              <>
                <Link
                  href={`/admin/orders/${payment.orderId}`}
                  className="font-mono text-sm font-medium text-fg underline-offset-2 hover:underline"
                >
                  {payment.orderNumber}
                </Link>
                <StatList>
                  <StatRow
                    label="Order total"
                    value={orderTotal !== null ? money(orderTotal) : "—"}
                  />
                  <StatRow
                    label="Charged"
                    value={money(amount)}
                    tone={
                      orderTotal !== null &&
                      Math.round(orderTotal * 100) !== payment.amount
                        ? "critical"
                        : undefined
                    }
                  />
                </StatList>
              </>
            ) : (
              <p className="text-sm text-fg-3">
                {payment.status === "paid"
                  ? "Paid, but no order is linked yet."
                  : "No order was created from this payment."}
              </p>
            )}
          </Panel>

          <Panel title="Customer">
            <p className="text-sm font-medium text-fg">{name ?? "Unknown"}</p>
            {email ? (
              <a
                href={`mailto:${email}`}
                className="mt-1 block truncate text-sm text-fg-2 hover:text-fg"
              >
                {email}
              </a>
            ) : null}
            {email ? (
              <Link
                href={`/admin/users/${encodeURIComponent(email.toLowerCase())}`}
                className="label mt-3 inline-block text-fg-3 hover:text-fg"
              >
                Customer profile →
              </Link>
            ) : null}
          </Panel>

          <Panel title="Details">
            <StatList>
              <StatRow
                label="Source"
                value={
                  payment.source === "custom_quote"
                    ? "Custom quote"
                    : "Shop checkout"
                }
              />
              <StatRow
                label="Paystack says"
                value={payment.paystackStatus?.replace(/_/g, " ") ?? "—"}
              />
              <StatRow
                label="Last checked"
                value={
                  payment.lastVerifiedAt
                    ? timeAgo(payment.lastVerifiedAt)
                    : "Never"
                }
              />
              {payment.resolvedAt ? (
                <StatRow
                  label="Resolved"
                  value={when(payment.resolvedAt)}
                  tone="positive"
                />
              ) : null}
              <StatRow label="Updated" value={timeAgo(payment.updatedAt)} />
            </StatList>
          </Panel>
        </aside>
      </div>
    </Page>
  );
}
