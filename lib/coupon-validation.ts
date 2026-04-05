import { eq, ilike } from "drizzle-orm";
import { db } from "./db";
import { coupons, couponUsages } from "./db/schema";
import { AppError, ErrorCode, ErrorType } from "./errors";
import { computeCouponDiscount } from "./coupon-calc";
export { computeCouponDiscount } from "./coupon-calc";

/**
 * Thrown when coupon validation fails with a user-displayable message.
 * Extends AppError so that `handleApiError` handles it correctly without
 * needing special instanceof checks in every route.
 */
export class CouponValidationError extends AppError {
  constructor(message: string, status = 400, code?: string) {
    super({ type: ErrorType.VALIDATION, message, status, code });
    this.name = "CouponValidationError";
  }
}

export async function validateCouponForCheckout({
  code,
  cartTotal,
  shippingAmount,
  userId,
  sessionId,
}: {
  code: string;
  cartTotal: number;
  shippingAmount?: number;
  userId?: string | null;
  sessionId?: string | null;
}) {
  if (!code || typeof code !== "string") {
    throw new CouponValidationError(
      "Coupon code is required",
      400,
      ErrorCode.MISSING_FIELDS,
    );
  }

  if (!Number.isFinite(cartTotal)) {
    throw new CouponValidationError(
      "Cart total is required",
      400,
      ErrorCode.MISSING_FIELDS,
    );
  }

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(ilike(coupons.code, code.toUpperCase()))
    .limit(1);

  if (!coupon) {
    throw new CouponValidationError(
      "Invalid coupon code",
      404,
      ErrorCode.COUPON_NOT_FOUND,
    );
  }

  if (!coupon.isActive) {
    throw new CouponValidationError(
      "This coupon is no longer active",
      400,
      ErrorCode.COUPON_INACTIVE,
    );
  }

  if (coupon.requiresLogin && !userId) {
    throw new CouponValidationError(
      "Please sign in to use this coupon",
      401,
      ErrorCode.COUPON_REQUIRES_LOGIN,
    );
  }

  if (coupon.startDate && new Date() < new Date(coupon.startDate)) {
    throw new CouponValidationError(
      "This coupon is not yet valid",
      400,
      ErrorCode.COUPON_NOT_STARTED,
    );
  }

  if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
    throw new CouponValidationError(
      "This coupon has expired",
      400,
      ErrorCode.COUPON_EXPIRED,
    );
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new CouponValidationError(
      "This coupon has reached its usage limit",
      400,
      ErrorCode.COUPON_LIMIT_REACHED,
    );
  }

  let usages: typeof couponUsages.$inferSelect[] = [];

  if (coupon.maxUsesPerUser) {
    usages = await db
      .select()
      .from(couponUsages)
      .where(eq(couponUsages.couponId, coupon.id));
  }

  if (coupon.maxUsesPerUser) {
    let userUsageCount = 0;

    if (userId) {
      userUsageCount = usages.filter((usage) => usage.userId === userId).length;
    } else if (sessionId) {
      userUsageCount = usages.filter(
        (usage) => usage.sessionId === sessionId,
      ).length;
    }

    if (userUsageCount >= coupon.maxUsesPerUser) {
      throw new CouponValidationError(
        "You have already used this coupon the maximum number of times",
        400,
        ErrorCode.COUPON_USER_LIMIT,
      );
    }
  }

  if (coupon.minOrderValue && cartTotal < Number(coupon.minOrderValue)) {
    throw new CouponValidationError(
      `Minimum order value of ₦${Number(coupon.minOrderValue).toLocaleString()} required`,
      400,
      ErrorCode.COUPON_MIN_ORDER,
    );
  }

  const shipping = Number.isFinite(shippingAmount) ? (shippingAmount ?? 0) : 0;
  const { productDiscount, shippingDiscount } = computeCouponDiscount(
    coupon,
    cartTotal,
    shipping,
  );
  const discountAmount = productDiscount + shippingDiscount;

  return {
    coupon,
    discountAmount,
    productDiscount,
    shippingDiscount,
  };
}
