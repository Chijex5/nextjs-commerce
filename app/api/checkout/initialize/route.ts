import { NextRequest, NextResponse } from "next/server";
import { getCart } from "lib/database";
import { getUserSession } from "lib/user-session";
import { cookies } from "next/headers";
import { registerInitializedPaymentTransaction } from "lib/payments/paystack-reconcile";
import {
  CouponValidationError,
  validateCouponForCheckout,
} from "lib/coupon-validation";
import { calculateShippingAmount } from "lib/shipping";

type LegacyCheckoutAddress = {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  postcode?: string;
  country?: string;
};

type CheckoutAddress = {
  firstName?: string;
  lastName?: string;
  streetAddress?: string;
  nearestBusStop?: string;
  landmark?: string;
  ward?: string;
  lga?: string;
  state?: string;
  phone1?: string;
  phone2?: string;
  country?: string;
};

interface CheckoutData {
  email: string;
  phone: string;
  shippingAddress: CheckoutAddress | LegacyCheckoutAddress;
  billingAddress?: CheckoutAddress | LegacyCheckoutAddress | null;
  saveAddress: boolean;
  couponCode?: string;
  notes?: string;
}

const normalizeCheckoutAddress = (
  input: CheckoutAddress | LegacyCheckoutAddress | null | undefined,
): CheckoutAddress => {
  const safe = input || {};
  if ("streetAddress" in safe || "lga" in safe || "ward" in safe) {
    return {
      firstName: safe.firstName,
      lastName: safe.lastName,
      streetAddress: (safe as CheckoutAddress).streetAddress,
      nearestBusStop: (safe as CheckoutAddress).nearestBusStop,
      landmark: (safe as CheckoutAddress).landmark,
      ward: (safe as CheckoutAddress).ward,
      lga: (safe as CheckoutAddress).lga,
      state: safe.state,
      phone1: (safe as CheckoutAddress).phone1,
      phone2: (safe as CheckoutAddress).phone2,
      country: safe.country,
    };
  }

  const legacy = safe as LegacyCheckoutAddress;
  return {
    firstName: legacy.firstName,
    lastName: legacy.lastName,
    streetAddress: legacy.address,
    lga: legacy.city,
    state: legacy.state,
    country: legacy.country,
  };
};

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

    const shippingAddress = normalizeCheckoutAddress(body.shippingAddress);
    const billingAddress = body.billingAddress
      ? normalizeCheckoutAddress(body.billingAddress)
      : shippingAddress;

    // Get cart
    const cart = await getCart();
    if (!cart || cart.lines.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Get user session if available
    const session = await getUserSession();

    // Calculate total amount (shipping calculated from address and item count)
    const subtotal = parseFloat(cart.cost.subtotalAmount.amount);
    const totalQuantity = cart.lines.reduce(
      (sum, line) => sum + line.quantity,
      0,
    );
    const shippingCost = calculateShippingAmount({
      address: shippingAddress,
      subtotalAmount: subtotal,
      totalQuantity,
    });
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
      shippingAddress,
      billingAddress,
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

    const paystackController = new AbortController();
    const paystackTimeout = setTimeout(() => paystackController.abort(), 10000);

    let paystackResponse: Response;
    try {
      paystackResponse = await fetch(
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
              customer_name: `${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}`.trim(),
              phone: body.phone,
              cart_id: cart.id,
              checkout_user_id: session?.id || null,
              checkout_email: body.email,
              checkout_shipping_address: shippingAddress,
              checkout_billing_address: billingAddress,
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
          signal: paystackController.signal,
        },
      );
    } catch (fetchError: unknown) {
      if (
        fetchError instanceof Error &&
        fetchError.name === "AbortError"
      ) {
        return NextResponse.json(
          { error: "Payment gateway timed out. Please try again." },
          { status: 504 },
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(paystackTimeout);
    }

    const paystackData = await paystackResponse.json();

    if (!paystackData.status || !paystackData.data) {
      console.error("Paystack initialization failed:", paystackData);
      return NextResponse.json(
        { error: paystackData.message || "Failed to initialize payment" },
        { status: 500 },
      );
    }

    const reference =
      typeof paystackData.data.reference === "string"
        ? paystackData.data.reference
        : null;

    if (!reference) {
      return NextResponse.json(
        { error: "Invalid payment reference returned by gateway" },
        { status: 500 },
      );
    }

    await registerInitializedPaymentTransaction({
      reference,
      source: "catalog_checkout",
      amount: amountInKobo,
      currencyCode: "NGN",
      metadata: {
        customer_name: `${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}`.trim(),
        phone: body.phone,
        cart_id: cart.id,
        checkout_user_id: session?.id || null,
        checkout_email: body.email,
        checkout_shipping_address: shippingAddress,
        checkout_billing_address: billingAddress,
        checkout_save_address: Boolean(body.saveAddress),
        checkout_notes: body.notes?.trim() || null,
        ...(appliedCouponCode
          ? {
              coupon_code: appliedCouponCode,
              discount_amount: discountAmount,
            }
          : {}),
      },
      payload: paystackData.data,
    });

    return NextResponse.json({
      authorizationUrl: paystackData.data.authorization_url,
      reference,
    });
  } catch (error) {
    console.error("Checkout initialization error:", error);
    return NextResponse.json(
      { error: "An error occurred during checkout" },
      { status: 500 },
    );
  }
}
