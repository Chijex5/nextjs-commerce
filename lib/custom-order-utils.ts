import crypto from "crypto";
import { CUSTOM_REQUEST_STATUSES, QUOTE_STATUSES } from "lib/db/enums";
import { baseUrl } from "lib/utils";

export const CUSTOM_ORDER_REQUEST_STATUSES = CUSTOM_REQUEST_STATUSES;
export const CUSTOM_ORDER_QUOTE_STATUSES = QUOTE_STATUSES;

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

/**
 * Access key for a request's page. Derived from the request number with an
 * HMAC, so every email can carry a working link without storing tokens, and
 * links already sent never stop working.
 */
export function requestAccessToken(requestNumber: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return crypto
    .createHmac("sha256", secret)
    .update(`custom-request:${requestNumber}`)
    .digest("base64url")
    .slice(0, 32);
}

export function isValidRequestAccessToken(
  requestNumber: string,
  token: string | null | undefined,
) {
  if (!token) return false;
  const expected = Buffer.from(requestAccessToken(requestNumber));
  const given = Buffer.from(token);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

/** Relative link to the customer's request page (status, price, messages). */
export const requestPagePath = (requestNumber: string) =>
  `/custom-orders/r/${encodeURIComponent(requestNumber)}?t=${requestAccessToken(requestNumber)}`;

export const buildRequestPageUrl = (requestNumber: string) =>
  `${baseUrl}${requestPagePath(requestNumber)}`;

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
