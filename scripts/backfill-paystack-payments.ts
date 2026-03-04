#!/usr/bin/env tsx

import { and, eq } from "drizzle-orm";
import { db } from "lib/db";
import { orders, paymentEvents, paymentTransactions } from "lib/db/schema";

const PAYSTACK_REF_REGEX = /Paystack\s+Ref:\s*([A-Za-z0-9_-]+)/i;

type OrderRow = {
  id: string;
  orderType: string;
  notes: string | null;
  paymentReference: string | null;
  paymentTransactionId: string | null;
  totalAmount: unknown;
  currencyCode: string;
};

function extractReference(order: OrderRow) {
  if (order.paymentReference) return order.paymentReference;
  if (!order.notes) return null;
  const match = order.notes.match(PAYSTACK_REF_REGEX);
  return match?.[1] || null;
}

function getSource(orderType: string) {
  return orderType === "custom" ? "custom_quote" : "catalog_checkout";
}

async function main() {
  const rows = await db
    .select({
      id: orders.id,
      orderType: orders.orderType,
      notes: orders.notes,
      paymentReference: orders.paymentReference,
      paymentTransactionId: orders.paymentTransactionId,
      totalAmount: orders.totalAmount,
      currencyCode: orders.currencyCode,
    })
    .from(orders);

  const groups = new Map<string, OrderRow[]>();
  let scanned = 0;
  let skipped = 0;

  for (const row of rows) {
    scanned += 1;
    const reference = extractReference(row);
    if (!reference) {
      skipped += 1;
      continue;
    }
    const bucket = groups.get(reference) || [];
    bucket.push(row);
    groups.set(reference, bucket);
  }

  let linked = 0;
  let conflicted = 0;

  for (const [reference, groupedOrders] of groups.entries()) {
    if (groupedOrders.length > 1) {
      conflicted += groupedOrders.length;

      const [transaction] = await db
        .insert(paymentTransactions)
        .values({
          provider: "paystack",
          reference,
          source: getSource(groupedOrders[0]?.orderType || "catalog"),
          status: "conflict",
          amount: 0,
          currencyCode: groupedOrders[0]?.currencyCode || "NGN",
          metadata: {
            orderIds: groupedOrders.map((order) => order.id),
            reason: "duplicate_reference_backfill",
          },
          paystackStatus: "unknown",
          conflictCode: "duplicate_reference_backfill",
          conflictMessage:
            "Reference appears on multiple historical orders during backfill",
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [paymentTransactions.provider, paymentTransactions.reference],
          set: {
            status: "conflict",
            conflictCode: "duplicate_reference_backfill",
            conflictMessage:
              "Reference appears on multiple historical orders during backfill",
            updatedAt: new Date(),
          },
        })
        .returning({ id: paymentTransactions.id });

      if (transaction) {
        await Promise.all(
          groupedOrders.map((order) =>
            db.insert(paymentEvents).values({
              paymentTransactionId: transaction.id,
              provider: "paystack",
              reference,
              source: getSource(order.orderType),
              eventType: "backfill",
              status: "conflict",
              message: `Duplicate reference found while backfilling order ${order.id}`,
              payload: {
                orderId: order.id,
              },
            }),
          ),
        );
      }

      continue;
    }

    const order = groupedOrders[0];
    if (!order) continue;

    const amountNaira = Number(order.totalAmount);
    const amountKobo = Number.isFinite(amountNaira)
      ? Math.round(amountNaira * 100)
      : 0;

    const [existingTransaction] = await db
      .select()
      .from(paymentTransactions)
      .where(
        and(
          eq(paymentTransactions.provider, "paystack"),
          eq(paymentTransactions.reference, reference),
        ),
      )
      .limit(1);

    if (existingTransaction && existingTransaction.orderId && existingTransaction.orderId !== order.id) {
      conflicted += 1;

      await db
        .update(paymentTransactions)
        .set({
          status: "conflict",
          conflictCode: "duplicate_reference_backfill",
          conflictMessage:
            "Reference already linked to a different order during backfill",
          updatedAt: new Date(),
        })
        .where(eq(paymentTransactions.id, existingTransaction.id));

      await db.insert(paymentEvents).values({
        paymentTransactionId: existingTransaction.id,
        provider: "paystack",
        reference,
        source: getSource(order.orderType),
        eventType: "backfill",
        status: "conflict",
        message: `Order ${order.id} conflicts with existing linked order ${existingTransaction.orderId}`,
        payload: {
          orderId: order.id,
          existingOrderId: existingTransaction.orderId,
        },
      });

      continue;
    }

    const [transaction] = await db
      .insert(paymentTransactions)
      .values({
        provider: "paystack",
        reference,
        source: getSource(order.orderType),
        status: "paid",
        amount: amountKobo,
        currencyCode: order.currencyCode || "NGN",
        metadata: {
          backfilled: true,
          orderId: order.id,
        },
        paystackStatus: "success",
        orderId: order.id,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [paymentTransactions.provider, paymentTransactions.reference],
        set: {
          source: getSource(order.orderType),
          status: "paid",
          amount: amountKobo,
          currencyCode: order.currencyCode || "NGN",
          orderId: order.id,
          paystackStatus: "success",
          conflictCode: null,
          conflictMessage: null,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning({ id: paymentTransactions.id });

    if (!transaction) {
      skipped += 1;
      continue;
    }

    await db
      .update(orders)
      .set({
        paymentTransactionId: transaction.id,
        paymentProvider: "paystack",
        paymentReference: reference,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    await db.insert(paymentEvents).values({
      paymentTransactionId: transaction.id,
      provider: "paystack",
      reference,
      source: getSource(order.orderType),
      eventType: "backfill",
      status: "paid",
      message: `Backfilled payment link for order ${order.id}`,
      payload: {
        orderId: order.id,
      },
    });

    linked += 1;
  }

  console.log("Backfill complete");
  console.log(
    JSON.stringify(
      {
        scanned,
        skipped,
        linked,
        conflicted,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  });
