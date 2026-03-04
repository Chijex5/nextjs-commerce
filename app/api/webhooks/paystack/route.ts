import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "lib/db";
import { paymentEvents, paymentTransactions } from "lib/db/schema";
import { reconcilePaystackPayment } from "lib/payments/paystack-reconcile";

type PaystackChargeData = {
  reference?: string;
  amount?: number;
  currency?: string;
  status?: string;
  metadata?: Record<string, unknown>;
  customer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toStringOrNull = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

async function recordFailedCharge(data: PaystackChargeData, payload: unknown) {
  const reference = toStringOrNull(data.reference);
  if (!reference) return;

  const metadata = isRecord(data.metadata) ? data.metadata : {};
  const source =
    metadata.custom_quote_id && metadata.custom_request_id
      ? "custom_quote"
      : "catalog_checkout";

  const [transaction] = await db
    .insert(paymentTransactions)
    .values({
      provider: "paystack",
      reference,
      source,
      status: "failed",
      amount: Number.isFinite(Number(data.amount)) ? Number(data.amount) : 0,
      currencyCode: toStringOrNull(data.currency) || "NGN",
      metadata,
      paystackStatus: toStringOrNull(data.status) || "failed",
      customer: isRecord(data.customer)
        ? (data.customer as Record<string, unknown>)
        : null,
      payload: isRecord(payload) ? payload : { raw: payload as unknown },
      conflictCode: "invalid_status",
      conflictMessage: "Paystack reported charge.failed",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [paymentTransactions.provider, paymentTransactions.reference],
      set: {
        status: "failed",
        paystackStatus: toStringOrNull(data.status) || "failed",
        conflictCode: "invalid_status",
        conflictMessage: "Paystack reported charge.failed",
        payload: isRecord(payload) ? payload : { raw: payload as unknown },
        updatedAt: new Date(),
      },
    })
    .returning({ id: paymentTransactions.id });

  if (!transaction) return;

  await db.insert(paymentEvents).values({
    paymentTransactionId: transaction.id,
    provider: "paystack",
    reference,
    source,
    eventType: "webhook",
    status: "failed",
    message: "charge.failed received from Paystack",
    payload: isRecord(payload) ? payload : { raw: payload as unknown },
  });
}

function isValidSignature(body: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    const signature = request.headers.get("x-paystack-signature");
    if (!signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const body = await request.text();
    if (!isValidSignature(body, signature, paystackSecretKey)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body) as {
      event?: string;
      data?: PaystackChargeData;
    };

    if (!event?.event || !event?.data) {
      return NextResponse.json({ status: "ignored" });
    }

    if (event.event === "charge.success") {
      const metadata = isRecord(event.data.metadata) ? event.data.metadata : {};

      await reconcilePaystackPayment({
        reference: toStringOrNull(event.data.reference) || "",
        amount: Number(event.data.amount),
        currencyCode: toStringOrNull(event.data.currency) || "NGN",
        paystackStatus: toStringOrNull(event.data.status) || "success",
        metadata,
        customer: isRecord(event.data.customer)
          ? {
              email:
                typeof event.data.customer.email === "string"
                  ? event.data.customer.email
                  : undefined,
              first_name:
                typeof event.data.customer.first_name === "string"
                  ? event.data.customer.first_name
                  : undefined,
              last_name:
                typeof event.data.customer.last_name === "string"
                  ? event.data.customer.last_name
                  : undefined,
              phone:
                typeof event.data.customer.phone === "string"
                  ? event.data.customer.phone
                  : undefined,
            }
          : null,
        payload: event,
        eventType: "webhook",
      });

      return NextResponse.json({ status: "success" });
    }

    if (event.event === "charge.failed") {
      await recordFailedCharge(event.data, event);
      return NextResponse.json({ status: "success" });
    }

    const reference = toStringOrNull(event.data.reference);
    if (reference) {
      const [existing] = await db
        .select({ id: paymentTransactions.id, source: paymentTransactions.source })
        .from(paymentTransactions)
        .where(
          and(
            eq(paymentTransactions.provider, "paystack"),
            eq(paymentTransactions.reference, reference),
          ),
        )
        .limit(1);

      if (existing) {
        await db.insert(paymentEvents).values({
          paymentTransactionId: existing.id,
          provider: "paystack",
          reference,
          source: existing.source,
          eventType: "webhook",
          status: "ignored",
          message: `Unhandled event: ${event.event}`,
          payload: event as unknown as Record<string, unknown>,
        });
      }
    }

    return NextResponse.json({ status: "ignored" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
