"use client";

import clsx from "clsx";
import {
  Page,
  Panel,
  StatList,
  StatRow,
  StatusPill,
  type Tone,
} from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import { Sheet } from "components/ui/sheet";
import { money, shortDate, timeAgo } from "lib/admin/format";
import {
  depositFor,
  type CustomOrderSettings,
  type QuoteLine,
} from "lib/custom-orders/shared";
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
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  BUDGET,
  CLOSED,
  DEADLINE,
  KIND,
  QUOTE_STATUS,
  intlPhone,
  statusOf,
  type RequestItem,
} from "./meta";

/** What the shop should do next, shown under the status. */
const NEXT_STEP: Record<string, string> = {
  submitted: "Reply with a question, or send a price.",
  under_review: "Reply with a question, or send a price.",
  needs_info: "Waiting for the customer to answer your question.",
  quoted: "Waiting for the customer to pay. You can send a new price if things change.",
  awaiting_payment: "The customer started paying but it hasn't come through yet.",
  paid: "Paid — start production when you begin making it.",
  in_production: "When the pair is finished, ask for the balance (or mark it completed).",
  balance_due: "Waiting for the customer to pay the balance.",
  ready: "Fully paid — send it out and mark it completed.",
};

const input =
  "h-10 w-full border border-line bg-canvas px-3 text-sm outline-none focus:border-fg";

export function RequestDetail({
  request: r,
  settings,
}: {
  request: RequestItem;
  settings: CustomOrderSettings;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const s = statusOf(r.status);
  const open = !CLOSED.includes(r.status);
  const canQuote = [
    "submitted",
    "under_review",
    "needs_info",
    "quoted",
    "awaiting_payment",
  ].includes(r.status);
  const canDecline =
    open && !["paid", "in_production", "balance_due", "ready"].includes(r.status);
  const refresh = () => startTransition(() => router.refresh());

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
      refresh();
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

  const decline = async () => {
    const reason = window.prompt(
      "Decline this request? Tell the customer why — they'll get this by email.",
      "Sorry, we can't make this one well. ",
    );
    if (!reason?.trim()) return;
    const sent = await call(
      `/api/admin/custom-order-requests/${r.id}/messages`,
      "POST",
      { body: reason.trim() },
      "rejected",
      "Message sent",
    );
    if (sent) await setStatus("rejected", "Request declined");
  };

  // One obvious next action per stage; everything else is secondary.
  const spin = (label: string) =>
    busy === label ? <Loader2 className="size-4 animate-spin" /> : null;
  let primary: React.ReactNode = null;
  if (canQuote)
    primary = (
      <button
        type="button"
        onClick={() => setQuoting(true)}
        className={buttonClass(
          ["quoted", "awaiting_payment"].includes(r.status) ? "outline" : "solid",
          "md",
        )}
      >
        <Send className="size-4" />
        {r.quotes.length ? "Send a new price" : "Send a price"}
      </button>
    );
  else if (r.status === "paid")
    primary = (
      <button
        type="button"
        disabled={!!busy}
        onClick={() => setStatus("in_production", "Moved to production")}
        className={buttonClass("solid", "md")}
      >
        {spin("in_production") ?? <Hammer className="size-4" />} Start production
      </button>
    );
  else if (r.status === "in_production" && r.balanceDue > 0)
    primary = (
      <button
        type="button"
        disabled={!!busy}
        onClick={() => {
          if (
            window.confirm(
              `Tell ${r.customerName} their pair is ready and ask for the ${money(r.balanceDue)} balance?`,
            )
          )
            void setStatus("balance_due", "Balance requested");
        }}
        className={buttonClass("solid", "md")}
      >
        {spin("balance_due") ?? <Send className="size-4" />} Ready — request{" "}
        {money(r.balanceDue)}
      </button>
    );
  else if (r.status === "in_production" || r.status === "ready")
    primary = (
      <button
        type="button"
        disabled={!!busy}
        onClick={() => setStatus("completed", "Marked as completed")}
        className={buttonClass("solid", "md")}
      >
        {spin("completed") ?? <Check className="size-4" />} Mark completed
      </button>
    );

  return (
    <Page>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="mb-8 border-b border-line pb-6">
        <Link
          href="/admin/custom-order-requests"
          className="label mb-4 inline-flex items-center gap-1.5 text-fg-3 hover:text-fg"
        >
          <ArrowLeft className="size-3.5" /> Custom requests
        </Link>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="label text-fg-3">
              {r.requestNumber} · {shortDate(new Date(r.createdAt))} ·{" "}
              {KIND[r.kind] ?? "Custom"}
            </p>
            <h1 className="mt-2 font-head text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold uppercase leading-[0.95] [font-stretch:66%]">
              {r.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <StatusPill tone={s.tone}>{s.label}</StatusPill>
              {NEXT_STEP[r.status] ? (
                <span className="text-sm text-fg-2">{NEXT_STEP[r.status]}</span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {r.status === "submitted" ? (
              <button
                type="button"
                disabled={!!busy}
                onClick={() => setStatus("under_review", "Marked as reviewing")}
                className="label px-2 text-fg-3 hover:text-fg"
              >
                Mark as reviewing
              </button>
            ) : null}
            {canDecline ? (
              <button
                type="button"
                disabled={!!busy}
                onClick={decline}
                className={buttonClass(
                  "outline",
                  "md",
                  "hover:!border-red-600 hover:!bg-red-600 hover:!text-white",
                )}
              >
                {spin("rejected") ?? <X className="size-4" />} Decline
              </button>
            ) : null}
            {primary}
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Main: what they want, then the conversation ───────────── */}
        <div className="min-w-0 space-y-6">
          <Spec request={r} />
          <AdminThread request={r} onChanged={refresh} />
        </div>

        {/* ── Side: money, customer, notes ─────────────────────────── */}
        <div className="min-w-0 space-y-6">
          <PricePanel
            request={r}
            busy={busy}
            canQuote={canQuote}
            onQuote={() => setQuoting(true)}
            onWithdraw={(id) =>
              call(
                `/api/admin/custom-order-quotes/${id}`,
                "PUT",
                { status: "expired" },
                `q-${id}`,
                "Quote withdrawn",
              )
            }
          />
          <CustomerPanel request={r} />
          <NotesPanel
            request={r}
            busy={busy}
            onSave={(adminNotes) =>
              call(
                `/api/admin/custom-order-requests/${r.id}`,
                "PUT",
                { adminNotes },
                "notes",
                "Notes saved",
              )
            }
          />
        </div>
      </div>

      {canQuote ? (
        <QuoteSheet
          key={r.quotes[0]?.id ?? "new"}
          open={quoting}
          onClose={() => setQuoting(false)}
          request={r}
          settings={settings}
          onSent={() => {
            setQuoting(false);
            refresh();
          }}
        />
      ) : null}
    </Page>
  );
}

// ─── What they want ───────────────────────────────────────────────────────────

function Spec({ request: r }: { request: RequestItem }) {
  const budget =
    r.budgetMin || r.budgetMax
      ? r.budgetMin && r.budgetMax
        ? `${money(r.budgetMin)} – ${money(r.budgetMax)}`
        : r.budgetMax
          ? `Up to ${money(r.budgetMax)}`
          : `From ${money(r.budgetMin!)}`
      : null;

  return (
    <Panel title="What they want">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          {r.baseProduct ? (
            <a
              href={`/product/${r.baseProduct.handle}`}
              target="_blank"
              rel="noreferrer"
              className="mb-4 flex items-center gap-3 border border-line p-3 hover:border-fg"
            >
              <div className="size-14 shrink-0 overflow-hidden bg-plate">
                {r.baseProduct.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- product image thumbnail
                  <img src={r.baseProduct.image} alt="" className="size-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="label text-fg-3">Based on</p>
                <p className="truncate font-medium">{r.baseProduct.title}</p>
              </div>
            </a>
          ) : null}
          {r.edits.length ? (
            <ul className="mb-4 divide-y divide-line border-y border-line text-sm">
              {r.edits.map((e) => (
                <li key={e.id} className="flex justify-between gap-4 py-2">
                  <span>
                    {e.name}
                    {e.detail ? <span className="text-fg-2"> — {e.detail}</span> : null}
                  </span>
                  <span className="shrink-0 tabular-nums text-fg-3">
                    {e.needsReview ? "to price" : e.price ? money(e.price) : "free"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {r.customerNotes ? (
            <p className="whitespace-pre-line border-l-2 border-line pl-3 text-sm leading-relaxed text-fg">
              {r.customerNotes}
            </p>
          ) : !r.edits.length ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-fg">
              {r.description}
            </p>
          ) : null}
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
                  {/* eslint-disable-next-line @next/next/no-img-element -- customer uploads */}
                  <img
                    src={src}
                    alt={`Reference ${i + 1}`}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          ) : null}
          {r.referenceLinks.length ? (
            <ul className="mt-3 space-y-1 text-sm">
              {r.referenceLinks.map((l) => (
                <li key={l}>
                  <a href={l} target="_blank" rel="noreferrer nofollow" className="block truncate underline">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <StatList>
          <StatRow
            label="Size"
            value={
              r.sizeEu
                ? `EU ${r.sizeEu}${r.footLengthCm ? ` · ${r.footLengthCm} cm` : ""}`
                : (r.sizeNotes ?? "To confirm")
            }
          />
          <StatRow label="Pairs" value={String(r.pairs)} />
          {r.colorPreferences ? <StatRow label="Colours" value={r.colorPreferences} /> : null}
          {r.budgetBand ? (
            <StatRow label="Budget" value={BUDGET[r.budgetBand] ?? r.budgetBand} />
          ) : budget ? (
            <StatRow label="Budget" value={budget} />
          ) : null}
          {r.deadlineKind || r.desiredDate ? (
            <StatRow
              label="Needed"
              value={
                r.desiredDate && r.deadlineKind !== "no_rush"
                  ? `By ${shortDate(new Date(r.desiredDate))}`
                  : (DEADLINE[r.deadlineKind ?? ""] ?? "—")
              }
            />
          ) : null}
          {r.estimateAmount ? (
            <StatRow
              label="Estimate"
              value={`${r.edits.some((e) => e.needsReview) || r.customerNotes ? "from " : ""}${money(r.estimateAmount)}`}
            />
          ) : null}
        </StatList>
      </div>
    </Panel>
  );
}

// ─── Price ────────────────────────────────────────────────────────────────────

function PricePanel({
  request: r,
  busy,
  canQuote,
  onQuote,
  onWithdraw,
}: {
  request: RequestItem;
  busy: string | null;
  canQuote: boolean;
  onQuote: () => void;
  onWithdraw: (quoteId: string) => void;
}) {
  const [current, ...earlier] = r.quotes;

  return (
    <Panel title="Price" bodyClassName="p-0">
      {current ? (
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-head text-4xl font-extrabold tabular-nums [font-stretch:66%]">
              {money(current.amount)}
            </p>
            <QuotePill status={current.status} />
          </div>
          {current.depositAmount ? (
            <p className="mt-1 text-sm text-fg-2">
              Deposit {money(current.depositAmount)}, rest when ready
            </p>
          ) : null}
          {current.lines.length ? (
            <ul className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
              {current.lines.map((l, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-fg-2">{l.label}</span>
                  <span className="shrink-0 tabular-nums">{money(l.amount)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-xs text-fg-3">
            v{current.version} · sent {shortDate(new Date(current.createdAt))}
            {current.expiresAt
              ? ` · ${new Date(current.expiresAt).getTime() < Date.now() ? "expired" : "held until"} ${shortDate(new Date(current.expiresAt))}`
              : ""}
          </p>
          {current.note ? (
            <p className="mt-2 whitespace-pre-line text-xs text-fg-2">{current.note}</p>
          ) : null}
          {r.convertedOrderId ? (
            <div className="mt-4 border-t border-line pt-3">
              {r.balanceDue > 0 ? (
                <p className="text-sm">
                  <span className="font-medium">{money(r.balanceDue)}</span>{" "}
                  <span className="text-fg-2">left to pay</span>
                </p>
              ) : (
                <p className="text-sm text-fg-2">Paid in full</p>
              )}
              <Link
                href={`/admin/orders/${r.convertedOrderId}`}
                className="label mt-2 inline-block text-fg underline"
              >
                View order →
              </Link>
            </div>
          ) : null}
          {current.status === "sent" ? (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => onWithdraw(current.id)}
              className="label mt-4 text-fg-3 hover:text-fg"
            >
              Withdraw this price
            </button>
          ) : null}
        </div>
      ) : (
        <div className="p-5">
          <p className="text-sm text-fg-2">No price sent yet.</p>
          {r.estimateAmount ? (
            <p className="mt-1 text-xs text-fg-3">
              Their choices come to about {money(r.estimateAmount)}.
            </p>
          ) : null}
          {canQuote ? (
            <button
              type="button"
              onClick={onQuote}
              className={buttonClass("solid", "md", "mt-4 w-full")}
            >
              <Send className="size-4" /> Send a price
            </button>
          ) : null}
        </div>
      )}
      {earlier.length ? (
        <details className="border-t border-line">
          <summary className="label cursor-pointer px-5 py-3 text-fg-3 hover:text-fg">
            Earlier prices ({earlier.length})
          </summary>
          <ol className="divide-y divide-line border-t border-line">
            {earlier.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                <span className="text-sm tabular-nums">
                  {money(q.amount)}{" "}
                  <span className="text-xs text-fg-3">
                    v{q.version} · {shortDate(new Date(q.createdAt))}
                  </span>
                </span>
                <QuotePill status={q.status} />
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </Panel>
  );
}

function QuotePill({ status }: { status: string }) {
  const qs = QUOTE_STATUS[status] ?? { label: status, tone: "neutral" as Tone };
  return <StatusPill tone={qs.tone}>{qs.label}</StatusPill>;
}

type DraftLine = { label: string; amount: string };

/**
 * Starting lines for a quote: the last quote's lines, or the customer's
 * estimate (base design + chosen edits + large size, per pair), or one line.
 */
function initialLines(r: RequestItem, settings: CustomOrderSettings): DraftLine[] {
  const last = r.quotes[0];
  if (last?.lines.length)
    return last.lines.map((l) => ({ label: l.label, amount: String(l.amount) }));
  if (!r.estimateAmount)
    return [{ label: "Custom pair", amount: r.quotedAmount ? String(r.quotedAmount) : "" }];
  const pairs = Math.max(1, r.pairs);
  const large =
    r.sizeEu && r.sizeEu >= settings.largeSizeFrom ? settings.largeSizeSurcharge : 0;
  const perPair: QuoteLine[] = [
    ...r.edits.map((e) => ({ label: e.name, amount: e.price })),
    ...(large ? [{ label: `Size ${settings.largeSizeFrom}+`, amount: large }] : []),
  ];
  const base = r.estimateAmount / pairs - perPair.reduce((sum, l) => sum + l.amount, 0);
  const each = pairs > 1 ? ` (×${pairs})` : "";
  return [{ label: r.baseProduct?.title ?? "Base design", amount: base }, ...perPair]
    .filter((l) => l.amount > 0)
    .map((l) => ({ label: l.label + each, amount: String(Math.round(l.amount * pairs)) }));
}

/** The price builder, in a drawer so the request stays in view behind it. */
function QuoteSheet({
  open,
  onClose,
  request: r,
  settings,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  request: RequestItem;
  settings: CustomOrderSettings;
  onSent: () => void;
}) {
  const [lines, setLines] = useState<DraftLine[]>(() => initialLines(r, settings));
  const [withDeposit, setWithDeposit] = useState(settings.depositPercent < 100);
  const [note, setNote] = useState("");
  const [days, setDays] = useState("7");
  const [sending, setSending] = useState(false);

  const toNumber = (v: string) => Number(v.replace(/[^\d.-]/g, "")) || 0;
  const pricedLines = lines
    .map((l) => ({ label: l.label.trim(), amount: Math.round(toNumber(l.amount)) }))
    .filter((l) => l.label && l.amount);
  const total = pricedLines.reduce((sum, l) => sum + l.amount, 0);
  const deposit = withDeposit ? depositFor(total, settings.depositPercent) : null;
  const setLine = (i: number, patch: Partial<DraftLine>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const send = async () => {
    if (lines.some((l) => l.amount.trim() && !l.label.trim()))
      return toast.error("Give every priced line a name");
    if (total <= 0) return toast.error("Enter the price in naira");
    if (
      !window.confirm(
        `Send a price of ${money(total)}${deposit ? ` (deposit ${money(deposit)})` : ""} to ${r.customerName}? They'll get an email with a link to pay.`,
      )
    )
      return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/custom-order-requests/${r.id}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: pricedLines,
          deposit: !!deposit,
          currencyCode: "NGN",
          note,
          expiresAt: new Date(Date.now() + Number(days) * 86_400_000).toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't send the price");
      toast.success("Price sent — the customer has been emailed");
      setNote("");
      onSent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send the price");
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={r.quotes.length ? "Send a new price" : "Send a price"}
      footer={
        <button
          type="button"
          disabled={sending || total <= 0}
          onClick={send}
          className={buttonClass("solid", "lg", "w-full")}
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Send {total > 0 ? money(total) : "price"}
        </button>
      }
    >
      <p className="text-xs text-fg-3">
        {r.quotes.length ? "Replaces the current price. " : ""}
        {r.estimateAmount && !r.quotes.length
          ? "Filled in from their choices — change, remove or add lines. "
          : ""}
        Delivery is added when they pay.
      </p>

      <div className="mt-5">
        <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_104px_28px] gap-2">
          <span className="label text-fg-3">Item</span>
          <span className="label text-right text-fg-3">₦</span>
        </div>
        <ul className="space-y-2">
          {lines.map((l, i) => (
            <li key={i} className="grid grid-cols-[minmax(0,1fr)_104px_28px] gap-2">
              <input
                value={l.label}
                onChange={(e) => setLine(i, { label: e.target.value })}
                placeholder="e.g. Hand-stitched roses"
                aria-label="Item"
                className={input}
              />
              <input
                inputMode="numeric"
                value={l.amount}
                onChange={(e) => setLine(i, { amount: e.target.value })}
                placeholder="0"
                aria-label="Price"
                className={clsx(input, "text-right tabular-nums")}
              />
              <button
                type="button"
                onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                disabled={lines.length === 1}
                aria-label="Remove line"
                className="grid h-10 place-items-center text-fg-3 hover:text-fg disabled:opacity-30"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setLines((ls) => [...ls, { label: "", amount: "" }])}
          className="label mt-3 text-fg-3 hover:text-fg"
        >
          + Add line
        </button>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-sm font-semibold">Total</span>
          <span className="font-head text-2xl font-extrabold tabular-nums [font-stretch:75%]">
            {money(total)}
          </span>
        </div>
      </div>

      <label className="mt-5 flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={withDeposit}
          onChange={(e) => setWithDeposit(e.target.checked)}
          disabled={settings.depositPercent >= 100}
          className="mt-0.5 size-4"
        />
        <span>
          Take a {settings.depositPercent}% deposit
          {deposit ? ` (${money(deposit)})` : ""}
          <span className="block text-xs text-fg-3">
            They can still choose to pay everything at once.
          </span>
        </span>
      </label>

      <label className="mt-5 block">
        <span className="label mb-1.5 block text-fg-3">Price is held for</span>
        <select value={days} onChange={(e) => setDays(e.target.value)} className={input}>
          {["3", "7", "14", "30"].map((d) => (
            <option key={d} value={d}>
              {d} days
            </option>
          ))}
        </select>
      </label>

      <label className="mt-5 block">
        <span className="label mb-1.5 block text-fg-3">Message to the customer</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="What's included, materials, how long it takes…"
          className="w-full border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-fg"
        />
      </label>
    </Sheet>
  );
}

// ─── Customer & notes ─────────────────────────────────────────────────────────

function CustomerPanel({ request: r }: { request: RequestItem }) {
  const phone = intlPhone(r.phone);
  return (
    <Panel title="Customer">
      <p className="text-sm font-medium">{r.customerName}</p>
      <div className="mt-2 space-y-2 text-sm">
        <a href={`mailto:${r.email}`} className="flex items-center gap-2.5 text-fg-2 hover:text-fg">
          <Mail className="size-4 shrink-0 text-fg-3" />
          <span className="truncate">{r.email}</span>
        </a>
        {phone ? (
          <>
            <a href={`tel:+${phone}`} className="flex items-center gap-2.5 text-fg-2 hover:text-fg">
              <Phone className="size-4 shrink-0 text-fg-3" /> +{phone}
            </a>
            <a
              href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${r.customerName.split(" ")[0]}, it's D'FOOTPRINT about your custom request ${r.requestNumber}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 text-fg-2 hover:text-fg"
            >
              <MessageCircle className="size-4 shrink-0 text-fg-3" /> WhatsApp
            </a>
          </>
        ) : null}
      </div>
      <Link
        href={`/admin/users/${encodeURIComponent(r.email.toLowerCase())}`}
        className="label mt-4 inline-block text-fg-3 hover:text-fg"
      >
        Customer profile →
      </Link>
    </Panel>
  );
}

function NotesPanel({
  request: r,
  busy,
  onSave,
}: {
  request: RequestItem;
  busy: string | null;
  onSave: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(r.adminNotes ?? "");
  const saved = notes === (r.adminNotes ?? "");
  return (
    <Panel title="Internal notes" description="Only the team sees these.">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        placeholder="Measurements, leather choice, who's making it…"
        className="w-full border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-fg"
      />
      <button
        type="button"
        disabled={!!busy || saved}
        onClick={() => onSave(notes)}
        className={buttonClass(saved ? "outline" : "solid", "md", "mt-2 w-full")}
      >
        {busy === "notes" ? <Loader2 className="size-4 animate-spin" /> : null}
        {saved ? "Saved" : "Save notes"}
      </button>
    </Panel>
  );
}

// ─── Conversation ─────────────────────────────────────────────────────────────

const CANNED = [
  "Thanks! Could you send a photo of the pair from the side and from above?",
  "Could you confirm your size, or measure your foot length in cm?",
  "We can make this. It takes about 7–10 days once you've paid.",
];

function AdminThread({
  request: r,
  onChanged,
}: {
  request: RequestItem;
  onChanged: () => void;
}) {
  const [text, setText] = useState("");
  const [ask, setAsk] = useState(false);
  const [sending, setSending] = useState(false);
  const closed = CLOSED.includes(r.status);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/custom-order-requests/${r.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, askQuestion: ask }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't send");
      toast.success("Sent — the customer has been emailed");
      setText("");
      setAsk(false);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send");
    } finally {
      setSending(false);
    }
  };

  return (
    <Panel title="Conversation" description="Messages are emailed to the customer and shown on their request page.">
      {r.messages.length ? (
        <ol className="space-y-3">
          {r.messages.map((m) =>
            m.author === "system" ? (
              <li key={m.id} className="text-center text-xs text-fg-3">
                {m.body} · {timeAgo(new Date(m.createdAt))}
              </li>
            ) : (
              <li
                key={m.id}
                className={clsx(
                  "flex flex-col",
                  m.author === "admin" ? "items-end" : "items-start",
                )}
              >
                <div
                  className={clsx(
                    "max-w-[85%] p-3 text-sm leading-relaxed",
                    m.author === "admin" ? "bg-fg text-canvas" : "bg-plate",
                  )}
                >
                  <p className="whitespace-pre-line break-words">{m.body}</p>
                  {m.attachments.length ? (
                    <div className="mt-2 grid grid-cols-3 gap-1">
                      {m.attachments.map((src) => (
                        <a
                          key={src}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="block aspect-square overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- customer upload */}
                          <img src={src} alt="" className="size-full object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
                <span className="mt-1 text-[11px] text-fg-3">
                  {m.author === "admin" ? (m.authorName ?? "You") : r.customerName} ·{" "}
                  {timeAgo(new Date(m.createdAt))}
                </span>
              </li>
            ),
          )}
        </ol>
      ) : (
        <p className="text-sm text-fg-3">
          No messages yet. Ask a question or send a price — the customer is
          emailed either way.
        </p>
      )}
      {closed ? null : (
        <div className="mt-5 border border-line p-3">
          <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
            {CANNED.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setText(c)}
                className="shrink-0 border border-line px-2 py-1 text-[11px] text-fg-2 hover:border-fg hover:text-fg"
              >
                {c.length > 38 ? `${c.slice(0, 38)}…` : c}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={`Message ${r.customerName.split(" ")[0]}…`}
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-fg-3"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-fg-2">
              <input
                type="checkbox"
                checked={ask}
                onChange={(e) => setAsk(e.target.checked)}
                className="size-4"
              />
              This is a question — wait for their reply
            </label>
            <button
              type="button"
              disabled={sending || !text.trim()}
              onClick={send}
              className={buttonClass("solid", "md")}
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Send
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}
