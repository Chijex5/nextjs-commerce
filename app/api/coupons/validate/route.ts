import { NextRequest, NextResponse } from "next/server";
import { db } from "lib/db";
import { couponUsages, coupons } from "lib/db/schema";
import { getUserSession } from "lib/user-session";
import { eq, ilike } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal, sessionId } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 },
      );
    }

    if (!cartTotal || typeof cartTotal !== "number") {
      return NextResponse.json(
        { error: "Cart total is required" },
        { status: 400 },
      );
    }

    const session = await getUserSession();
    const currentUserId = session?.id;

    const [coupon] = await db
      .select()
      .from(coupons)
      .where(ilike(coupons.code, code.toUpperCase()))
      .limit(1);

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 404 },
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "This coupon is no longer active" },
        { status: 400 },
      );
    }

    if (coupon.requiresLogin && !currentUserId) {
      return NextResponse.json(
        { error: "Please sign in to use this coupon" },
        { status: 401 },
      );
    }

    if (coupon.startDate && new Date() < new Date(coupon.startDate)) {
      return NextResponse.json(
        { error: "This coupon is not yet valid" },
        { status: 400 },
      );
    }

    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return NextResponse.json(
        { error: "This coupon has expired" },
        { status: 400 },
      );
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { error: "This coupon has reached its usage limit" },
        { status: 400 },
      );
    }

    if (coupon.maxUsesPerUser) {
      const usages = await db
        .select()
        .from(couponUsages)
        .where(eq(couponUsages.couponId, coupon.id));

      let userUsageCount = 0;

      if (currentUserId) {
        userUsageCount = usages.filter((u) => u.userId === currentUserId).length;
      } else if (sessionId) {
        userUsageCount = usages.filter((u) => u.sessionId === sessionId).length;
      }

      if (userUsageCount >= coupon.maxUsesPerUser) {
        return NextResponse.json(
          {
            error:
              "You have already used this coupon the maximum number of times",
          },
          { status: 400 },
        );
      }
    }

    if (coupon.minOrderValue && cartTotal < Number(coupon.minOrderValue)) {
      return NextResponse.json(
        {
          error: `Minimum order value of ₦${Number(coupon.minOrderValue).toLocaleString()} required`,
        },
        { status: 400 },
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (cartTotal * Number(coupon.discountValue)) / 100;
    } else if (coupon.discountType === "fixed") {
      discountAmount = Math.min(Number(coupon.discountValue), cartTotal);
    }

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        description: coupon.description,
        requiresLogin: coupon.requiresLogin,
      },
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 },
    );
  }
}
