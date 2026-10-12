import { and, eq } from "drizzle-orm";
import {
  CouponValidationError,
  validateCouponForCheckout,
} from "lib/coupon-validation";
import { db } from "lib/db";
import {
  cartLines,
  productImages,
  products,
  productVariants,
} from "lib/db/schema";
import {
  calculateShippingAmount,
  type ShippingAddressInfo,
} from "lib/shipping";
import { estimateDelivery, type DeliveryEstimate } from "./delivery-estimate";

/** One line of the bag, priced at the moment the quote was made. */
export type QuoteLine = {
  lineId: string;
  variantId: string;
  productId: string;
  productTitle: string;
  productHandle: string;
  variantTitle: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currencyCode: string;
  image: string | null;
};

/** A line that can't be bought as it stands. */
export type QuoteIssue = {
  variantId: string;
  productTitle: string;
  kind: "unavailable" | "insufficient_stock";
  /** How many are left when kind is insufficient_stock. */
  available?: number;
};

export type CheckoutQuote = {
  lines: QuoteLine[];
  issues: QuoteIssue[];
  itemCount: number;
  subtotal: number;
  /** Null until a state is known. */
  shipping: number | null;
  productDiscount: number;
  shippingDiscount: number;
  discount: number;
  coupon: { id: string; code: string } | null;
  couponError: string | null;
  total: number;
  /** What Paystack is asked to charge. */
  amountInKobo: number;
  currencyCode: "NGN";
  delivery: DeliveryEstimate;
};

const money = (n: number) => Math.round(n * 100) / 100;

/**
 * Prices a bag from the database: live variant prices, availability and
 * stock, shipping for the address, and the coupon. The checkout page shows
 * this and Pay charges exactly this (it is stored as the order snapshot).
 */
export async function quoteCheckout(input: {
  cartId: string;
  address?: ShippingAddressInfo | null;
  couponCode?: string | null;
  userId?: string | null;
  sessionId?: string | null;
}): Promise<CheckoutQuote> {
  const rows = await db
    .select({
      line: cartLines,
      variant: productVariants,
      product: products,
      image: productImages.url,
    })
    .from(cartLines)
    .innerJoin(
      productVariants,
      eq(cartLines.productVariantId, productVariants.id),
    )
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isFeatured, true),
      ),
    )
    .where(eq(cartLines.cartId, input.cartId))
    .orderBy(cartLines.createdAt);

  const seen = new Set<string>();
  const lines: QuoteLine[] = [];
  const issues: QuoteIssue[] = [];
  const productionDays: (number | null)[] = [];

  for (const { line, variant, product, image } of rows) {
    if (seen.has(line.id)) continue; // more than one featured image
    seen.add(line.id);

    if (!variant.availableForSale || !product.availableForSale) {
      issues.push({
        variantId: variant.id,
        productTitle: product.title,
        kind: "unavailable",
      });
      continue;
    }

    const stocked = variant.trackInventory;
    const left = stocked ? (variant.stockQuantity ?? 0) : Infinity;
    if (left < line.quantity) {
      issues.push({
        variantId: variant.id,
        productTitle: product.title,
        kind: left > 0 ? "insufficient_stock" : "unavailable",
        available: Math.max(0, left),
      });
      continue;
    }

    const unitPrice = Number(variant.price);
    lines.push({
      lineId: line.id,
      variantId: variant.id,
      productId: product.id,
      productTitle: product.title,
      productHandle: product.handle,
      variantTitle: variant.title,
      quantity: line.quantity,
      unitPrice,
      lineTotal: money(unitPrice * line.quantity),
      currencyCode: variant.currencyCode,
      image: image ?? null,
    });
    // A stocked pair ships straight away; made-to-order waits on the bench.
    productionDays.push(stocked ? 0 : product.productionDays);
  }

  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = money(lines.reduce((n, l) => n + l.lineTotal, 0));
  const hasState = Boolean(input.address?.state?.trim());
  const shipping =
    hasState && itemCount > 0
      ? calculateShippingAmount({
          address: input.address,
          subtotalAmount: subtotal,
          totalQuantity: itemCount,
        })
      : null;

  let productDiscount = 0;
  let shippingDiscount = 0;
  let discount = 0;
  let coupon: CheckoutQuote["coupon"] = null;
  let couponError: string | null = null;

  const code = input.couponCode?.trim();
  if (code && itemCount > 0) {
    try {
      const result = await validateCouponForCheckout({
        code,
        cartTotal: subtotal,
        shippingAmount: shipping ?? 0,
        userId: input.userId,
        sessionId: input.userId ? undefined : input.sessionId,
      });
      productDiscount = money(result.productDiscountAmount);
      shippingDiscount = money(result.shippingDiscountAmount);
      discount = money(result.discountAmount);
      coupon = { id: result.coupon.id, code: result.coupon.code };
    } catch (error) {
      if (!(error instanceof CouponValidationError)) throw error;
      couponError = error.message;
    }
  }

  const total = money(Math.max(0, subtotal + (shipping ?? 0) - discount));

  return {
    lines,
    issues,
    itemCount,
    subtotal,
    shipping,
    productDiscount,
    shippingDiscount,
    discount,
    coupon,
    couponError,
    total,
    amountInKobo: Math.round(total * 100),
    currencyCode: "NGN",
    delivery: estimateDelivery({
      productionDays,
      state: input.address?.state,
    }),
  };
}
