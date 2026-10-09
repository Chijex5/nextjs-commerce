"use client";

import clsx from "clsx";
import { DeliveryStatus, EmptyState, OrderStatus } from "components/admin/ui";
import { money, shortDate, timeAgo } from "lib/admin/format";
import { Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

export type OrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  status: string;
  deliveryStatus: string;
  orderType: string;
  total: number;
  createdAt: string;
  estimatedArrival: string | null;
  acknowledged: boolean;
  state: string | null;
  units: number;
  summary: string;
};

const STAGES = [
  { value: "production", label: "In production" },
  { value: "sorting", label: "Packing" },
  { value: "dispatch", label: "Out for delivery" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Delivered" },
];

const isOpen = (o: OrderRow) =>
  !["cancelled", "completed"].includes(o.status) &&
  !["completed", "cancelled"].includes(o.deliveryStatus);

function lateBy(o: OrderRow, now: number) {
  if (!o.estimatedArrival || !isOpen(o) || o.deliveryStatus === "paused")
    return 0;
  const diff = now - new Date(o.estimatedArrival).getTime();
  return diff > 0 ? Math.max(1, Math.floor(diff / 86_400_000)) : 0;
}

export function OrdersList({
  orders,
  emptyHint,
}: {
  orders: OrderRow[];
  emptyHint: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const now = useMemo(() => Date.now(), []);

  const allSelected = orders.length > 0 && selected.size === orders.length;
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function bulkUpdate(body: Record<string, unknown>, verb: string) {
    const ids = [...selected];
    setBusy(true);
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/admin/orders/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).then((r) => {
          if (!r.ok) throw new Error(String(r.status));
        }),
      ),
    );
    setBusy(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed)
      toast.error(`${failed} of ${ids.length} orders couldn't be ${verb}.`);
    else
      toast.success(
        `${ids.length} ${ids.length === 1 ? "order" : "orders"} ${verb}.`,
      );
    setSelected(new Set());
    startTransition(() => router.refresh());
  }

  if (orders.length === 0) {
    return (
      <div className="border border-line px-5">
        <EmptyState title="No orders here">{emptyHint}</EmptyState>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Bulk action bar: replaces the table header while rows are selected. */}
      {selected.size > 0 ? (
        <div className="sticky top-14 z-30 mb-px flex flex-wrap items-center gap-2 border border-fg bg-fg px-3 py-2 text-canvas lg:top-16">
          <span className="mr-2 text-sm font-medium tabular-nums">
            {selected.size} selected
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => bulkUpdate({ acknowledge: true }, "confirmed")}
            className="flex h-8 items-center gap-1.5 border border-canvas/40 px-3 font-mono text-[11px] uppercase tracking-wide hover:bg-canvas hover:text-fg disabled:opacity-50"
          >
            <Check className="size-3.5" /> Confirm
          </button>
          <label className="flex items-center">
            <span className="sr-only">Move to stage</span>
            <select
              disabled={busy}
              value=""
              onChange={(e) => {
                const stage = STAGES.find((s) => s.value === e.target.value);
                if (!stage) return;
                if (
                  window.confirm(
                    `Move ${selected.size} order(s) to "${stage.label}"? Customers are emailed about the change.`,
                  )
                ) {
                  void bulkUpdate(
                    {
                      deliveryStatus: stage.value,
                      status:
                        stage.value === "completed"
                          ? "completed"
                          : "processing",
                      acknowledge: true,
                    },
                    `moved to ${stage.label.toLowerCase()}`,
                  );
                }
              }}
              className="h-8 border border-canvas/40 bg-fg px-2 font-mono text-[11px] uppercase tracking-wide text-canvas outline-none"
            >
              <option value="">Move to…</option>
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto flex h-8 items-center gap-1 px-2 font-mono text-[11px] uppercase tracking-wide opacity-80 hover:opacity-100"
          >
            <X className="size-3.5" /> Clear
          </button>
        </div>
      ) : null}

      {/* Desktop table */}
      <div className="hidden border border-line md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-fg-3">
              <th className="w-10 py-2.5 pl-4">
                <input
                  type="checkbox"
                  aria-label="Select all orders on this page"
                  checked={allSelected}
                  onChange={() =>
                    setSelected(
                      allSelected
                        ? new Set()
                        : new Set(orders.map((o) => o.id)),
                    )
                  }
                  className="size-4 align-middle"
                />
              </th>
              <th className="px-3 py-2.5 font-normal">Order</th>
              <th className="px-3 py-2.5 font-normal">Customer</th>
              <th className="hidden px-3 py-2.5 font-normal xl:table-cell">
                Items
              </th>
              <th className="px-3 py-2.5 font-normal">Delivery</th>
              <th className="hidden px-3 py-2.5 font-normal lg:table-cell">
                Due
              </th>
              <th className="px-4 py-2.5 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => {
              const late = lateBy(o, now);
              const isSelected = selected.has(o.id);
              return (
                <tr
                  key={o.id}
                  className={clsx(
                    "group relative transition-colors",
                    isSelected ? "bg-plate" : "hover:bg-plate/60",
                  )}
                >
                  <td className="relative z-10 py-3 pl-4">
                    <input
                      type="checkbox"
                      aria-label={`Select order ${o.orderNumber}`}
                      checked={isSelected}
                      onChange={() => toggle(o.id)}
                      className="size-4 align-middle"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {!o.acknowledged && isOpen(o) ? (
                        <span
                          className="size-1.5 rounded-full bg-amber-500"
                          title="Not confirmed yet"
                          aria-label="Not confirmed yet"
                        />
                      ) : null}
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-xs font-medium text-fg after:absolute after:inset-0"
                      >
                        {o.orderNumber}
                      </Link>
                      {o.orderType === "custom" ? (
                        <span className="label text-fg-3">Custom</span>
                      ) : null}
                    </div>
                    <p
                      className="mt-0.5 text-xs text-fg-3"
                      title={new Date(o.createdAt).toLocaleString("en-NG", {
                        timeZone: "Africa/Lagos",
                      })}
                    >
                      {timeAgo(new Date(o.createdAt))}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="max-w-[24ch] truncate text-fg">
                      {o.customerName}
                    </p>
                    <p className="max-w-[28ch] truncate text-xs text-fg-3">
                      {o.state ? `${o.state} · ` : ""}
                      {o.email}
                    </p>
                  </td>
                  <td className="hidden px-3 py-3 xl:table-cell">
                    <p className="max-w-[26ch] truncate text-fg-2">
                      {o.summary || "—"}
                    </p>
                    <p className="text-xs text-fg-3">
                      {o.units} {o.units === 1 ? "pair" : "pairs"}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    {o.status === "cancelled" ? (
                      <OrderStatus status="cancelled" />
                    ) : (
                      <DeliveryStatus status={o.deliveryStatus} />
                    )}
                  </td>
                  <td className="hidden px-3 py-3 lg:table-cell">
                    {late ? (
                      <span className="text-xs font-medium text-red-700 dark:text-red-400">
                        {late}d late
                      </span>
                    ) : o.estimatedArrival && isOpen(o) ? (
                      <span className="text-xs text-fg-2">
                        {shortDate(new Date(o.estimatedArrival))}
                      </span>
                    ) : (
                      <span className="text-xs text-fg-3">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {money(o.total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Phone list */}
      <ul className="divide-y divide-line border-y border-line md:hidden">
        {orders.map((o) => {
          const late = lateBy(o, now);
          return (
            <li key={o.id} className="flex items-start gap-3 py-3">
              <input
                type="checkbox"
                aria-label={`Select order ${o.orderNumber}`}
                checked={selected.has(o.id)}
                onChange={() => toggle(o.id)}
                className="mt-1 size-5 shrink-0"
              />
              <Link href={`/admin/orders/${o.id}`} className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-medium text-fg">
                    {o.customerName}
                  </p>
                  <p className="shrink-0 text-sm font-medium tabular-nums">
                    {money(o.total)}
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-fg-3">
                  <span className="font-mono">{o.orderNumber}</span> ·{" "}
                  {timeAgo(new Date(o.createdAt))}
                  {late ? (
                    <span className="text-red-700 dark:text-red-400">
                      {" "}
                      · {late}d late
                    </span>
                  ) : null}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {!o.acknowledged && isOpen(o) ? (
                    <span className="label text-amber-600">New</span>
                  ) : null}
                  {o.status === "cancelled" ? (
                    <OrderStatus status="cancelled" />
                  ) : (
                    <DeliveryStatus status={o.deliveryStatus} />
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
