"use client";

import clsx from "clsx";
import {
  EmptyState,
  StatList,
  StatRow,
  StatusPill,
  type Tone,
} from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import { money, shortDate, timeAgo } from "lib/admin/format";
import {
  ArrowLeft,
  Check,
  Hammer,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type Quote = {
  id: string;
  version: number;
  amount: number;
  note: string | null;
  status: string;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type RequestItem = {
  id: string;
  requestNumber: string;
  customerName: string;
  email: string;
  phone: string | null;
  title: string;
  description: string;
  sizeNotes: string | null;
  colorPreferences: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  desiredDate: string | null;
  referenceImages: string[];
  status: string;
  adminNotes: string | null;
  customerNotes: string | null;
  quotedAmount: number | null;
  quoteExpiresAt: string | null;
  paidAt: string | null;
  convertedOrderId: string | null;
  createdAt: string;
  updatedAt: string;
  quotes: Quote[];
};

const STATUS: Record<string, { label: string; tone: Tone }> = {
  submitted: { label: "New", tone: "warning" },
  under_review: { label: "Reviewing", tone: "warning" },
  quoted: { label: "Quote sent", tone: "info" },
  awaiting_payment: { label: "Accepted, awaiting payment", tone: "info" },
  paid: { label: "Paid", tone: "positive" },
  in_production: { label: "In production", tone: "positive" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  rejected: { label: "Declined", tone: "critical" },
};

const QUOTE_STATUS: Record<string, { label: string; tone: Tone }> = {
  sent: { label: "Sent", tone: "info" },
  accepted: { label: "Accepted", tone: "positive" },
  paid: { label: "Paid", tone: "positive" },
  rejected: { label: "Declined", tone: "critical" },
  expired: { label: "Expired", tone: "neutral" },
};

const VIEWS = [
  { key: "todo", label: "To quote", statuses: ["submitted", "under_review"] },
  {
    key: "waiting",
    label: "Waiting on customer",
    statuses: ["quoted", "awaiting_payment"],
  },
  {
    key: "making",
    label: "In the workshop",
    statuses: ["paid", "in_production"],
  },
  {
    key: "closed",
    label: "Closed",
    statuses: ["completed", "cancelled", "rejected"],
  },
  { key: "all", label: "All", statuses: null },
] as const;

function intlPhone(raw: string | null) {
  const digits = raw?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  return digits.startsWith("234") ? digits : `234${digits.replace(/^0/, "")}`;
}

export function RequestsInbox({
  requests,
  initialView,
  initialId,
}: {
  requests: RequestItem[];
  initialView?: string;
  initialId?: string;
}) {
  const router = useRouter();
  const [view, setView] = useState<string>(
    VIEWS.some((v) => v.key === initialView)
      ? initialView!
      : requests.some((r) => ["submitted", "under_review"].includes(r.status))
        ? "todo"
        : "all",
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    initialId ?? null,
  );
  const [, startTransition] = useTransition();

  const counts = useMemo(
    () =>
      Object.fromEntries(
        VIEWS.map((v) => [
          v.key,
          v.statuses
            ? requests.filter((r) =>
                (v.statuses as readonly string[]).includes(r.status),
              ).length
            : requests.length,
        ]),
      ),
    [requests],
  );
  const visible = useMemo(() => {
    const v = VIEWS.find((x) => x.key === view)!;
    return v.statuses
      ? requests.filter((r) =>
          (v.statuses as readonly string[]).includes(r.status),
        )
      : requests;
  }, [requests, view]);

  // Desktop shows the first request in the view; phones start on the list.
  const selected = requests.find((r) => r.id === selectedId) ?? null;
  const desktopSelected = selected ?? visible[0] ?? null;

  // Keep the URL shareable without adding history entries.
  useEffect(() => {
    const params = new URLSearchParams();
    if (view !== "todo") params.set("view", view);
    if (selectedId) params.set("id", selectedId);
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `?${qs}` : window.location.pathname,
    );
  }, [view, selectedId]);

  const refresh = () => startTransition(() => router.refresh());

  return (
    <div className="border border-line lg:grid lg:h-[calc(100svh-15rem)] lg:min-h-[560px] lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
      {/* ── Queue ─────────────────────────────────────────────────── */}
      <div
        className={clsx(
          "flex min-h-0 flex-col border-line lg:border-r",
          selected ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="no-scrollbar flex overflow-x-auto border-b border-line">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => {
                setView(v.key);
                setSelectedId(null);
              }}
              className={clsx(
                "-mb-px flex h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs transition-colors",
                view === v.key
                  ? "border-fg text-fg"
                  : "border-transparent text-fg-3 hover:text-fg",
              )}
            >
              {v.label}
              <span className="font-mono text-[10px] tabular-nums">
                {counts[v.key]}
              </span>
            </button>
          ))}
        </div>
        {visible.length === 0 ? (
          <div className="px-5">
            <EmptyState title="Nothing here">
              {view === "todo"
                ? "No requests are waiting for a quote."
                : "No requests in this view."}
            </EmptyState>
          </div>
        ) : (
          <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
            {visible.map((r) => {
              const s = STATUS[r.status] ?? {
                label: r.status,
                tone: "neutral" as Tone,
              };
              const active = desktopSelected?.id === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={clsx(
                      "flex w-full flex-col gap-1 px-4 py-3.5 text-left transition-colors",
                      active ? "lg:bg-plate" : "hover:bg-plate/60",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-fg">
                        {r.customerName}
                      </span>
                      <span className="shrink-0 text-[11px] text-fg-3">
                        {timeAgo(new Date(r.createdAt))}
                      </span>
                    </div>
                    <span className="truncate text-sm text-fg-2">
                      {r.title}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusPill tone={s.tone}>{s.label}</StatusPill>
                      {r.quotedAmount ? (
                        <span className="text-xs tabular-nums text-fg-3">
                          {money(r.quotedAmount)}
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Detail ────────────────────────────────────────────────── */}
      <div
        className={clsx(
          "min-h-0 overflow-y-auto",
          selected ? "block" : "hidden lg:block",
        )}
      >
        {desktopSelected ? (
          <RequestDetail
            key={desktopSelected.id}
            request={desktopSelected}
            onBack={() => setSelectedId(null)}
            onChanged={refresh}
          />
        ) : (
          <div className="grid h-full place-items-center p-10 text-sm text-fg-3">
            Select a request
          </div>
        )}
      </div>
    </div>
  );
}

function RequestDetail({
  request: r,
  onBack,
  onChanged,
}: {
  request: RequestItem;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState(r.adminNotes ?? "");
  const [amount, setAmount] = useState(
    r.quotedAmount ? String(r.quotedAmount) : "",
  );
  const [note, setNote] = useState("");
  const [days, setDays] = useState("7");
  const s = STATUS[r.status] ?? { label: r.status, tone: "neutral" as Tone };
  const phone = intlPhone(r.phone);
  const canQuote = [
    "submitted",
    "under_review",
    "quoted",
    "awaiting_payment",
  ].includes(r.status);
  const open = !["completed", "cancelled", "rejected"].includes(r.status);

  async function call(
    url: string,
    method: string,
    body: unknown,
    label: string,
    success: string,
  ) {
    setBusy(label);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      toast.success(success);
      onChanged();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(null);
    }
  }

  const setStatus = (status: string, success: string) =>
    call(
      `/api/admin/custom-order-requests/${r.id}`,
      "PUT",
      { status },
      status,
      success,
    );

  const sendQuote = async () => {
    const value = Number(amount.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(value) || value <= 0)
      return toast.error("Enter the price in naira");
    const expiresAt = new Date(
      Date.now() + Number(days) * 86_400_000,
    ).toISOString();
    if (
      !window.confirm(
        `Send a quote of ${money(value)} to ${r.customerName}? They'll get an email with a link to pay.`,
      )
    )
      return;
    const ok = await call(
      `/api/admin/custom-order-requests/${r.id}/quotes`,
      "POST",
      { amount: value, currencyCode: "NGN", note, expiresAt },
      "quote",
      "Quote sent",
    );
    if (ok) setNote("");
  };

  const budget =
    r.budgetMin || r.budgetMax
      ? r.budgetMin && r.budgetMax
        ? `${money(r.budgetMin)} – ${money(r.budgetMax)}`
        : r.budgetMax
          ? `Up to ${money(r.budgetMax)}`
          : `From ${money(r.budgetMin!)}`
      : null;

  return (
    <article className="p-5 sm:p-6">
      <button
        type="button"
        onClick={onBack}
        className="label mb-4 inline-flex items-center gap-1.5 text-fg-3 hover:text-fg lg:hidden"
      >
        <ArrowLeft className="size-3.5" /> All requests
      </button>

      <header className="mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="label text-fg-3">
            {r.requestNumber} · {shortDate(new Date(r.createdAt))}
          </p>
          <h2 className="mt-2 font-head text-3xl font-extrabold uppercase leading-none [font-stretch:66%]">
            {r.title}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill tone={s.tone}>{s.label}</StatusPill>
            {r.convertedOrderId ? (
              <Link
                href={`/admin/orders/${r.convertedOrderId}`}
                className="label text-fg underline"
              >
                View order →
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {r.status === "submitted" ? (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => setStatus("under_review", "Marked as reviewing")}
              className={buttonClass("outline", "md")}
            >
              Start review
            </button>
          ) : null}
          {r.status === "paid" ? (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => setStatus("in_production", "Moved to production")}
              className={buttonClass("solid", "md")}
            >
              <Hammer className="size-4" /> Start production
            </button>
          ) : null}
          {r.status === "in_production" ? (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => setStatus("completed", "Marked as completed")}
              className={buttonClass("solid", "md")}
            >
              <Check className="size-4" /> Mark completed
            </button>
          ) : null}
          {open && !["paid", "in_production"].includes(r.status) ? (
            <button
              type="button"
              disabled={!!busy}
              onClick={() =>
                window.confirm(
                  "Decline this request? The customer isn't emailed automatically, so let them know.",
                ) && setStatus("rejected", "Request declined")
              }
              className={buttonClass(
                "outline",
                "md",
                "hover:!border-red-600 hover:!bg-red-600 hover:!text-white",
              )}
            >
              <X className="size-4" /> Decline
            </button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-8">
          <section>
            <h3 className="label mb-2 text-fg-3">What they want</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-fg">
              {r.description}
            </p>
            {r.referenceImages.length ? (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {r.referenceImages.map((src, i) => (
                  <a
                    key={src + i}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative aspect-square overflow-hidden bg-plate"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- customer uploads come from arbitrary hosts */}
                    <img
                      src={src}
                      alt={`Reference ${i + 1}`}
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            ) : null}
            <StatList>
              {r.sizeNotes ? (
                <StatRow label="Size" value={r.sizeNotes} />
              ) : null}
              {r.colorPreferences ? (
                <StatRow label="Colours" value={r.colorPreferences} />
              ) : null}
              {budget ? <StatRow label="Budget" value={budget} /> : null}
              {r.desiredDate ? (
                <StatRow
                  label="Needed by"
                  value={shortDate(new Date(r.desiredDate))}
                />
              ) : null}
            </StatList>
            {r.customerNotes ? (
              <p className="mt-3 border-l-2 border-line pl-3 text-sm text-fg-2">
                “{r.customerNotes}”
              </p>
            ) : null}
          </section>

          {canQuote ? (
            <section className="border border-line p-5">
              <h3 className="text-[15px] font-semibold">
                {r.quotes.length ? "Send a new quote" : "Send a quote"}
              </h3>
              <p className="mt-1 text-xs text-fg-3">
                {r.quotes.length ? "Replaces the current quote. " : ""}The
                customer gets an email with a link to accept and pay.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                <label className="block">
                  <span className="label mb-1.5 block text-fg-3">
                    Price (₦)
                  </span>
                  <input
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="45000"
                    className="h-11 w-full border border-line bg-canvas px-3 font-head text-xl font-bold tabular-nums outline-none focus:border-fg"
                  />
                </label>
                <label className="block">
                  <span className="label mb-1.5 block text-fg-3">
                    Valid for
                  </span>
                  <select
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="h-11 w-full border border-line bg-canvas px-3 text-sm outline-none focus:border-fg"
                  >
                    {["3", "7", "14", "30"].map((d) => (
                      <option key={d} value={d}>
                        {d} days
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="mt-3 block">
                <span className="label mb-1.5 block text-fg-3">
                  Message to the customer
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="What's included, materials, how long it takes…"
                  className="w-full border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-fg"
                />
              </label>
              <button
                type="button"
                disabled={!!busy || !amount}
                onClick={sendQuote}
                className={buttonClass("solid", "md", "mt-4")}
              >
                {busy === "quote" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Send quote
                {amount && Number(amount) > 0
                  ? ` · ${money(Number(amount))}`
                  : ""}
              </button>
            </section>
          ) : null}

          {r.quotes.length ? (
            <section>
              <h3 className="label mb-2 text-fg-3">Quotes</h3>
              <ol className="divide-y divide-line border-y border-line">
                {r.quotes.map((q) => {
                  const qs = QUOTE_STATUS[q.status] ?? {
                    label: q.status,
                    tone: "neutral" as Tone,
                  };
                  const expired =
                    q.expiresAt && new Date(q.expiresAt).getTime() < Date.now();
                  return (
                    <li
                      key={q.id}
                      className="flex flex-wrap items-start justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium tabular-nums">
                          {money(q.amount)}{" "}
                          <span className="font-normal text-fg-3">
                            · v{q.version}
                          </span>
                        </p>
                        <p className="text-xs text-fg-3">
                          Sent {shortDate(new Date(q.createdAt))}
                          {q.createdBy ? ` by ${q.createdBy}` : ""}
                          {q.expiresAt
                            ? ` · ${expired ? "expired" : "expires"} ${shortDate(new Date(q.expiresAt))}`
                            : ""}
                        </p>
                        {q.note ? (
                          <p className="mt-1 text-xs text-fg-2">{q.note}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill tone={qs.tone}>{qs.label}</StatusPill>
                        {q.status === "sent" ? (
                          <button
                            type="button"
                            disabled={!!busy}
                            onClick={() =>
                              call(
                                `/api/admin/custom-order-quotes/${q.id}`,
                                "PUT",
                                { status: "expired" },
                                `q-${q.id}`,
                                "Quote withdrawn",
                              )
                            }
                            className="label text-fg-3 hover:text-fg"
                          >
                            Withdraw
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section>
            <h3 className="label mb-2 text-fg-3">Customer</h3>
            <p className="text-sm font-medium">{r.customerName}</p>
            <div className="mt-2 space-y-2 text-sm">
              <a
                href={`mailto:${r.email}`}
                className="flex items-center gap-2.5 text-fg-2 hover:text-fg"
              >
                <Mail className="size-4 text-fg-3" />{" "}
                <span className="truncate">{r.email}</span>
              </a>
              {phone ? (
                <>
                  <a
                    href={`tel:+${phone}`}
                    className="flex items-center gap-2.5 text-fg-2 hover:text-fg"
                  >
                    <Phone className="size-4 text-fg-3" /> +{phone}
                  </a>
                  <a
                    href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${r.customerName.split(" ")[0]}, it's D'FOOTPRINT about your custom request ${r.requestNumber}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 text-fg-2 hover:text-fg"
                  >
                    <MessageCircle className="size-4 text-fg-3" /> WhatsApp
                  </a>
                </>
              ) : null}
            </div>
            <Link
              href={`/admin/users/${encodeURIComponent(r.email.toLowerCase())}`}
              className="label mt-3 inline-block text-fg-3 hover:text-fg"
            >
              Customer profile →
            </Link>
          </section>

          <section>
            <h3 className="label mb-2 text-fg-3">Internal notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Measurements, leather choice, who's making it…"
              className="w-full border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-fg"
            />
            <button
              type="button"
              disabled={!!busy || notes === (r.adminNotes ?? "")}
              onClick={() =>
                call(
                  `/api/admin/custom-order-requests/${r.id}`,
                  "PUT",
                  { adminNotes: notes },
                  "notes",
                  "Notes saved",
                )
              }
              className={buttonClass(
                notes === (r.adminNotes ?? "") ? "outline" : "solid",
                "md",
                "mt-2 w-full",
              )}
            >
              {busy === "notes" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {notes === (r.adminNotes ?? "") ? "Saved" : "Save notes"}
            </button>
          </section>

          {r.paidAt ? (
            <p className="text-xs text-fg-3">
              Paid {shortDate(new Date(r.paidAt))}
            </p>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
