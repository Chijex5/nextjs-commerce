import { parseCheckoutDetails } from "lib/checkout/details";
import { quoteCheckout } from "lib/checkout/quote";
import { toSnapshot } from "lib/checkout/snapshot";
import { getCart } from "lib/database";
import { handleApiError } from "lib/errors";
import { subscribeEmail } from "lib/marketing/subscribe";
import {
  reconcilePaystackPayment,
  registerInitializedPaymentTransaction,
} from "lib/payments/paystack-reconcile";
import { limitByIp } from "lib/rate-limit";
import { baseUrl } from "lib/utils";
import { getUserSession } from "lib/user-session";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Starts payment for the bag. The total is priced here from the database
 * (never from the browser) and stored with the transaction as a snapshot, so
 * the order is created at exactly the price the customer saw and paid.
 *
 * Responses:
 *  - 200 { accessCode, authorizationUrl, reference } → open Paystack
 *  - 200 { freeCheckout, orderNumber }               → coupon covered it all
 *  - 400 { error, fieldErrors }                       → fix the form
 *  - 409 { error, quote }                             → price/stock changed;
 *        show the new quote and let the customer press Pay again
 */
export async function POST(request: NextRequest) {
  try {
    const limited = limitByIp(request, "checkout-initialize", 20, 60_000);
    if (limited) return limited;

    const body = await request.json().catch(() => null);
    const parsed = parseCheckoutDetails(body);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "Check the highlighted fields", fieldErrors: parsed.errors },
        { status: 400 },
      );
    }
    const details = parsed.details;
    const expectedAmountInKobo =
      body && typeof body.expectedAmountInKobo === "number"
        ? body.expectedAmountInKobo
        : null;

    const cart = await getCart();
    if (!cart?.id || cart.lines.length === 0) {
      return NextResponse.json(
        { error: "Your bag is empty", code: "empty_cart" },
        { status: 400 },
      );
    }

    const session = await getUserSession();
    const checkoutSessionId = session?.id ? null : cart.id;

    const quote = await quoteCheckout({
      cartId: cart.id,
      address: details.address,
      couponCode: details.couponCode,
      userId: session?.id,
      sessionId: checkoutSessionId,
    });

    if (quote.issues.length || quote.lines.length === 0) {
      return NextResponse.json(
        {
          error: "Some items in your bag have changed",
          code: "bag_changed",
          quote,
        },
        { status: 409 },
      );
    }
    if (details.couponCode && quote.couponError) {
      return NextResponse.json(
        { error: quote.couponError, code: "coupon_invalid", quote },
        { status: 409 },
      );
    }
    if (
      expectedAmountInKobo !== null &&
      expectedAmountInKobo !== quote.amountInKobo
    ) {
      return NextResponse.json(
        { error: "Your total was updated", code: "price_changed", quote },
        { status: 409 },
      );
    }

    // Record marketing consent as soon as it's given, whether or not payment
    // completes. Never block checkout on it.
    if (details.acceptsMarketing) {
      await subscribeEmail({
        email: details.email,
        name: `${details.address.firstName} ${details.address.lastName}`,
        source: "checkout",
      }).catch((err) =>
        console.error("Failed to record checkout marketing consent:", err),
      );
    }

    const shippingAddress = {
      ...details.address,
      phone1: details.phone1,
      phone2: details.phone2 ?? null,
      country: "NG",
    };
    const snapshot = toSnapshot(cart.id, quote);

    // Everything reconcile needs. Our stored copy wins over whatever Paystack
    // echoes back, so it can't be tampered with on the way.
    const checkoutMetadata = {
      source: "catalog_checkout",
      customer_name: `${details.address.firstName} ${details.address.lastName}`,
      phone: details.phone1,
      phone1: details.phone1,
      phone2: details.phone2 ?? null,
      cart_id: cart.id,
      checkout_session_id: checkoutSessionId,
      checkout_user_id: session?.id || null,
      checkout_email: details.email,
      checkout_shipping_address: shippingAddress,
      checkout_billing_address: shippingAddress,
      checkout_save_address: Boolean(details.saveAddress && session?.id),
      checkout_notes: details.notes ?? null,
      ...(snapshot.couponCode
        ? {
            coupon_code: snapshot.couponCode,
            discount_amount: snapshot.discount,
            product_discount_amount: snapshot.productDiscount,
            shipping_discount_amount: snapshot.shippingDiscount,
          }
        : {}),
    };

    if (quote.amountInKobo <= 0) {
      if (!snapshot.couponCode) {
        return NextResponse.json(
          { error: "Invalid payment amount" },
          { status: 400 },
        );
      }

      // Same bag + details → same reference, so a double click can't make
      // two orders.
      const reference = `FREE-${createHash("sha256")
        .update(JSON.stringify({ snapshot, checkoutMetadata }))
        .digest("hex")
        .slice(0, 24)
        .toUpperCase()}`;

      await registerInitializedPaymentTransaction({
        reference,
        source: "catalog_checkout",
        amount: 0,
        currencyCode: "NGN",
        metadata: { ...checkoutMetadata, payment_provider: "coupon_free" },
        snapshot,
        payload: { source: "free_checkout" },
      });

      const result = await reconcilePaystackPayment({
        reference,
        amount: 0,
        currencyCode: "NGN",
        paystackStatus: "success",
        metadata: { ...checkoutMetadata, payment_provider: "coupon_free" },
        customer: {
          email: details.email,
          first_name: details.address.firstName,
          last_name: details.address.lastName,
          phone: details.phone1,
        },
        payload: {
          source: "free_checkout",
          reason: "discount_covered_checkout",
          couponCode: snapshot.couponCode,
        },
        eventType: "admin_reconcile",
        checkoutCartId: cart.id,
      });

      if (result.status !== "paid") {
        return NextResponse.json(
          { error: result.message || "Failed to complete free checkout" },
          { status: 400 },
        );
      }

      const cookieStore = await cookies();
      cookieStore.delete("cartId");
      cookieStore.delete("cartSessionId");

      return NextResponse.json({
        freeCheckout: true,
        orderNumber: result.orderNumber,
        orderId: result.orderId,
      });
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 },
      );
    }

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
            email: details.email,
            amount: quote.amountInKobo,
            currency: "NGN",
            callback_url: `${baseUrl}/api/checkout/verify`,
            // Transfer first: it's what most Nigerian shoppers reach for.
            channels: ["bank_transfer", "card", "ussd", "bank"],
            metadata: checkoutMetadata,
          }),
          signal: paystackController.signal,
        },
      );
    } catch (fetchError: unknown) {
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Payment is taking too long to start. Please try again." },
          { status: 504 },
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(paystackTimeout);
    }

    const paystackData = await paystackResponse.json().catch(() => ({}));
    const reference =
      typeof paystackData?.data?.reference === "string"
        ? paystackData.data.reference
        : null;

    if (!paystackData?.status || !reference) {
      console.error("Paystack initialization failed:", paystackData);
      return NextResponse.json(
        { error: "We couldn't start the payment. Please try again." },
        { status: 502 },
      );
    }

    await registerInitializedPaymentTransaction({
      reference,
      source: "catalog_checkout",
      amount: quote.amountInKobo,
      currencyCode: "NGN",
      metadata: checkoutMetadata,
      snapshot,
      payload: paystackData.data,
    });

    return NextResponse.json({
      accessCode: paystackData.data.access_code,
      authorizationUrl: paystackData.data.authorization_url,
      reference,
      amountInKobo: quote.amountInKobo,
    });
  } catch (error) {
    return handleApiError(error, "Checkout initialization");
  }
}
