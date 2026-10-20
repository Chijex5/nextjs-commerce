import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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
  HERS,
  HIS,
  parsePairing,
  setTitle,
  setUnitPrice,
  wearerOf,
} from "lib/pairing";
import {
  calculateShippingAmount,
  type ShippingAddressInfo,
} from "lib/shipping";
import { estimateDelivery, type DeliveryEstimate } from "./delivery-estimate";
import { stockShortfalls } from "./stock";

/** One line of the bag, priced at the moment the quote was made. */
export type QuoteLine = {
  lineId: string;
  variantId: string;
  /** A couples set: the Hers pair (variantId is His). Counts against stock too. */
  pairVariantId?: string | null;
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
  lineId: string;
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

const pairVariants = alias(productVariants, "pair_variants");

type Options = Array<{ name: string; value: string }>;
type VariantRow = typeof productVariants.$inferSelect;

/** Left to sell: Infinity for made-to-order pairs. */
const stockOf = (v: VariantRow) =>
  v.trackInventory ? (v.stockQuantity ?? 0) : Infinity;

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
      pair: pairVariants,
      product: products,
      image: productImages.url,
    })
    .from(cartLines)
    .innerJoin(
      productVariants,
      eq(cartLines.productVariantId, productVariants.id),
    )
    .leftJoin(pairVariants, eq(cartLines.pairVariantId, pairVariants.id))
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

  const unique = rows.filter(({ line }) => {
    if (seen.has(line.id)) return false; // more than one featured image
    seen.add(line.id);
    return true;
  });

  const shortfalls = stockShortfalls(
    unique.map(({ line, variant, pair }) => ({
      lineId: line.id,
      quantity: line.quantity,
      parts: (pair ? [variant, pair] : [variant]).map((v) => ({
        id: v.id,
        left: stockOf(v),
      })),
    })),
  );

  for (const { line, variant, pair, product, image } of unique) {
    const pairing = parsePairing(product.pairing);
    const isSet = Boolean(line.pairVariantId);
    const validSet =
      !isSet ||
      (pair &&
        pairing &&
        pair.productId === product.id &&
        wearerOf(variant.selectedOptions as Options) === HIS &&
        wearerOf(pair.selectedOptions as Options) === HERS);
    const parts = pair ? [variant, pair] : [variant];

    if (
      !validSet ||
      !product.availableForSale ||
      parts.some((v) => !v.availableForSale)
    ) {
      issues.push({
        lineId: line.id,
        variantId: variant.id,
        productTitle: product.title,
        kind: "unavailable",
      });
      continue;
    }

    const left = shortfalls.get(line.id);
    if (left !== undefined) {
      issues.push({
        lineId: line.id,
        variantId: variant.id,
        productTitle: product.title,
        kind: left > 0 ? "insufficient_stock" : "unavailable",
        available: left,
      });
      continue;
    }

    const unitPrice = pair
      ? setUnitPrice(Number(variant.price), Number(pair.price), pairing!)
      : Number(variant.price);
    lines.push({
      lineId: line.id,
      variantId: variant.id,
      pairVariantId: pair?.id ?? null,
      productId: product.id,
      productTitle: product.title,
      productHandle: product.handle,
      variantTitle: pair
        ? setTitle(
            variant.selectedOptions as Options,
            pair.selectedOptions as Options,
          )
        : variant.title,
      quantity: line.quantity,
      unitPrice,
      lineTotal: money(unitPrice * line.quantity),
      currencyCode: variant.currencyCode,
      image: image ?? null,
    });
    // A stocked pair ships straight away; made-to-order waits on the bench.
    const stocked = parts.every((v) => v.trackInventory);
    productionDays.push(stocked ? 0 : product.productionDays);
  }

  // Pairs, not lines: a set is two (shipping is charged per pair).
  const itemCount = lines.reduce(
    (n, l) => n + l.quantity * (l.pairVariantId ? 2 : 1),
    0,
  );
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
