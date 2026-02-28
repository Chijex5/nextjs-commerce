import crypto from "crypto";
import { baseUrl } from "lib/utils";

export const CUSTOM_ORDER_REQUEST_STATUSES = [
  "submitted",
  "under_review",
  "quoted",
  "awaiting_payment",
  "paid",
  "in_production",
  "completed",
  "cancelled",
  "rejected",
] as const;

export const CUSTOM_ORDER_QUOTE_STATUSES = [
  "sent",
  "accepted",
  "rejected",
  "expired",
  "paid",
] as const;

export type CustomOrderRequestStatus =
  (typeof CUSTOM_ORDER_REQUEST_STATUSES)[number];
export type CustomOrderQuoteStatus = (typeof CUSTOM_ORDER_QUOTE_STATUSES)[number];

export const isCustomOrderFeatureEnabled = () =>
  process.env.CUSTOM_ORDER_REQUESTS_ENABLED === "true";

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const buildCustomOrderRequestNumber = () =>
  `COR-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const buildCustomOrderPublicToken = () => crypto.randomBytes(32).toString("hex");

export const hashCustomOrderPublicToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const buildQuotePaymentCallbackUrl = () =>
  `${baseUrl}/api/custom-order-quotes/verify`;

export const buildCustomRequestTrackUrl = (requestNumber: string, email: string) =>
  `${baseUrl}/orders?customRequest=${encodeURIComponent(requestNumber)}&email=${encodeURIComponent(
    email,
  )}`;

export const buildQuoteAccessUrl = (quoteId: string, token: string) =>
  `${baseUrl}/custom-orders/request?quoteId=${encodeURIComponent(quoteId)}&token=${encodeURIComponent(
    token,
  )}`;

export const toRequestStatus = (value: unknown): CustomOrderRequestStatus =>
  CUSTOM_ORDER_REQUEST_STATUSES.includes(
    value as CustomOrderRequestStatus,
  )
    ? (value as CustomOrderRequestStatus)
    : "submitted";

export const toQuoteStatus = (value: unknown): CustomOrderQuoteStatus =>
  CUSTOM_ORDER_QUOTE_STATUSES.includes(value as CustomOrderQuoteStatus)
    ? (value as CustomOrderQuoteStatus)
    : "sent";
