import { verifyPaystackReference } from "lib/payments/paystack";
import { reconcilePaystackPayment } from "lib/payments/paystack-reconcile";
import { limitByIp } from "lib/rate-limit";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const str = (value: unknown) => (typeof value === "string" ? value : undefined);

/** Error codes the checkout page knows how to explain. */
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

type Outcome = { ok: true; orderNumber: string } | { ok: false; error: string };

/** Asks Paystack what happened, then creates (or finds) the order. */
async function verifyAndReconcile(reference: string): Promise<Outcome> {
  const verifyData = await verifyPaystackReference(reference);
  const data = verifyData.data;

  const result = await reconcilePaystackPayment({
    reference,
    amount: Number(data?.amount),
    currencyCode: str(data?.currency) ?? null,
    paystackStatus: str(data?.status) ?? null,
    metadata: isRecord(data?.metadata) ? data.metadata : {},
    customer: isRecord(data?.customer)
      ? {
          email: str(data.customer.email),
          first_name: str(data.customer.first_name),
          last_name: str(data.customer.last_name),
          phone: str(data.customer.phone),
        }
      : null,
    payload: verifyData,
    eventType: "verify_callback",
  });

  if (result.status === "paid") {
    const cookieStore = await cookies();
    cookieStore.delete("cartId");
    cookieStore.delete("cartSessionId");
    return { ok: true, orderNumber: result.orderNumber };
  }
  if (result.status === "conflict") {
    return { ok: false, error: toCheckoutError(result.conflictCode) };
  }
  return { ok: false, error: "verification_failed" };
}

/** Paystack's redirect lands here (the fallback when the popup can't open). */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference) redirect("/checkout?error=invalid_reference");

  let outcome: Outcome;
  try {
    outcome = await verifyAndReconcile(reference);
  } catch (error) {
    console.error("Payment verification error:", error);
    outcome = { ok: false, error: "verification_failed" };
  }

  redirect(
    outcome.ok
      ? `/checkout/success?order=${encodeURIComponent(outcome.orderNumber)}`
      : `/checkout?error=${outcome.error}&reference=${encodeURIComponent(reference)}`,
  );
}

/** The popup's onSuccess posts here, then the page moves to the success screen. */
export async function POST(request: NextRequest) {
  const limited = limitByIp(request, "checkout-verify", 30, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const reference =
    isRecord(body) && typeof body.reference === "string"
      ? body.reference.trim()
      : "";
  if (!reference) {
    return NextResponse.json({ error: "invalid_reference" }, { status: 400 });
  }

  try {
    const outcome = await verifyAndReconcile(reference);
    return outcome.ok
      ? NextResponse.json({ orderNumber: outcome.orderNumber })
      : NextResponse.json({ error: outcome.error }, { status: 409 });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "verification_failed" }, { status: 502 });
  }
}
