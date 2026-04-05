import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "lib/user-session";
import { handleApiError } from "lib/errors";
import { validateCouponForCheckout } from "lib/coupon-validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal, shippingAmount, sessionId } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(cartTotal)) {
      return NextResponse.json(
        { error: "Cart total is required" },
        { status: 400 },
      );
    }

    const session = await getUserSession();
    const currentUserId = session?.id;

    const {
      coupon,
      discountAmount,
      productDiscountAmount,
      shippingDiscountAmount,
      includeShippingInDiscount,
      grantsFreeShipping,
    } = await validateCouponForCheckout({
      code,
      cartTotal,
      shippingAmount:
        typeof shippingAmount === "number" ? Math.max(shippingAmount, 0) : 0,
      userId: currentUserId,
      sessionId,
    });

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        productDiscountAmount,
        shippingDiscountAmount,
        includeShippingInDiscount,
        grantsFreeShipping,
        description: coupon.description,
        requiresLogin: coupon.requiresLogin,
      },
    });
  } catch (error) {
    return handleApiError(error, "Coupon validation");
  }
}
