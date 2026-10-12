import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { customOrderQuotes, customOrderRequests } from "lib/db/schema";
import {
  buildRequestPageUrl,
  isCustomOrderFeatureEnabled,
} from "lib/custom-order-utils";
import { addSystemMessage } from "lib/custom-orders/messages";
import { getCustomOrderSettings } from "lib/custom-orders/settings";
import { depositFor, quoteLines } from "lib/custom-orders/shared";
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
    // Itemised quote: the total is the sum of the lines. Otherwise a single amount.
    const lines = quoteLines({ lines: body.lines })
      .map((l) => ({ label: l.label.trim().slice(0, 120), amount: Math.round(l.amount) }))
      .filter((l) => l.label && l.amount !== 0)
      .slice(0, 20);
    const amount = lines.length
      ? lines.reduce((sum, l) => sum + l.amount, 0)
      : typeof body.amount === "number" && Number.isFinite(body.amount)
        ? body.amount
        : 0;
    const currencyCode =
      typeof body.currencyCode === "string" && body.currencyCode.trim()
        ? body.currencyCode.trim().toUpperCase()
        : "NGN";
    const note = typeof body.note === "string" ? body.note.trim() : null;
    const breakdown = lines.length ? { lines } : {};
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
    if (requestRow.convertedOrderId) {
      return NextResponse.json(
        { error: "This request has already been paid" },
        { status: 400 },
      );
    }

    const depositAmount =
      body.deposit === true
        ? depositFor(amount, (await getCustomOrderSettings()).depositPercent)
        : null;

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
          depositAmount: depositAmount === null ? null : String(depositAmount),
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

    await addSystemMessage(
      id,
      `Price sent: ₦${amount.toLocaleString("en-NG")}${
        depositAmount ? ` (deposit ₦${depositAmount.toLocaleString("en-NG")})` : ""
      }${note ? ` — ${note}` : ""}`,
    );
    const quoteUrl = buildRequestPageUrl(requestRow.requestNumber);

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
          depositAmount: createdQuote.depositAmount,
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
