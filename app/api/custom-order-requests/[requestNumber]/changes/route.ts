import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "lib/db";
import { customOrderQuotes, customOrderRequests } from "lib/db/schema";
import { isCustomOrderFeatureEnabled } from "lib/custom-order-utils";
import { getRequestForCustomer } from "lib/custom-orders/access";
import { MAX_MESSAGE_LENGTH, postMessage } from "lib/custom-orders/messages";
import { limitByIp } from "lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

/**
 * "Request changes" on a price: withdraws the current quote, sends the
 * request back to the shop's queue and posts the customer's note.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestNumber: string }> },
) {
  try {
    if (!isCustomOrderFeatureEnabled())
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const limited = limitByIp(request, "custom-message", 20, 60 * 60_000);
    if (limited) return limited;

    const { requestNumber } = await context.params;
    const body = await request.json().catch(() => ({}));
    const row = await getRequestForCustomer(
      requestNumber,
      typeof body.t === "string" ? body.t : null,
    );
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!["quoted", "awaiting_payment"].includes(row.status))
      return NextResponse.json({ error: "There's no price to change right now" }, { status: 400 });

    const text =
      typeof body.body === "string" ? body.body.trim().slice(0, MAX_MESSAGE_LENGTH) : "";
    if (!text)
      return NextResponse.json({ error: "Tell us what you'd like to change" }, { status: 400 });

    const [quote] = await db
      .select({ id: customOrderQuotes.id })
      .from(customOrderQuotes)
      .where(eq(customOrderQuotes.requestId, row.id))
      .orderBy(desc(customOrderQuotes.version))
      .limit(1);
    if (quote)
      await db
        .update(customOrderQuotes)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(
          and(
            eq(customOrderQuotes.id, quote.id),
            inArray(customOrderQuotes.status, ["sent", "accepted"]),
          ),
        );
    await db
      .update(customOrderRequests)
      .set({ status: "under_review", updatedAt: new Date() })
      .where(eq(customOrderRequests.id, row.id));

    await postMessage({
      request: { ...row, status: "under_review" },
      author: "customer",
      authorName: row.customerName,
      body: `Asked for changes to the price:\n${text}`,
      attachments: [],
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to request quote changes:", error);
    return NextResponse.json({ error: "Couldn't send your request" }, { status: 500 });
  }
}
