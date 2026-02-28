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
  toQuoteStatus,
  toRequestStatus,
} from "lib/custom-order-utils";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> },
) {
  try {
    if (!isCustomOrderFeatureEnabled()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { quoteId } = await context.params;
    const token = request.nextUrl.searchParams.get("token")?.trim() || "";
    if (!token) {
      return NextResponse.json({ error: "Missing quote token" }, { status: 400 });
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

    return NextResponse.json({
      quote: {
        id: quote.id,
        requestId: quote.requestId,
        requestNumber: requestRow.requestNumber,
        amount: String(quote.amount),
        currencyCode: quote.currencyCode,
        breakdown: quote.breakdown,
        note: quote.note,
        status: toQuoteStatus(quote.status),
        expiresAt: quote.expiresAt?.toISOString() || null,
        customerName: requestRow.customerName,
        email: requestRow.email,
        title: requestRow.title,
        requestStatus: toRequestStatus(requestRow.status),
        canPay: quote.status !== "paid" && requestRow.status !== "paid",
      },
    });
  } catch (error) {
    console.error("Failed to fetch quote:", error);
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
