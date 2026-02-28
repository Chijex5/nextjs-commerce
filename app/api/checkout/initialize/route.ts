import { NextRequest, NextResponse } from "next/server";
import { getCart } from "lib/database";
import { getUserSession } from "lib/user-session";
import { cookies } from "next/headers";
import {
  CouponValidationError,
  validateCouponForCheckout,
} from "lib/coupon-validation";

interface CheckoutData {
  email: string;
  phone: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  saveAddress: boolean;
  couponCode?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutData = await request.json();

    // Validate required fields
    if (!body.email || !body.phone || !body.shippingAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get cart
    const cart = await getCart();
    if (!cart || cart.lines.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Get user session if available
    const session = await getUserSession();

    // Calculate total amount (shipping quoted after order is ready)
    const shippingCost = 0;
    const subtotal = parseFloat(cart.cost.subtotalAmount.amount);
    let discountAmount = 0;
    let appliedCouponCode: string | null = null;

    if (body.couponCode) {
      try {
        const { coupon, discountAmount: computedDiscount } =
          await validateCouponForCheckout({
            code: body.couponCode,
            cartTotal: subtotal,
            userId: session?.id,
            sessionId: session?.id ? undefined : cart.id,
          });

        discountAmount = computedDiscount;
        appliedCouponCode = coupon.code;
      } catch (error) {
        if (error instanceof CouponValidationError) {
          return NextResponse.json(
            { error: error.message },
            { status: error.status },
          );
        }
        throw error;
      }
    }

    const totalAmount = subtotal - discountAmount + shippingCost;

    // Convert amount to kobo (Paystack uses kobo for NGN)
    const amountInKobo = Math.round(totalAmount * 100);

    // Store checkout data in a cookie temporarily (will be retrieved after payment)
    const checkoutSession = {
      email: body.email,
      phone: body.phone,
      shippingAddress: body.shippingAddress,
      billingAddress: body.billingAddress,
      saveAddress: body.saveAddress,
      userId: session?.id,
      cartId: cart.id,
      subtotalAmount: subtotal,
      shippingAmount: shippingCost,
      discountAmount,
      couponCode: appliedCouponCode,
      notes: body.notes?.trim() || null,
      totalAmount,
    };

    (await cookies()).set("checkout-session", JSON.stringify(checkoutSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 30, // 30 minutes
      path: "/",
    });

    // Initialize Paystack payment
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 },
      );
    }

    const callbackUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/checkout/verify`;

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: body.email,
          amount: amountInKobo,
          currency: "NGN",
          callback_url: callbackUrl,
          metadata: {
            customer_name: `${body.shippingAddress.firstName} ${body.shippingAddress.lastName}`,
            phone: body.phone,
            cart_id: cart.id,
            checkout_user_id: session?.id || null,
            checkout_email: body.email,
            checkout_shipping_address: body.shippingAddress,
            checkout_billing_address: body.billingAddress,
            checkout_save_address: Boolean(body.saveAddress),
            checkout_notes: body.notes?.trim() || null,
            ...(appliedCouponCode
              ? {
                  coupon_code: appliedCouponCode,
                  discount_amount: discountAmount,
                }
              : {}),
          },
        }),
      },
    );

    const paystackData = await paystackResponse.json();

    if (!paystackData.status || !paystackData.data) {
      console.error("Paystack initialization failed:", paystackData);
      return NextResponse.json(
        { error: paystackData.message || "Failed to initialize payment" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (error) {
    console.error("Checkout initialization error:", error);
    return NextResponse.json(
      { error: "An error occurred during checkout" },
      { status: 500 },
    );
  }
}
