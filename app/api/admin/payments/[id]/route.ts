import { and, desc, eq } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { orders, paymentEvents, paymentTransactions } from "lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [payment] = await db
      .select({
        id: paymentTransactions.id,
        provider: paymentTransactions.provider,
        reference: paymentTransactions.reference,
        source: paymentTransactions.source,
        status: paymentTransactions.status,
        amount: paymentTransactions.amount,
        currencyCode: paymentTransactions.currencyCode,
        metadata: paymentTransactions.metadata,
        paystackStatus: paymentTransactions.paystackStatus,
        customer: paymentTransactions.customer,
        payload: paymentTransactions.payload,
        orderId: paymentTransactions.orderId,
        conflictCode: paymentTransactions.conflictCode,
        conflictMessage: paymentTransactions.conflictMessage,
        lastVerifiedAt: paymentTransactions.lastVerifiedAt,
        resolvedAt: paymentTransactions.resolvedAt,
        createdAt: paymentTransactions.createdAt,
        updatedAt: paymentTransactions.updatedAt,
        orderNumber: orders.orderNumber,
        orderCustomerName: orders.customerName,
        orderEmail: orders.email,
      })
      .from(paymentTransactions)
      .leftJoin(orders, eq(paymentTransactions.orderId, orders.id))
      .where(eq(paymentTransactions.id, id))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const events = await db
      .select()
      .from(paymentEvents)
      .where(
        and(
          eq(paymentEvents.paymentTransactionId, payment.id),
          eq(paymentEvents.provider, "paystack"),
        ),
      )
      .orderBy(desc(paymentEvents.createdAt));

    return NextResponse.json({
      payment: {
        ...payment,
        amountNaira: Number(payment.amount) / 100,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
        lastVerifiedAt: payment.lastVerifiedAt?.toISOString() || null,
        resolvedAt: payment.resolvedAt?.toISOString() || null,
      },
      events: events.map((event) => ({
        ...event,
        createdAt: event.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch payment details:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment details" },
      { status: 500 },
    );
  }
}
