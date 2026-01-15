import prisma from "lib/prisma";

export class CouponValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function validateCouponForCheckout({
  code,
  cartTotal,
  userId,
  sessionId,
}: {
  code: string;
  cartTotal: number;
  userId?: string | null;
  sessionId?: string | null;
}) {
  if (!code || typeof code !== "string") {
    throw new CouponValidationError("Coupon code is required", 400);
  }

  if (!Number.isFinite(cartTotal)) {
    throw new CouponValidationError("Cart total is required", 400);
  }

  const coupon = await prisma.coupon.findFirst({
    where: {
      code: {
        equals: code.toUpperCase(),
        mode: "insensitive",
      },
    },
    include: {
      usages: true,
    },
  });

  if (!coupon) {
    throw new CouponValidationError("Invalid coupon code", 404);
  }

  if (!coupon.isActive) {
    throw new CouponValidationError("This coupon is no longer active", 400);
  }

  if (coupon.requiresLogin && !userId) {
    throw new CouponValidationError("Please sign in to use this coupon", 401);
  }

  if (coupon.startDate && new Date() < new Date(coupon.startDate)) {
    throw new CouponValidationError("This coupon is not yet valid", 400);
  }

  if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
    throw new CouponValidationError("This coupon has expired", 400);
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new CouponValidationError(
      "This coupon has reached its usage limit",
      400,
    );
  }

  if (coupon.maxUsesPerUser) {
    let userUsageCount = 0;

    if (userId) {
      userUsageCount = coupon.usages.filter(
        (usage) => usage.userId === userId,
      ).length;
    } else if (sessionId) {
      userUsageCount = coupon.usages.filter(
        (usage) => usage.sessionId === sessionId,
      ).length;
    }

    if (userUsageCount >= coupon.maxUsesPerUser) {
      throw new CouponValidationError(
        "You have already used this coupon the maximum number of times",
        400,
      );
    }
  }

  if (coupon.minOrderValue && cartTotal < Number(coupon.minOrderValue)) {
    throw new CouponValidationError(
      `Minimum order value of ₦${Number(coupon.minOrderValue).toLocaleString()} required`,
      400,
    );
  }

  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = (cartTotal * Number(coupon.discountValue)) / 100;
  } else if (coupon.discountType === "fixed") {
    discountAmount = Math.min(Number(coupon.discountValue), cartTotal);
  }

  return {
    coupon,
    discountAmount,
  };
}
