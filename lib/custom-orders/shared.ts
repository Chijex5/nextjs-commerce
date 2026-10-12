/**
 * Custom orders: types, choices and pricing shared by the request form (in
 * the browser) and the API (on the server), so the estimate a customer sees
 * is the one we store. Pure TypeScript — no server imports.
 */

export type CustomKind = "modify" | "recreate" | "new";

export type EditOption = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  detailPrompt: string | null;
  needsReview: boolean;
};

/** An edit as chosen by the customer and stored on the request. */
export type ChosenEdit = {
  id: string;
  name: string;
  price: number;
  needsReview: boolean;
  detail?: string;
};

export type CustomOrderSettings = {
  /** Share of the quote paid up front to start production. */
  depositPercent: number;
  /** EU sizes from this one up cost `largeSizeSurcharge` more per pair. */
  largeSizeFrom: number;
  largeSizeSurcharge: number;
  /** Shown to customers: "We reply within 24 hours". */
  replyHours: number;
  /** A progress photo counts as approved after this many hours of silence. */
  photoAutoApproveHours: number;
};

export const DEFAULT_SETTINGS: CustomOrderSettings = {
  depositPercent: 50,
  largeSizeFrom: 43,
  largeSizeSurcharge: 2000,
  replyHours: 24,
  photoAutoApproveHours: 48,
};

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

/** Accepts untrusted input and returns valid settings (defaults fill gaps). */
export function normaliseSettings(input: unknown): CustomOrderSettings {
  const v = (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;
  const d = DEFAULT_SETTINGS;
  return {
    depositPercent: clamp(v.depositPercent, 10, 100, d.depositPercent),
    largeSizeFrom: clamp(v.largeSizeFrom, 36, 60, d.largeSizeFrom),
    largeSizeSurcharge: clamp(v.largeSizeSurcharge, 0, 1_000_000, d.largeSizeSurcharge),
    replyHours: clamp(v.replyHours, 1, 168, d.replyHours),
    photoAutoApproveHours: clamp(v.photoAutoApproveHours, 1, 336, d.photoAutoApproveHours),
  };
}

export const KINDS: Array<{
  key: CustomKind;
  title: string;
  body: string;
}> = [
  {
    key: "modify",
    title: "Change one of our designs",
    body: "Pick a pair you like and tell us what to change — colour, strap, details, size.",
  },
  {
    key: "recreate",
    title: "Make it from a photo",
    body: "Seen a pair online? Send the photo or link and we'll tell you if we can make it.",
  },
  {
    key: "new",
    title: "Something new",
    body: "Have an idea of your own? Describe it and we'll work it out with you.",
  },
];

export const KIND_LABEL: Record<CustomKind, string> = {
  modify: "Change a design",
  recreate: "From a photo",
  new: "New idea",
};

export const STYLES = ["Slippers", "Slides", "Palm slippers", "Other"];

/** EU sizes we make, with the usual UK equivalent. */
export const SIZES: Array<{ eu: number; uk: string }> = [
  { eu: 36, uk: "3.5" },
  { eu: 37, uk: "4" },
  { eu: 38, uk: "5" },
  { eu: 39, uk: "6" },
  { eu: 40, uk: "6.5" },
  { eu: 41, uk: "7.5" },
  { eu: 42, uk: "8" },
  { eu: 43, uk: "9" },
  { eu: 44, uk: "9.5" },
  { eu: 45, uk: "10.5" },
  { eu: 46, uk: "11" },
  { eu: 47, uk: "12" },
];

export const BUDGETS = [
  { key: "under_15k", label: "Under ₦15k" },
  { key: "15_25k", label: "₦15k – ₦25k" },
  { key: "25_40k", label: "₦25k – ₦40k" },
  { key: "40k_plus", label: "₦40k+" },
  { key: "advise", label: "Not sure — advise me" },
] as const;

export const DEADLINES = [
  { key: "no_rush", label: "No rush" },
  { key: "two_weeks", label: "Within 2 weeks" },
  { key: "date", label: "By a date" },
] as const;

export const labelFor = (
  list: ReadonlyArray<{ key: string; label: string }>,
  key: string | null | undefined,
) => list.find((x) => x.key === key)?.label ?? null;

export const MAX_PHOTOS = 6;
export const MAX_LINKS = 3;

export type EstimateLine = { label: string; amount: number };

export type Estimate = {
  lines: EstimateLine[];
  total: number;
  /** Some part can't be priced up front, so the total is a "from" price. */
  partial: boolean;
};

/**
 * Price for "change one of our designs": base design + priced edits + the
 * large-size surcharge, times the number of pairs. Edits marked "needs review"
 * (and any free-text extra) make it a "from" price the owner confirms.
 */
export function estimate({
  basePrice,
  edits,
  sizeEu,
  pairs,
  hasExtraNote,
  settings,
}: {
  basePrice: number;
  edits: ChosenEdit[];
  sizeEu: number | null;
  pairs: number;
  hasExtraNote: boolean;
  settings: CustomOrderSettings;
}): Estimate {
  const lines: EstimateLine[] = [{ label: "Base design", amount: basePrice }];
  for (const e of edits) lines.push({ label: e.name, amount: e.price });
  if (sizeEu && sizeEu >= settings.largeSizeFrom && settings.largeSizeSurcharge)
    lines.push({
      label: `Size ${settings.largeSizeFrom}+`,
      amount: settings.largeSizeSurcharge,
    });
  const perPair = lines.reduce((sum, l) => sum + l.amount, 0);
  const count = Math.max(1, pairs);
  return {
    lines,
    total: perPair * count,
    partial: hasExtraNote || edits.some((e) => e.needsReview),
  };
}

/** A readable title for the owner's inbox, e.g. "Amara slide — Add roses, Change the colour". */
export function buildTitle({
  kind,
  productTitle,
  style,
  edits,
}: {
  kind: CustomKind;
  productTitle?: string | null;
  style?: string | null;
  edits: ChosenEdit[];
}) {
  const base =
    kind === "modify"
      ? productTitle || "Custom pair"
      : kind === "recreate"
        ? "Recreate from photo"
        : `New ${style?.toLowerCase() || "design"}`;
  const changes = edits.map((e) => e.name).join(", ");
  return (changes ? `${base} — ${changes}` : base).slice(0, 250);
}

// ── What the customer sees ────────────────────────────────────────────────

export const TIMELINE = [
  { key: "received", label: "Received" },
  { key: "priced", label: "Approved & priced" },
  { key: "paid", label: "Paid" },
  { key: "making", label: "Being made" },
  { key: "ready", label: "Ready" },
  { key: "delivered", label: "Delivered" },
] as const;

/** Index into TIMELINE for a request status (-1 = closed without an order). */
export function timelineStep(status: string) {
  switch (status) {
    case "submitted":
    case "under_review":
    case "needs_info":
      return 0;
    case "quoted":
    case "awaiting_payment":
      return 1;
    case "paid":
      return 2;
    case "in_production":
      return 3;
    case "balance_due":
    case "ready":
      return 4;
    case "completed":
      return 5;
    default:
      return -1;
  }
}

export const CUSTOMER_STATUS: Record<string, { label: string; body: string }> =
  {
    submitted: {
      label: "Received",
      body: "We've got your request and will look at it soon.",
    },
    under_review: {
      label: "Reviewing",
      body: "We're looking at your request and working out the price.",
    },
    needs_info: {
      label: "We have a question",
      body: "Please reply below so we can price your pair.",
    },
    quoted: {
      label: "Your price is ready",
      body: "Check the price below. Pay a deposit to start, or ask us to change something.",
    },
    awaiting_payment: {
      label: "Waiting for payment",
      body: "Your payment hasn't come through yet. You can try again below.",
    },
    paid: {
      label: "Paid",
      body: "Thank you — your pair is in the queue to be made.",
    },
    in_production: {
      label: "Being made",
      body: "Your pair is being made by hand in Lagos.",
    },
    balance_due: {
      label: "Your pair is ready",
      body: "Pay the balance below and we'll send it straight out.",
    },
    ready: {
      label: "Ready to send",
      body: "All paid — we're getting your pair ready for delivery.",
    },
    completed: { label: "Done", body: "Your pair is finished. Enjoy them!" },
    cancelled: { label: "Cancelled", body: "This request was cancelled." },
    rejected: {
      label: "We can't make this one",
      body: "Sorry — we can't make this request well. See our message below.",
    },
  };

// ── Quotes & payments ─────────────────────────────────────────────────────

export type QuoteLine = { label: string; amount: number };

/** Lines stored in custom_order_quotes.breakdown ({ lines: [...] }). */
export function quoteLines(breakdown: unknown): QuoteLine[] {
  const lines = (breakdown as { lines?: unknown } | null)?.lines;
  return Array.isArray(lines)
    ? lines
        .filter(
          (l): l is QuoteLine =>
            !!l && typeof l.label === "string" && Number.isFinite(Number(l.amount)),
        )
        .map((l) => ({ label: l.label, amount: Number(l.amount) }))
    : [];
}

/** Deposit for a quote total, rounded to the nearest ₦100; null when it's the full amount. */
export function depositFor(total: number, percent: number) {
  if (percent >= 100 || total <= 0) return null;
  const deposit = Math.round((total * percent) / 100 / 100) * 100;
  return deposit > 0 && deposit < total ? deposit : null;
}

/** What the customer pays now: a deposit, or everything (plus delivery). */
export type PaymentOption = "deposit" | "full";
