/**
 * Shared by the custom requests list (server) and the request page (client):
 * the request shape, status labels and the queue views.
 */
import type { Tone } from "components/admin/ui";
import type { QuoteLine } from "lib/custom-orders/shared";

export type Quote = {
  id: string;
  version: number;
  amount: number;
  depositAmount: number | null;
  lines: QuoteLine[];
  note: string | null;
  status: string;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type Message = {
  id: string;
  author: "customer" | "admin" | "system";
  authorName: string | null;
  body: string;
  attachments: string[];
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
  kind: string;
  baseProduct: {
    id: string;
    title: string;
    handle: string;
    image: string | null;
  } | null;
  edits: Array<{ id: string; name: string; price: number; needsReview: boolean; detail?: string }>;
  estimateAmount: number | null;
  sizeEu: number | null;
  pairs: number;
  footLengthCm: number | null;
  budgetBand: string | null;
  deadlineKind: string | null;
  referenceLinks: string[];
  messages: Message[];
  adminNotes: string | null;
  customerNotes: string | null;
  quotedAmount: number | null;
  quoteExpiresAt: string | null;
  paidAt: string | null;
  convertedOrderId: string | null;
  /** Left to pay on the order (after a deposit). */
  balanceDue: number;
  createdAt: string;
  updatedAt: string;
  /** Newest first. */
  quotes: Quote[];
};

export const STATUS: Record<string, { label: string; tone: Tone }> = {
  submitted: { label: "New", tone: "warning" },
  under_review: { label: "Reviewing", tone: "warning" },
  needs_info: { label: "Asked a question", tone: "info" },
  quoted: { label: "Quote sent", tone: "info" },
  awaiting_payment: { label: "Accepted, awaiting payment", tone: "info" },
  paid: { label: "Paid", tone: "positive" },
  in_production: { label: "In production", tone: "positive" },
  balance_due: { label: "Balance requested", tone: "info" },
  ready: { label: "Paid in full, ready to send", tone: "positive" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  rejected: { label: "Declined", tone: "critical" },
};

export const statusOf = (status: string) =>
  STATUS[status] ?? { label: status, tone: "neutral" as Tone };

export const QUOTE_STATUS: Record<string, { label: string; tone: Tone }> = {
  sent: { label: "Sent", tone: "info" },
  accepted: { label: "Accepted", tone: "positive" },
  paid: { label: "Paid", tone: "positive" },
  rejected: { label: "Declined", tone: "critical" },
  expired: { label: "Expired", tone: "neutral" },
};

export const CLOSED = ["completed", "cancelled", "rejected"];

/** New, being reviewed, or the customer has written since we last replied. */
export function needsReply(r: Pick<RequestItem, "status" | "messages">) {
  if (CLOSED.includes(r.status)) return false;
  if (["submitted", "under_review"].includes(r.status)) return true;
  const last = [...r.messages].reverse().find((m) => m.author !== "system");
  return last?.author === "customer";
}

export const VIEWS: Array<{
  key: string;
  label: string;
  match: ((r: RequestItem) => boolean) | null;
}> = [
  { key: "todo", label: "Needs reply", match: needsReply },
  {
    key: "waiting",
    label: "Waiting on customer",
    match: (r) =>
      ["needs_info", "quoted", "awaiting_payment", "balance_due"].includes(r.status) &&
      !needsReply(r),
  },
  {
    key: "making",
    label: "In the workshop",
    match: (r) => ["paid", "in_production", "ready"].includes(r.status),
  },
  { key: "closed", label: "Closed", match: (r) => CLOSED.includes(r.status) },
  { key: "all", label: "All", match: null },
];

export const KIND: Record<string, string> = {
  modify: "Change a design",
  recreate: "From a photo",
  new: "New idea",
};

export const DEADLINE: Record<string, string> = {
  no_rush: "No rush",
  two_weeks: "Within 2 weeks",
  date: "By a date",
};

export const BUDGET: Record<string, string> = {
  under_15k: "Under ₦15k",
  "15_25k": "₦15k – ₦25k",
  "25_40k": "₦25k – ₦40k",
  "40k_plus": "₦40k+",
  advise: "Wants advice",
};

export function intlPhone(raw: string | null) {
  const digits = raw?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  return digits.startsWith("234") ? digits : `234${digits.replace(/^0/, "")}`;
}
