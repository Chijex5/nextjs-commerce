import { and, eq } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { paymentEvents, paymentTransactions } from "lib/db/schema";
import { verifyPaystackReference } from "lib/payments/paystack";
import { NextRequest, NextResponse } from "next/server";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function POST(
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
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.id, id))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const verifyResult = await verifyPaystackReference(payment.reference);
    const data = verifyResult.data;

    const metadata = isRecord(data?.metadata) ? data.metadata : payment.metadata;
    const customer = isRecord(data?.customer) ? data.customer : payment.customer;

    await db
      .update(paymentTransactions)
      .set({
        amount: Number.isFinite(Number(data?.amount))
          ? Number(data?.amount)
          : payment.amount,
        currencyCode:
          typeof data?.currency === "string" ? data.currency : payment.currencyCode,
        status: verifyResult.status ? "processing" : "failed",
        paystackStatus: typeof data?.status === "string" ? data.status : null,
        metadata,
        customer,
        payload: verifyResult as unknown as Record<string, unknown>,
        lastVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paymentTransactions.id, payment.id));

    await db.insert(paymentEvents).values({
      paymentTransactionId: payment.id,
      provider: "paystack",
      reference: payment.reference,
      source: payment.source,
      eventType: "admin_verify",
      status: verifyResult.status ? "verified" : "failed",
      message: verifyResult.message || "Admin verification refresh",
      payload: verifyResult as unknown as Record<string, unknown>,
    });

    const [updated] = await db
      .select()
      .from(paymentTransactions)
      .where(
        and(
          eq(paymentTransactions.id, payment.id),
          eq(paymentTransactions.provider, "paystack"),
        ),
      )
      .limit(1);

    return NextResponse.json({
      success: true,
      payment: updated
        ? {
            ...updated,
            amountNaira: Number(updated.amount) / 100,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
            lastVerifiedAt: updated.lastVerifiedAt?.toISOString() || null,
            resolvedAt: updated.resolvedAt?.toISOString() || null,
          }
        : null,
    });
  } catch (error) {
    console.error("Failed to verify payment transaction:", error);
    return NextResponse.json(
      { error: "Failed to verify payment transaction" },
      { status: 500 },
    );
  }
}
