import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "lib/db";
import {
  customOrderQuoteTokens,
  customOrderQuotes,
  customOrderRequests,
} from "lib/db/schema";
import {
  buildQuotePaymentCallbackUrl,
  hashCustomOrderPublicToken,
  isCustomOrderFeatureEnabled,
} from "lib/custom-order-utils";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> },
) {
  try {
    if (!isCustomOrderFeatureEnabled()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { quoteId } = await context.params;
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: "Quote token is required" },
        { status: 400 },
      );
    }

    const tokenHash = hashCustomOrderPublicToken(token);
    const now = new Date();

    const [quote] = await db
      .select()
      .from(customOrderQuotes)
      .where(eq(customOrderQuotes.id, quoteId))
      .limit(1);

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const [requestRow] = await db
      .select()
      .from(customOrderRequests)
      .where(eq(customOrderRequests.id, quote.requestId))
      .limit(1);

    if (!requestRow) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (quote.status === "paid" || requestRow.status === "paid") {
      return NextResponse.json(
        { error: "This quote has already been paid" },
        { status: 400 },
      );
    }

    if (quote.expiresAt && quote.expiresAt < now) {
      return NextResponse.json({ error: "This quote has expired" }, { status: 400 });
    }

    const [quoteToken] = await db
      .select()
      .from(customOrderQuoteTokens)
      .where(
        and(
          eq(customOrderQuoteTokens.quoteId, quote.id),
          eq(customOrderQuoteTokens.tokenHash, tokenHash),
          isNull(customOrderQuoteTokens.usedAt),
          gt(customOrderQuoteTokens.expiresAt, now),
        ),
      )
      .limit(1);

    if (!quoteToken) {
      return NextResponse.json(
        { error: "Invalid or expired quote token" },
        { status: 401 },
      );
    }

    const amount = Number(quote.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid quote amount" },
        { status: 400 },
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 },
      );
    }

    const callbackUrl = buildQuotePaymentCallbackUrl();
    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: requestRow.email,
          amount: Math.round(amount * 100),
          currency: quote.currencyCode || "NGN",
          callback_url: callbackUrl,
          metadata: {
            custom_quote_id: quote.id,
            custom_request_id: requestRow.id,
            custom_request_number: requestRow.requestNumber,
          },
        }),
      },
    );

    const paystackData = await paystackResponse.json();
    if (!paystackData.status || !paystackData.data) {
      return NextResponse.json(
        { error: paystackData.message || "Failed to initialize payment" },
        { status: 500 },
      );
    }

    (await cookies()).set(
      "custom-quote-session",
      JSON.stringify({
        quoteId: quote.id,
        requestId: requestRow.id,
        tokenHash,
        email: requestRow.email,
        customerName: requestRow.customerName,
        phone: requestRow.phone,
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

    await db
      .update(customOrderQuotes)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(customOrderQuotes.id, quote.id));

    await db
      .update(customOrderRequests)
      .set({ status: "awaiting_payment", updatedAt: new Date() })
      .where(eq(customOrderRequests.id, requestRow.id));

    return NextResponse.json({
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (error) {
    console.error("Failed to initialize custom quote payment:", error);
    return NextResponse.json(
      { error: "Failed to initialize quote payment" },
      { status: 500 },
    );
  }
}
