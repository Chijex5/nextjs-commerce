export const PAYMENT_PROVIDERS = ["paystack"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_TRANSACTION_STATUSES = [
  "initialized",
  "processing",
  "paid",
  "conflict",
  "failed",
] as const;
export type PaymentTransactionStatus =
  (typeof PAYMENT_TRANSACTION_STATUSES)[number];

export const PAYMENT_SOURCES = ["catalog_checkout", "custom_quote"] as const;
export type PaymentSource = (typeof PAYMENT_SOURCES)[number];

export const PAYMENT_CONFLICT_CODES = [
  "missing_metadata",
  "missing_reference",
  "cart_not_found",
  "quote_not_found",
  "request_not_found",
  "amount_mismatch",
  "currency_mismatch",
  "metadata_mismatch",
  "invalid_status",
  "duplicate_reference_backfill",
  "unknown",
] as const;
export type PaymentConflictCode = (typeof PAYMENT_CONFLICT_CODES)[number];

export const PAYMENT_EVENT_TYPES = [
  "initialize",
  "verify_callback",
  "webhook",
  "admin_verify",
  "admin_reconcile",
  "backfill",
] as const;
export type PaymentEventType = (typeof PAYMENT_EVENT_TYPES)[number];
