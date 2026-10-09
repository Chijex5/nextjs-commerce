import { money, shortDate } from "./format";

export type CouponLike = {
  discountType: string;
  discountValue: number;
  minOrderValue: number | null;
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number | null;
  requiresLogin: boolean;
  grantsFreeShipping: boolean;
  isActive: boolean;
  startDate: Date | string | null;
  expiryDate: Date | string | null;
};

export type CouponState =
  | "active"
  | "scheduled"
  | "expired"
  | "used-up"
  | "off";

export const COUPON_STATE: Record<
  CouponState,
  { label: string; tone: "positive" | "info" | "neutral" | "warning" }
> = {
  active: { label: "Active", tone: "positive" },
  scheduled: { label: "Scheduled", tone: "info" },
  expired: { label: "Expired", tone: "neutral" },
  "used-up": { label: "Used up", tone: "warning" },
  off: { label: "Off", tone: "neutral" },
};

const toDate = (d: Date | string | null) => (d ? new Date(d) : null);

export function couponState(c: CouponLike, now = new Date()): CouponState {
  if (!c.isActive) return "off";
  const start = toDate(c.startDate);
  const end = toDate(c.expiryDate);
  if (end && end < now) return "expired";
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return "used-up";
  if (start && start > now) return "scheduled";
  return "active";
}

/** "15% off orders over ₦20,000" — how a customer would describe it. */
export function describeDiscount(
  c: Pick<
    CouponLike,
    "discountType" | "discountValue" | "minOrderValue" | "grantsFreeShipping"
  >,
) {
  const what =
    c.discountType === "free_shipping"
      ? "Free delivery"
      : c.discountType === "percentage"
        ? `${c.discountValue}% off`
        : `${money(c.discountValue)} off`;
  const extra =
    c.discountType !== "free_shipping" && c.grantsFreeShipping
      ? " + free delivery"
      : "";
  const min = c.minOrderValue
    ? ` orders over ${money(c.minOrderValue)}`
    : c.discountType === "free_shipping"
      ? ""
      : " any order";
  return `${what}${extra}${min}`;
}

/** Secondary line: limits and schedule. */
export function describeRules(c: CouponLike) {
  const parts: string[] = [];
  if (c.maxUses !== null) parts.push(`${c.maxUses} uses total`);
  if (c.maxUsesPerUser !== null) parts.push(`${c.maxUsesPerUser} per customer`);
  if (c.requiresLogin) parts.push("signed-in customers only");
  const start = toDate(c.startDate);
  const end = toDate(c.expiryDate);
  if (start && start > new Date()) parts.push(`starts ${shortDate(start)}`);
  if (end)
    parts.push(`${end < new Date() ? "ended" : "ends"} ${shortDate(end)}`);
  return parts.join(" · ") || "No limits";
}

/** Date → value for a datetime-local input, in Lagos time. */
export function toLagosInput(date: Date | string | null) {
  if (!date) return "";
  return new Date(new Date(date).getTime() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}
