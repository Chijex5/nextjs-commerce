/**
 * Allowed values for the text "enum" columns. The schema turns each list into
 * a CHECK constraint, and API routes validate input against the same lists,
 * so the database and the code can't drift apart.
 *
 * Adding a value: add it here, run `pnpm db:generate`, review the migration.
 */

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "completed",
  "cancelled",
] as const;

export const DELIVERY_STATUSES = [
  "production",
  "sorting",
  "dispatch",
  "paused",
  "completed",
  "cancelled",
] as const;

export const ORDER_TYPES = ["catalog", "custom"] as const;

export const PAYMENT_PROVIDERS = ["paystack", "coupon_free"] as const;

export const CUSTOM_REQUEST_STATUSES = [
  "submitted",
  "under_review",
  /** The owner asked a question in the thread and is waiting for a reply. */
  "needs_info",
  "quoted",
  "awaiting_payment",
  "paid",
  "in_production",
  /** Made; the customer owes the balance before it's sent. */
  "balance_due",
  /** Fully paid and ready to send. */
  "ready",
  "completed",
  "cancelled",
  "rejected",
] as const;

/** modify = change one of our designs, recreate = from a photo, new = an idea. */
export const CUSTOM_REQUEST_KINDS = ["modify", "recreate", "new"] as const;

export const CUSTOM_MESSAGE_AUTHORS = ["customer", "admin", "system"] as const;

export const QUOTE_STATUSES = [
  "sent",
  "accepted",
  "rejected",
  "expired",
  "paid",
] as const;

export const ADMIN_ROLE_VALUES = ["admin", "super_admin"] as const;

export const PAYMENT_STATUSES = [
  "initialized",
  "processing",
  "paid",
  "conflict",
  "failed",
] as const;

export const PAYMENT_SOURCES = ["catalog_checkout", "custom_quote"] as const;

export const NEWSLETTER_STATUSES = [
  "active",
  "unsubscribed",
  "bounced",
  "complained",
] as const;

export const NEWSLETTER_SOURCES = [
  "newsletter",
  "popup",
  "footer",
  "checkout",
  "account",
  "restock",
  "import",
] as const;

export const OTP_PURPOSES = ["add_password"] as const;

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;

export const DISCOUNT_TYPES = ["percentage", "fixed", "free_shipping"] as const;

export const MERCHANT_SYNC_STATUSES = ["pending", "synced", "failed"] as const;

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "SENDING",
  "SENT",
] as const;

export const CAMPAIGN_TYPES = ["JUST_ARRIVED", "SALE", "COLLECTION"] as const;

export const CAMPAIGN_LOG_STATUSES = [
  "QUEUED",
  "SENDING",
  "SENT",
  "DELIVERED",
  "OPENED",
  "CLICKED",
  "BOUNCED",
  "COMPLAINED",
  "FAILED",
] as const;

export const FLOW_LOG_STATUSES = [
  "SENDING",
  "SENT",
  "FAILED",
  "BOUNCED",
  "COMPLAINED",
] as const;

export const FLOW_KEYS = [
  "welcome",
  "abandoned_cart",
  "review_request",
  "win_back",
] as const;

/** Type guard: is `value` one of `values`? */
export function isOneOf<const T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === "string" && values.includes(value);
}
