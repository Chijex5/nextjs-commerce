/**
 * Pure client-safe coupon discount calculation helpers.
 * This module has no server-only imports so it can be used in both
 * server and client contexts.
 */

interface CouponLike {
  discountType: string;
  discountValue: string | number;
  includesShipping: boolean;
}

/**
 * Calculate the discount for a coupon given the order amounts.
 *
 * `shippingAmount` defaults to 0, which is appropriate for cart-time validation
 * where the shipping address is not yet known.  Always pass the actual shipping
 * cost at checkout time so that `free_shipping` and `includesShipping` coupons
 * are calculated correctly.
 *
 * Returns `{ productDiscount, shippingDiscount }` so callers can record each
 * separately or combine them.
 */
export function computeCouponDiscount(
  coupon: CouponLike,
  cartTotal: number,
  shippingAmount = 0,
): { productDiscount: number; shippingDiscount: number } {
  const value = Number(coupon.discountValue);

  if (coupon.discountType === "free_shipping") {
    return { productDiscount: 0, shippingDiscount: shippingAmount };
  }

  if (coupon.discountType === "percentage") {
    const pct = Math.min(100, Math.max(0, value));
    if (coupon.includesShipping) {
      const combined = cartTotal + shippingAmount;
      const totalDiscount = (combined * pct) / 100;
      const shippingDiscount = Math.min(shippingAmount, (shippingAmount * pct) / 100);
      const productDiscount = Math.min(cartTotal, totalDiscount - shippingDiscount);
      return { productDiscount, shippingDiscount };
    }
    const productDiscount = Math.min(cartTotal, (cartTotal * pct) / 100);
    return { productDiscount, shippingDiscount: 0 };
  }

  if (coupon.discountType === "fixed") {
    if (coupon.includesShipping) {
      // Apply fixed discount to products first; any remainder reduces shipping.
      const productDiscount = Math.min(value, cartTotal);
      const remaining = value - productDiscount;
      const shippingDiscount = Math.min(remaining, shippingAmount);
      return { productDiscount, shippingDiscount };
    }
    const productDiscount = Math.min(value, cartTotal);
    return { productDiscount, shippingDiscount: 0 };
  }

  return { productDiscount: 0, shippingDiscount: 0 };
}
