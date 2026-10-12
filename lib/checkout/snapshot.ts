import type { CheckoutQuote, QuoteLine } from "./quote";

/** What gets stored with the payment so the order matches what was paid. */
export type CheckoutSnapshot = {
  version: 1;
  cartId: string;
  lines: QuoteLine[];
  subtotal: number;
  shipping: number;
  productDiscount: number;
  shippingDiscount: number;
  discount: number;
  couponId: string | null;
  couponCode: string | null;
  total: number;
  amountInKobo: number;
};

export function toSnapshot(
  cartId: string,
  quote: CheckoutQuote,
): CheckoutSnapshot {
  return {
    version: 1,
    cartId,
    lines: quote.lines,
    subtotal: quote.subtotal,
    shipping: quote.shipping ?? 0,
    productDiscount: quote.productDiscount,
    shippingDiscount: quote.shippingDiscount,
    discount: quote.discount,
    couponId: quote.coupon?.id ?? null,
    couponCode: quote.coupon?.code ?? null,
    total: quote.total,
    amountInKobo: quote.amountInKobo,
  };
}

export function readSnapshot(value: unknown): CheckoutSnapshot | null {
  if (typeof value !== "object" || value === null) return null;
  const s = value as Partial<CheckoutSnapshot>;
  if (
    s.version !== 1 ||
    typeof s.cartId !== "string" ||
    !Array.isArray(s.lines) ||
    s.lines.length === 0 ||
    typeof s.amountInKobo !== "number"
  ) {
    return null;
  }
  return s as CheckoutSnapshot;
}
