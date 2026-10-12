import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "lib/db";
import { customOrderQuotes, customOrderRequests } from "lib/db/schema";
import { buildQuotePaymentCallbackUrl } from "lib/custom-order-utils";
import { registerInitializedPaymentTransaction } from "lib/payments/paystack-reconcile";

type QuoteRow = typeof customOrderQuotes.$inferSelect;
type RequestRow = typeof customOrderRequests.$inferSelect;

/**
 * deposit = first part of the quote (starts production), full = whole quote
 * plus delivery, balance = what's left on the order before it's sent.
 */
export type CustomPaymentKind = "deposit" | "full" | "balance";

export class QuotePaymentError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Checks a quote can still be accepted: newest version, not paid, not expired. */
export async function assertQuotePayable(quote: QuoteRow, request: RequestRow) {
  if (quote.status === "paid" || request.status === "paid" || request.convertedOrderId)
    throw new QuotePaymentError("This quote has already been paid", 400);
  if (!["sent", "accepted"].includes(quote.status))
    throw new QuotePaymentError("This quote is no longer available", 400);
  if (quote.expiresAt && quote.expiresAt < new Date())
    throw new QuotePaymentError("This quote has expired", 400);

  // Only the newest quote can be paid; sending a new one replaces the old.
  const [latest] = await db
    .select({ id: customOrderQuotes.id })
    .from(customOrderQuotes)
    .where(eq(customOrderQuotes.requestId, request.id))
    .orderBy(desc(customOrderQuotes.version))
    .limit(1);
  if (latest && latest.id !== quote.id)
    throw new QuotePaymentError("This quote has been replaced by a newer one", 400);
}

/**
 * Starts a Paystack payment and returns the Paystack page to send the
 * customer to. The caller has checked the customer may pay, and worked out
 * `amount` (naira) from stored values — reconcile checks it again.
 * `tokenHash` is the legacy one-time quote token, when paying from an old link.
 */
export async function startCustomPayment({
  request,
  quote,
  kind,
  amount,
  tokenHash = null,
}: {
  request: RequestRow;
  quote: QuoteRow;
  kind: CustomPaymentKind;
  amount: number;
  tokenHash?: string | null;
}) {
  if (!Number.isFinite(amount) || amount <= 0)
    throw new QuotePaymentError("Invalid payment amount", 400);

  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey)
    throw new QuotePaymentError("Payment gateway not configured", 500);

  const kobo = Math.round(amount * 100);
  const metadata = {
    custom_quote_id: quote.id,
    custom_request_id: request.id,
    custom_request_number: request.requestNumber,
    custom_payment_kind: kind,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response: Response;
  try {
    response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: request.email,
        amount: kobo,
        currency: quote.currencyCode || "NGN",
        callback_url: buildQuotePaymentCallbackUrl(),
        metadata,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      throw new QuotePaymentError(
        "Payment gateway timed out. Please try again.",
        504,
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json();
  if (!data.status || !data.data)
    throw new QuotePaymentError(
      data.message || "Failed to initialize payment",
      500,
    );
  const reference =
    typeof data.data.reference === "string" ? data.data.reference : null;
  if (!reference)
    throw new QuotePaymentError(
      "Invalid payment reference returned by gateway",
      500,
    );

  await registerInitializedPaymentTransaction({
    reference,
    source: "custom_quote",
    amount: kobo,
    currencyCode: quote.currencyCode || "NGN",
    metadata,
    payload: data.data,
  });

  (await cookies()).set(
    "custom-quote-session",
    JSON.stringify({
      quoteId: quote.id,
      requestId: request.id,
      tokenHash,
      email: request.email,
      customerName: request.customerName,
      phone: request.phone,
      amount,
      currencyCode: quote.currencyCode,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 30,
      path: "/",
    },
  );

  if (kind !== "balance") {
    await db
      .update(customOrderQuotes)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(customOrderQuotes.id, quote.id));
    await db
      .update(customOrderRequests)
      .set({ status: "awaiting_payment", updatedAt: new Date() })
      .where(eq(customOrderRequests.id, request.id));
  }

  return {
    authorizationUrl: data.data.authorization_url as string,
    reference,
  };
}
