import { verifyPaystackReference } from "lib/payments/paystack";
import { reconcilePaystackPayment } from "lib/payments/paystack-reconcile";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toCheckoutError = (conflictCode: string) => {
  switch (conflictCode) {
    case "amount_mismatch":
      return "payment_amount_mismatch";
    case "currency_mismatch":
      return "payment_currency_mismatch";
    case "cart_not_found":
      return "cart_not_found";
    case "metadata_mismatch":
      return "cart_mismatch";
    case "invalid_status":
      return "payment_failed";
    case "missing_metadata":
      return "invalid_metadata";
    default:
      return "payment_verification_failed";
  }
};

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference");
    if (!reference) {
      return redirect("/checkout?error=invalid_reference");
    }

    const verifyData = await verifyPaystackReference(reference);
    const paystackData = verifyData.data;

    const metadata = isRecord(paystackData?.metadata) ? paystackData.metadata : {};
    const cookieStore = await cookies();
    const checkoutCookie = cookieStore.get("checkout-session");
    let checkoutCartId: string | null = null;

    if (checkoutCookie?.value) {
      try {
        const parsed = JSON.parse(checkoutCookie.value) as { cartId?: string };
        checkoutCartId = typeof parsed.cartId === "string" ? parsed.cartId : null;
      } catch {
        checkoutCartId = null;
      }
    }

    const result = await reconcilePaystackPayment({
      reference,
      amount: Number(paystackData?.amount),
      currencyCode:
        typeof paystackData?.currency === "string" ? paystackData.currency : null,
      paystackStatus:
        typeof paystackData?.status === "string" ? paystackData.status : null,
      metadata,
      customer: isRecord(paystackData?.customer)
        ? {
            email:
              typeof paystackData.customer.email === "string"
                ? paystackData.customer.email
                : undefined,
            first_name:
              typeof paystackData.customer.first_name === "string"
                ? paystackData.customer.first_name
                : undefined,
            last_name:
              typeof paystackData.customer.last_name === "string"
                ? paystackData.customer.last_name
                : undefined,
            phone:
              typeof paystackData.customer.phone === "string"
                ? paystackData.customer.phone
                : undefined,
          }
        : null,
      payload: verifyData,
      eventType: "verify_callback",
      checkoutCartId,
    });

    if (result.status === "paid") {
      cookieStore.delete("checkout-session");
      cookieStore.delete("cartId");
      cookieStore.delete("cartSessionId");
      return redirect(
        `/checkout/success?order=${encodeURIComponent(result.orderNumber)}`,
      );
    }

    if (result.status === "conflict") {
      return redirect(`/checkout?error=${toCheckoutError(result.conflictCode)}`);
    }

    return redirect("/checkout?error=verification_failed");
  } catch (error) {
    if (
      (error as Error & { digest?: string }).digest?.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("Payment verification error:", error);
    return redirect("/checkout?error=verification_failed");
  }
}
