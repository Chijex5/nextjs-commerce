import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import {
  customOrderQuoteTokens,
  customOrderQuotes,
  customOrderRequests,
} from "lib/db/schema";
import {
  buildCustomOrderPublicToken,
  buildQuoteAccessUrl,
  hashCustomOrderPublicToken,
  isCustomOrderFeatureEnabled,
} from "lib/custom-order-utils";
import { sendCustomOrderQuoteSent } from "lib/email/order-emails";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!isCustomOrderFeatureEnabled()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const amount =
      typeof body.amount === "number" && Number.isFinite(body.amount)
        ? body.amount
        : 0;
    const currencyCode =
      typeof body.currencyCode === "string" && body.currencyCode.trim()
        ? body.currencyCode.trim().toUpperCase()
        : "NGN";
    const note = typeof body.note === "string" ? body.note.trim() : null;
    const breakdown =
      typeof body.breakdown === "object" && body.breakdown !== null
        ? body.breakdown
        : {};
    const expiresAt =
      typeof body.expiresAt === "string" && body.expiresAt
        ? new Date(body.expiresAt)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero" },
        { status: 400 },
      );
    }

    if (Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid expiry date" },
        { status: 400 },
      );
    }

    const [requestRow] = await db
      .select()
      .from(customOrderRequests)
      .where(eq(customOrderRequests.id, id))
      .limit(1);

    if (!requestRow) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const [latestQuote] = await db
      .select({ version: customOrderQuotes.version })
      .from(customOrderQuotes)
      .where(eq(customOrderQuotes.requestId, id))
      .orderBy(desc(customOrderQuotes.version))
      .limit(1);

    const nextVersion = (latestQuote?.version || 0) + 1;

    const createdQuote = await db.transaction(async (tx) => {
      const [quote] = await tx
        .insert(customOrderQuotes)
        .values({
          requestId: id,
          version: nextVersion,
          amount: String(amount),
          currencyCode,
          breakdown,
          note,
          status: "sent",
          expiresAt,
          createdBy: session.user?.email || null,
        })
        .returning();

      if (!quote) {
        throw new Error("Quote creation failed");
      }

      await tx
        .update(customOrderRequests)
        .set({
          status: "quoted",
          quotedAmount: String(amount),
          currencyCode,
          quoteExpiresAt: expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(customOrderRequests.id, id));

      return quote;
    });

    const publicToken = buildCustomOrderPublicToken();
    const tokenHash = hashCustomOrderPublicToken(publicToken);

    await db.insert(customOrderQuoteTokens).values({
      quoteId: createdQuote.id,
      email: requestRow.email,
      tokenHash,
      expiresAt,
    });

    const quoteUrl = buildQuoteAccessUrl(createdQuote.id, publicToken);

    void sendCustomOrderQuoteSent({
      to: requestRow.email,
      customerName: requestRow.customerName,
      requestNumber: requestRow.requestNumber,
      amount,
      currencyCode,
      quoteUrl,
      expiresAt: expiresAt.toISOString(),
      note,
    });

    return NextResponse.json(
      {
        success: true,
        quote: {
          id: createdQuote.id,
          requestId: createdQuote.requestId,
          version: createdQuote.version,
          amount: String(createdQuote.amount),
          currencyCode: createdQuote.currencyCode,
          status: createdQuote.status,
          expiresAt: createdQuote.expiresAt?.toISOString() || null,
          createdAt: createdQuote.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if ((error as any)?.code === "23505") {
      return NextResponse.json(
        { error: "Duplicate quote version, please retry." },
        { status: 409 },
      );
    }
    console.error("Failed to create quote:", error);
    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 },
    );
  }
}
