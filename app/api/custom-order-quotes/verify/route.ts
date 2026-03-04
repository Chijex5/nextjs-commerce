import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { verifyPaystackReference } from "lib/payments/paystack";
import { reconcilePaystackPayment } from "lib/payments/paystack-reconcile";
import { isCustomOrderFeatureEnabled } from "lib/custom-order-utils";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toCustomOrderError = (conflictCode: string) => {
  switch (conflictCode) {
    case "amount_mismatch":
      return "payment_amount_mismatch";
    case "currency_mismatch":
      return "payment_currency_mismatch";
    case "quote_not_found":
    case "request_not_found":
      return "quote_not_found";
    case "metadata_mismatch":
    case "missing_metadata":
      return "invalid_metadata";
    case "invalid_status":
      return "payment_failed";
    default:
      return "payment_verification_failed";
  }
};

export async function GET(request: NextRequest) {
  try {
    if (!isCustomOrderFeatureEnabled()) {
      return redirect("/custom-orders?error=feature_disabled");
    }

    const reference = request.nextUrl.searchParams.get("reference");
    if (!reference) {
      return redirect("/custom-orders?error=invalid_reference");
    }

    const verifyData = await verifyPaystackReference(reference);
    const paystackData = verifyData.data;
    const metadata = isRecord(paystackData?.metadata) ? paystackData.metadata : {};

    const cookieStore = await cookies();
    const quoteSessionCookie = cookieStore.get("custom-quote-session");

    let customQuoteId: string | null = null;
    let customRequestId: string | null = null;
    let customQuoteTokenHash: string | null = null;

    if (quoteSessionCookie?.value) {
      try {
        const parsed = JSON.parse(quoteSessionCookie.value) as {
          quoteId?: string;
          requestId?: string;
          tokenHash?: string;
        };
        customQuoteId = typeof parsed.quoteId === "string" ? parsed.quoteId : null;
        customRequestId =
          typeof parsed.requestId === "string" ? parsed.requestId : null;
        customQuoteTokenHash =
          typeof parsed.tokenHash === "string" ? parsed.tokenHash : null;
      } catch {
        customQuoteId = null;
        customRequestId = null;
        customQuoteTokenHash = null;
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
      customQuoteId,
      customRequestId,
      customQuoteTokenHash,
    });

    if (result.status === "paid") {
      cookieStore.delete("custom-quote-session");
      return redirect(
        `/checkout/success?order=${encodeURIComponent(result.orderNumber)}`,
      );
    }

    if (result.status === "conflict") {
      return redirect(`/custom-orders?error=${toCustomOrderError(result.conflictCode)}`);
    }

    return redirect("/custom-orders?error=payment_verification_failed");
  } catch (error) {
    console.error("Failed to verify custom quote payment:", error);
    return redirect("/custom-orders?error=payment_verification_failed");
  }
}
