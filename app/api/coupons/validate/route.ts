import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "lib/user-session";
import { handleApiError } from "lib/errors";
import { validateCouponForCheckout } from "lib/coupon-validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal, sessionId, shippingCost } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 },
      );
    }

    if (typeof cartTotal !== "number" || !Number.isFinite(cartTotal)) {
      return NextResponse.json(
        { error: "Cart total is required" },
        { status: 400 },
      );
    }

    const normalizedShippingCost =
      typeof shippingCost === "number" && Number.isFinite(shippingCost)
        ? shippingCost
        : 0;

    const session = await getUserSession();
    const currentUserId = session?.id;

    const { coupon, discountAmount, coversShipping } =
      await validateCouponForCheckout({
        code,
        cartTotal,
        shippingCost: normalizedShippingCost,
        userId: currentUserId,
        sessionId: currentUserId ? undefined : sessionId,
      });

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        coversShipping,
        includesShipping: coupon.includesShipping,
        description: coupon.description,
        requiresLogin: coupon.requiresLogin,
      },
    });
  } catch (error) {
    return handleApiError(error, "Coupon validation");
  }
}
