import { desc, eq } from "drizzle-orm";
import { db } from "lib/db";
import { customOrderQuotes, customOrderRequests, orders } from "lib/db/schema";
import { isCustomOrderFeatureEnabled } from "lib/custom-order-utils";
import { getRequestForCustomer } from "lib/custom-orders/access";
import { deliveryFee, readDeliveryAddress } from "lib/custom-orders/delivery";
import {
  QuotePaymentError,
  assertQuotePayable,
  startCustomPayment,
} from "lib/custom-orders/payment";
import { NextRequest, NextResponse } from "next/server";

/**
 * Pay for a custom request:
 * - quoted: accept the price — deposit (or everything) plus the delivery address;
 * - balance_due: pay what's left before the pair is sent.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestNumber: string }> },
) {
  try {
    if (!isCustomOrderFeatureEnabled())
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { requestNumber } = await context.params;
    const body = await request.json().catch(() => ({}));
    const row = await getRequestForCustomer(
      requestNumber,
      typeof body.t === "string" ? body.t : null,
    );
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [quote] = await db
      .select()
      .from(customOrderQuotes)
      .where(eq(customOrderQuotes.requestId, row.id))
      .orderBy(desc(customOrderQuotes.version))
      .limit(1);
    if (!quote)
      return NextResponse.json({ error: "There's no price to pay yet" }, { status: 400 });

    if (row.status === "balance_due") {
      const [order] = row.convertedOrderId
        ? await db
            .select({ balanceDue: orders.balanceDue })
            .from(orders)
            .where(eq(orders.id, row.convertedOrderId))
            .limit(1)
        : [];
      const balance = Number(order?.balanceDue ?? 0);
      if (!balance)
        return NextResponse.json({ error: "Nothing left to pay" }, { status: 400 });
      return NextResponse.json(
        await startCustomPayment({ request: row, quote, kind: "balance", amount: balance }),
      );
    }

    await assertQuotePayable(quote, row);
    const parsed = readDeliveryAddress(body.address);
    if ("error" in parsed)
      return NextResponse.json({ error: parsed.error }, { status: 400 });

    const items = Number(quote.amount);
    const shipping = deliveryFee(parsed.address, items, row.pairs);
    const deposit = quote.depositAmount ? Number(quote.depositAmount) : null;
    const kind = deposit && body.option !== "full" ? "deposit" : "full";

    // Store what was agreed; reconcile checks the payment against these.
    await db
      .update(customOrderQuotes)
      .set({ shippingAmount: String(shipping), updatedAt: new Date() })
      .where(eq(customOrderQuotes.id, quote.id));
    await db
      .update(customOrderRequests)
      .set({ deliveryAddress: parsed.address, updatedAt: new Date() })
      .where(eq(customOrderRequests.id, row.id));

    return NextResponse.json(
      await startCustomPayment({
        request: row,
        quote: { ...quote, shippingAmount: String(shipping) },
        kind,
        amount: kind === "deposit" ? deposit! : items + shipping,
      }),
    );
  } catch (error) {
    if (error instanceof QuotePaymentError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Failed to start custom request payment:", error);
    return NextResponse.json({ error: "Couldn't start the payment" }, { status: 500 });
  }
}
