import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "lib/db";
import {
  customOrderQuoteTokens,
  customOrderQuotes,
  customOrderRequests,
} from "lib/db/schema";
import {
  hashCustomOrderPublicToken,
  isCustomOrderFeatureEnabled,
} from "lib/custom-order-utils";
import {
  QuotePaymentError,
  assertQuotePayable,
  startCustomPayment,
} from "lib/custom-orders/payment";

/** Pay a quote from a legacy one-time quote link (emails sent before the request page existed). */
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

    const [quoteToken] = await db
      .select()
      .from(customOrderQuoteTokens)
      .where(
        and(
          eq(customOrderQuoteTokens.quoteId, quote.id),
          eq(customOrderQuoteTokens.tokenHash, tokenHash),
          isNull(customOrderQuoteTokens.usedAt),
          gt(customOrderQuoteTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (!quoteToken) {
      return NextResponse.json(
        { error: "Invalid or expired quote token" },
        { status: 401 },
      );
    }

    // Old links pay the whole quote (they predate deposits and delivery).
    await assertQuotePayable(quote, requestRow);
    return NextResponse.json(
      await startCustomPayment({
        request: requestRow,
        quote,
        kind: "full",
        amount: Number(quote.amount),
        tokenHash,
      }),
    );
  } catch (error) {
    if (error instanceof QuotePaymentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to initialize custom quote payment:", error);
    return NextResponse.json(
      { error: "Failed to initialize quote payment" },
      { status: 500 },
    );
  }
}
