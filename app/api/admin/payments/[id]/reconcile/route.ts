import { eq } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { paymentTransactions } from "lib/db/schema";
import { verifyPaystackReference } from "lib/payments/paystack";
import { reconcilePaystackPayment } from "lib/payments/paystack-reconcile";
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

    if (payment.provider !== "paystack") {
      return NextResponse.json(
        { error: "Only Paystack transactions can be reconciled here" },
        { status: 400 },
      );
    }

    const verifyResult = await verifyPaystackReference(payment.reference);
    const paystackData = verifyResult.data;

    const result = await reconcilePaystackPayment({
      reference: payment.reference,
      amount: Number(paystackData?.amount),
      currencyCode:
        typeof paystackData?.currency === "string" ? paystackData.currency : null,
      paystackStatus:
        typeof paystackData?.status === "string" ? paystackData.status : null,
      metadata: isRecord(paystackData?.metadata)
        ? paystackData.metadata
        : (payment.metadata as Record<string, unknown>),
      customer: isRecord(paystackData?.customer)
        ? {
            email:
              typeof paystackData.customer.email === "string"
                ? paystackData.customer.email
                : undefined,
            first_name:
              typeof paystackData.customer.first_name === "string"
                ? paystackData.customer.first_name
                : undefined,
            last_name:
              typeof paystackData.customer.last_name === "string"
                ? paystackData.customer.last_name
                : undefined,
            phone:
              typeof paystackData.customer.phone === "string"
                ? paystackData.customer.phone
                : undefined,
          }
        : null,
      payload: verifyResult,
      eventType: "admin_reconcile",
    });

    return NextResponse.json({
      success: result.status === "paid",
      result,
    });
  } catch (error) {
    console.error("Failed to reconcile payment transaction:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to reconcile payment transaction",
      },
      { status: 500 },
    );
  }
}
