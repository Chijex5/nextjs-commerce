"use client";

import clsx from "clsx";
import {
  DeliveryStatus,
  OrderStatus,
  Page,
  Panel,
  StatList,
  StatRow,
} from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import { money, shortDate, timeAgo } from "lib/admin/format";
import { SHOP_TIME_ZONE } from "lib/admin/range";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Mail,
  MessageCircle,
  Pause,
  Phone,
  Play,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type Detail = {
  id: string;
  orderNumber: string;
  orderType: string;
  customerName: string;
  email: string;
  phone: string | null;
  userId: string | null;
  status: string;
  deliveryStatus: string;
  estimatedArrival: string | null;
  shippingAddress: Record<string, string | undefined>;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shipping: number;
  tax: number;
  total: number;
  notes: string | null;
  trackingNumber: string | null;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    title: string;
    variant: string;
    quantity: number;
    price: number;
    total: number;
    image: string | null;
  }>;
  customRequest: { id: string; requestNumber: string } | null;
  payment: {
    id: string;
    reference: string;
    status: string;
    amount: number;
    conflictCode: string | null;
    conflictMessage: string | null;
    updatedAt: string;
  } | null;
  customer: { orders: number; spent: number; firstOrderAt: string | null };
};

/** The workshop flow, in order. Paused and cancelled sit outside it. */
const FLOW = [
  { key: "production", label: "In production", next: "Start packing" },
  { key: "sorting", label: "Packing", next: "Send out for delivery" },
  { key: "dispatch", label: "Out for delivery", next: "Mark as delivered" },
  { key: "completed", label: "Delivered", next: null },
] as const;

/** Order status follows the delivery stage, so the two can't disagree. */
function statusFor(stage: string) {
  if (stage === "completed") return "completed";
  if (stage === "cancelled") return "cancelled";
  return "processing";
}

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SHOP_TIME_ZONE,
  });

/** +234 local numbers → international digits for tel: and WhatsApp links. */
function intlPhone(raw: string | null | undefined) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return `234${digits}`;
}

export function OrderDetail({ order }: { order: Detail }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const cancelled =
    order.status === "cancelled" || order.deliveryStatus === "cancelled";
  const paused = order.deliveryStatus === "paused";
  const stageIndex = FLOW.findIndex((s) => s.key === order.deliveryStatus);
  const current = FLOW[stageIndex];
  const done = order.deliveryStatus === "completed";
  const late =
    !done &&
    !cancelled &&
    !paused &&
    order.estimatedArrival &&
    new Date(order.estimatedArrival).getTime() < Date.now();

  async function save(
    body: Record<string, unknown>,
    label: string,
    success: string,
  ) {
    setPending(label);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Update failed");
      }
      toast.success(success);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setPending(null);
    }
  }

  const moveTo = (stage: string, label: string) => {
    if (
      !window.confirm(
        `Move this order to "${label}"? ${order.customerName} will get an email about it.`,
      )
    )
      return;
    void save(
      { deliveryStatus: stage, status: statusFor(stage), acknowledge: true },
      stage,
      `Moved to ${label.toLowerCase()}`,
    );
  };

  const address = order.shippingAddress;
  const addressLines = [
    [address.firstName, address.lastName].filter(Boolean).join(" "),
    address.streetAddress,
    address.nearestBusStop ? `Near ${address.nearestBusStop} bus stop` : null,
    address.landmark ? `Landmark: ${address.landmark}` : null,
    [address.ward, address.lga, address.state].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean) as string[];
  const phone = intlPhone(order.phone ?? address.phone1);
  const units = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Page>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="mb-8 border-b border-line pb-6">
        <Link
          href="/admin/orders"
          className="label mb-4 inline-flex items-center gap-1.5 text-fg-3 hover:text-fg"
        >
          <ArrowLeft className="size-3.5" /> Orders
        </Link>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="display text-[clamp(2.4rem,6vw,4.25rem)]">
              {order.orderNumber}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-fg-3">
              {cancelled ? (
                <OrderStatus status="cancelled" />
              ) : (
                <DeliveryStatus status={order.deliveryStatus} />
              )}
              <span className="inline-flex items-center gap-1.5 border border-line px-2 py-0.5 text-[11px] font-medium text-fg-2">
                <span
                  className="size-1.5 rounded-full bg-emerald-600"
                  aria-hidden
                />{" "}
                Paid
              </span>
              {order.orderType === "custom" ? (
                <span className="border border-line px-2 py-0.5 text-[11px] font-medium text-fg-2">
                  Custom order
                </span>
              ) : null}
              <span>
                Placed {dateTime(order.createdAt)} · {units}{" "}
                {units === 1 ? "pair" : "pairs"}
              </span>
            </div>
          </div>

          {/* Primary actions: one obvious next step. */}
          <div className="flex flex-wrap items-center gap-2">
            {!order.acknowledgedAt && !cancelled ? (
              <button
                type="button"
                disabled={!!pending}
                onClick={() =>
                  save({ acknowledge: true }, "ack", "Order confirmed")
                }
                className={buttonClass(
                  current?.next && !paused ? "outline" : "solid",
                  "md",
                )}
              >
                {pending === "ack" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Confirm order
              </button>
            ) : null}
            {!cancelled && !paused && current?.next ? (
              <button
                type="button"
                disabled={!!pending}
                onClick={() =>
                  moveTo(FLOW[stageIndex + 1]!.key, FLOW[stageIndex + 1]!.label)
                }
                className={buttonClass("solid", "md")}
              >
                {pending === FLOW[stageIndex + 1]!.key ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {current.next}
              </button>
            ) : null}
            {paused ? (
              <button
                type="button"
                disabled={!!pending}
                onClick={() => moveTo("production", "In production")}
                className={buttonClass("solid", "md")}
              >
                <Play className="size-4" /> Resume production
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {order.payment?.conflictCode ? (
        <div className="mb-6 flex items-start gap-3 border border-red-600/40 bg-red-600/5 px-5 py-4 text-sm">
          <span
            className="mt-1.5 size-2 shrink-0 rounded-full bg-red-600"
            aria-hidden
          />
          <div>
            <p className="font-medium text-fg">
              Payment conflict: {order.payment.conflictCode.replace(/_/g, " ")}
            </p>
            <p className="mt-0.5 text-fg-3">
              {order.payment.conflictMessage ||
                "The payment didn't match this order."}
            </p>
            <Link
              href={`/admin/payments/${order.payment.id}`}
              className="label mt-2 inline-block text-fg underline"
            >
              Resolve in ledger
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── Main column ──────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Progress */}
          <Panel
            title="Progress"
            description={
              cancelled
                ? "This order was cancelled."
                : paused
                  ? "On hold. Resume when you're ready to continue."
                  : done
                    ? "Delivered to the customer."
                    : order.estimatedArrival
                      ? `Estimated arrival ${shortDate(new Date(order.estimatedArrival))}. Updates when the stage changes.`
                      : "Move the order along as work progresses."
            }
          >
            <ol className="grid grid-cols-4 gap-px bg-line">
              {FLOW.map((step, i) => {
                const reached = !cancelled && stageIndex >= i;
                const isCurrent = !cancelled && !paused && stageIndex === i;
                return (
                  <li key={step.key} className="bg-canvas">
                    <button
                      type="button"
                      disabled={
                        cancelled ||
                        !!pending ||
                        step.key === order.deliveryStatus
                      }
                      onClick={() => moveTo(step.key, step.label)}
                      className="group flex w-full flex-col items-start gap-2 pb-1 pr-2 pt-3 text-left disabled:cursor-default"
                      title={
                        step.key === order.deliveryStatus
                          ? undefined
                          : `Move to ${step.label}`
                      }
                    >
                      <span
                        className={clsx(
                          "h-1 w-full",
                          reached
                            ? "bg-fg"
                            : "bg-plate group-enabled:group-hover:bg-fg/30",
                        )}
                      />
                      <span className="font-mono text-[10px] text-fg-3">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={clsx(
                          "text-sm",
                          isCurrent
                            ? "font-semibold text-fg"
                            : reached
                              ? "text-fg-2"
                              : "text-fg-3",
                        )}
                      >
                        {step.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {late ? (
              <p className="mt-4 text-sm font-medium text-red-700 dark:text-red-400">
                Running late. The estimate was{" "}
                {shortDate(new Date(order.estimatedArrival!))}.
              </p>
            ) : null}
            {!cancelled && !done ? (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                {!paused ? (
                  <button
                    type="button"
                    disabled={!!pending}
                    onClick={() => moveTo("paused", "Paused")}
                    className={buttonClass("outline", "md")}
                  >
                    <Pause className="size-4" /> Pause
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={!!pending}
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Cancel this order? It will be excluded from sales and the customer will be emailed. Refunds are handled in Paystack.",
                      )
                    )
                      return;
                    void save(
                      {
                        deliveryStatus: "cancelled",
                        status: "cancelled",
                        acknowledge: true,
                      },
                      "cancel",
                      "Order cancelled",
                    );
                  }}
                  className={buttonClass(
                    "outline",
                    "md",
                    "hover:!border-red-600 hover:!bg-red-600 hover:!text-white",
                  )}
                >
                  <X className="size-4" /> Cancel order
                </button>
              </div>
            ) : null}
          </Panel>

          {/* Items */}
          <Panel
            title="Items"
            description={
              order.customRequest
                ? `From custom request ${order.customRequest.requestNumber}`
                : undefined
            }
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="relative size-16 shrink-0 overflow-hidden bg-plate">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${item.productId}/edit`}
                      className="block truncate text-sm font-medium text-fg hover:underline"
                    >
                      {item.title}
                    </Link>
                    {item.variant && item.variant !== "Default" ? (
                      <p className="text-xs text-fg-3">{item.variant}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-fg-3 tabular-nums">
                      {money(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {money(item.total)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-4">
              <StatList>
                <StatRow label="Subtotal" value={money(order.subtotal)} />
                {order.discount > 0 ? (
                  <StatRow
                    label={`Discount${order.couponCode ? ` · ${order.couponCode.toUpperCase()}` : ""}`}
                    value={`−${money(order.discount)}`}
                  />
                ) : null}
                <StatRow label="Shipping" value={money(order.shipping)} />
                {order.tax > 0 ? (
                  <StatRow label="Tax" value={money(order.tax)} />
                ) : null}
                <div className="flex items-baseline justify-between py-3">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="font-head text-2xl font-extrabold tabular-nums [font-stretch:75%]">
                    {money(order.total)}
                  </span>
                </div>
              </StatList>
              {order.payment ? (
                <p className="text-xs text-fg-3">
                  Paid {money(order.payment.amount)} via Paystack ·{" "}
                  <Link
                    href={`/admin/payments/${order.payment.id}`}
                    className="font-mono underline hover:text-fg"
                  >
                    {order.payment.reference}
                  </Link>
                </p>
              ) : null}
            </div>
          </Panel>

          {/* Timeline */}
          <Panel title="Timeline">
            <ol className="relative space-y-5 border-l border-line pl-5">
              {timeline(order).map((event, i) => (
                <li key={i} className="relative">
                  <span
                    className={clsx(
                      "absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-canvas",
                      event.tone === "critical"
                        ? "bg-red-600"
                        : event.tone === "muted"
                          ? "bg-fg-3"
                          : "bg-fg",
                    )}
                    aria-hidden
                  />
                  <p className="text-sm text-fg">{event.label}</p>
                  {event.at ? (
                    <p
                      className="text-xs text-fg-3"
                      title={new Date(event.at).toLocaleString("en-NG", {
                        timeZone: "Africa/Lagos",
                      })}
                    >
                      {dateTime(event.at)} · {timeAgo(new Date(event.at))}
                    </p>
                  ) : event.detail ? (
                    <p className="text-xs text-fg-3">{event.detail}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        {/* ── Side column ──────────────────────────────────────────── */}
        <aside className="space-y-6">
          <Panel title="Customer">
            <p className="text-base font-semibold text-fg">
              {order.customerName}
            </p>
            <p className="mt-1 text-sm text-fg-3">
              {order.customer.orders <= 1
                ? "First order"
                : `${order.customer.orders} orders · ${money(order.customer.spent)} spent`}
              {order.customer.firstOrderAt && order.customer.orders > 1
                ? ` · since ${new Date(order.customer.firstOrderAt).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}`
                : ""}
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <ContactRow
                icon={<Mail className="size-4" />}
                href={`mailto:${order.email}`}
                value={order.email}
              />
              {phone ? (
                <>
                  <ContactRow
                    icon={<Phone className="size-4" />}
                    href={`tel:+${phone}`}
                    value={`+${phone}`}
                  />
                  <ContactRow
                    icon={<MessageCircle className="size-4" />}
                    href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${order.customerName.split(" ")[0]}, it's D'FOOTPRINT about your order ${order.orderNumber}.`)}`}
                    value="Message on WhatsApp"
                    external
                  />
                </>
              ) : null}
            </div>
            {order.userId ? (
              <Link
                href={`/admin/users/${order.userId}`}
                className="label mt-4 inline-block text-fg-3 hover:text-fg"
              >
                Customer profile →
              </Link>
            ) : (
              <p className="mt-4 text-xs text-fg-3">Checked out as a guest.</p>
            )}
          </Panel>

          <Panel title="Delivery address">
            {addressLines.length ? (
              <>
                <address className="space-y-0.5 text-sm not-italic text-fg-2">
                  {addressLines.map((line, i) => (
                    <p
                      key={i}
                      className={i === 0 ? "font-medium text-fg" : undefined}
                    >
                      {line}
                    </p>
                  ))}
                  {address.phone2 ? (
                    <p className="pt-1">Alt. phone: +234 {address.phone2}</p>
                  ) : null}
                </address>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      [...addressLines, phone ? `+${phone}` : ""]
                        .filter(Boolean)
                        .join("\n"),
                    );
                    toast.success("Address copied");
                  }}
                  className="label mt-4 inline-flex items-center gap-1.5 text-fg-3 hover:text-fg"
                >
                  <Copy className="size-3.5" /> Copy for courier
                </button>
              </>
            ) : (
              <p className="text-sm text-fg-3">
                No address on file
                {order.orderType === "custom"
                  ? ". Arrange delivery with the customer directly."
                  : "."}
              </p>
            )}
          </Panel>

          <TrackingAndNotes
            initialTracking={order.trackingNumber ?? ""}
            initialNotes={order.notes ?? ""}
            busy={pending === "notes"}
            onSave={(trackingNumber, notes) =>
              save(
                {
                  trackingNumber: trackingNumber.trim() || null,
                  notes: notes.trim() || null,
                },
                "notes",
                "Saved",
              )
            }
          />
        </aside>
      </div>
    </Page>
  );
}

function ContactRow({
  icon,
  href,
  value,
  external,
}: {
  icon: React.ReactNode;
  href: string;
  value: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex items-center gap-3 text-fg-2 transition-colors hover:text-fg"
    >
      <span className="text-fg-3">{icon}</span>
      <span className="truncate">{value}</span>
    </a>
  );
}

function TrackingAndNotes({
  initialTracking,
  initialNotes,
  busy,
  onSave,
}: {
  initialTracking: string;
  initialNotes: string;
  busy: boolean;
  onSave: (tracking: string, notes: string) => void;
}) {
  const [tracking, setTracking] = useState(initialTracking);
  const [notes, setNotes] = useState(initialNotes);
  const dirty = tracking !== initialTracking || notes !== initialNotes;
  return (
    <Panel
      title="Tracking & notes"
      description="Notes are internal. Customers never see them."
    >
      <label className="block">
        <span className="label mb-1.5 block text-fg-3">
          Tracking / waybill number
        </span>
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="e.g. GIG 1234567"
          className="h-10 w-full border border-line bg-canvas px-3 text-sm outline-none focus:border-fg"
        />
      </label>
      <label className="mt-4 block">
        <span className="label mb-1.5 block text-fg-3">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Sizing tweaks, courier instructions, anything the team should know"
          className="w-full border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-fg"
        />
      </label>
      <button
        type="button"
        disabled={!dirty || busy}
        onClick={() => onSave(tracking, notes)}
        className={buttonClass(
          dirty ? "solid" : "outline",
          "md",
          "mt-4 w-full",
        )}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {dirty ? "Save" : "Saved"}
      </button>
    </Panel>
  );
}

type TimelineEvent = {
  label: string;
  at?: string;
  detail?: string;
  tone?: "default" | "critical" | "muted";
};

/** Built from the timestamps we have; newest first. */
function timeline(order: Detail): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const stage = FLOW.find((s) => s.key === order.deliveryStatus);
  if (order.status === "cancelled" || order.deliveryStatus === "cancelled") {
    events.push({
      label: "Order cancelled",
      at: order.updatedAt,
      tone: "critical",
    });
  } else if (order.deliveryStatus === "paused") {
    events.push({
      label: "Production paused",
      at: order.updatedAt,
      tone: "critical",
    });
  } else if (stage && stage.key !== "production") {
    events.push({
      label: `Moved to ${stage.label.toLowerCase()}`,
      at: order.updatedAt,
    });
  }
  if (order.trackingNumber)
    events.push({
      label: `Tracking number added: ${order.trackingNumber}`,
      detail: "Shared with the courier",
    });
  if (order.acknowledgedAt) {
    events.push({
      label: `Confirmed${order.acknowledgedBy ? ` by ${order.acknowledgedBy}` : ""}`,
      at: order.acknowledgedAt,
    });
  } else if (order.status !== "cancelled") {
    events.push({
      label: "Waiting to be confirmed",
      detail: "Confirm to let the team know work has started.",
      tone: "muted",
    });
  }
  if (order.payment) {
    events.push({
      label: `Payment of ${money(order.payment.amount)} received`,
      at: order.payment.updatedAt,
    });
  }
  events.push({
    label: `Order placed by ${order.customerName}`,
    at: order.createdAt,
  });
  return events;
}
