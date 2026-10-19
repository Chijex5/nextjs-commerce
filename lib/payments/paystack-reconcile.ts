import {
    sendAdminNewOrderNotification,
    sendOrderConfirmationWithMarkup,
} from "@/lib/email/order-emails";
import { and, eq, inArray, isNull, ne, sql, type SQL } from "drizzle-orm";
import { quoteCheckout } from "lib/checkout/quote";
import {
  type CheckoutSnapshot,
  readSnapshot,
  toSnapshot,
} from "lib/checkout/snapshot";
import { db } from "lib/db";
import {
    abandonedCarts,
    cartLines,
    carts,
    couponUsages,
    coupons,
    customOrderQuoteTokens,
    customOrderQuotes,
    customOrderRequests,
    customRequestMessages,
    orderItems,
    orders,
    paymentEvents,
    paymentTransactions,
    productImages,
    productVariants,
    products,
    users,
} from "lib/db/schema";
import { getAdminNotificationEmails } from "lib/email/admin-notification-emails";
import { calculateShippingAmount } from "lib/shipping";
import {
    type PaymentConflictCode,
    type PaymentEventType,
    type PaymentSource,
} from "types/payments";

type PaystackCustomer = {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
};

export type ReconcilePaystackPaymentInput = {
  reference: string;
  amount: number;
  currencyCode?: string | null;
  paystackStatus?: string | null;
  metadata?: Record<string, unknown>;
  customer?: PaystackCustomer | null;
  payload?: unknown;
  eventType: PaymentEventType;
  checkoutCartId?: string | null;
  customQuoteId?: string | null;
  customRequestId?: string | null;
  customQuoteTokenHash?: string | null;
};

type EmailItem = {
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: number;
  productImage?: string | null;
  sku?: string;
};

type ReconcileResult =
  | {
      status: "paid";
      orderId: string;
      orderNumber: string;
      created: boolean;
      paymentTransactionId: string;
    }
  | {
      status: "conflict";
      paymentTransactionId: string;
      conflictCode: PaymentConflictCode;
      message: string;
    }
  | {
      status: "failed";
      paymentTransactionId?: string;
      message: string;
    };

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toStringOrNull = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toNumberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
};

/** Short, sequential and never repeated: DFP-10001, DFP-10002, … */
async function nextOrderNumber(tx: TxClient) {
  const [row] = await tx.execute<{ n: string }>(
    sql`select nextval('order_number_seq')::text as n`,
  );
  if (!row?.n) throw new Error("Could not allocate an order number");
  return `DFP-${row.n}`;
}

const buildOrderNotes = (userNote: string | null, reference: string) => {
  const paymentRefLine = `Paystack Ref: ${reference}`;
  if (!userNote) return paymentRefLine;
  return `${userNote}\n\n${paymentRefLine}`;
};

const getSourceFromMetadata = (metadata: RecordValue): PaymentSource => {
  if (metadata.custom_quote_id && metadata.custom_request_id) {
    return "custom_quote";
  }
  return "catalog_checkout";
};

/** Paystack statuses where the attempt is over and no money was taken. */
const UNPAID_PAYSTACK_STATUSES = ["abandoned", "failed", "reversed"];

/**
 * Payments for the same thing as this one: every press of Pay gets its own
 * Paystack reference, so a customer who closes the popup and tries again
 * leaves one attempt per press. Same quote (and part), or the same bag lines.
 */
function sameCheckoutWhere(metadata: RecordValue): SQL | null {
  const quoteId = toStringOrNull(metadata.custom_quote_id);
  if (quoteId) {
    const kind = toStringOrNull(metadata.custom_payment_kind) ?? "";
    return sql`(${paymentTransactions.metadata}->>'custom_quote_id' = ${quoteId} and coalesce(${paymentTransactions.metadata}->>'custom_payment_kind', '') = ${kind})`;
  }
  const snapshot = readSnapshot(metadata.checkout_snapshot);
  if (!snapshot) return null;
  // Paid lines leave the bag, so a line id belongs to one purchase only.
  const lineIds = snapshot.lines.map((l) => l.lineId).join(",");
  return sql`(${paymentTransactions.metadata}->'checkout_snapshot'->>'cartId' = ${snapshot.cartId} and jsonb_path_query_array(${paymentTransactions.metadata}->'checkout_snapshot'->'lines', '$[*].lineId') ?| string_to_array(${lineIds}, ','))`;
}

const paidOnRetry = (order: { orderId: string; orderNumber: string }) => ({
  paid_on_retry_order_id: order.orderId,
  paid_on_retry_order_number: order.orderNumber,
});

/** The order another, paid attempt at the same checkout created, if any. */
async function findPaidAttemptOrder(
  tx: TxClient,
  paymentTransactionId: string,
  metadata: RecordValue,
) {
  const same = sameCheckoutWhere(metadata);
  if (!same) return null;
  const [row] = await tx
    .select({ orderId: orders.id, orderNumber: orders.orderNumber })
    .from(paymentTransactions)
    .innerJoin(orders, eq(orders.id, paymentTransactions.orderId))
    .where(
      and(
        ne(paymentTransactions.id, paymentTransactionId),
        eq(paymentTransactions.status, "paid"),
        same,
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Once an attempt is paid, note its order on the earlier attempts at the same
 * checkout that never took money, and clear any review flag on them. Only the
 * paid attempt holds `order_id` (it's unique per order), so the link lives in
 * metadata.
 */
async function linkUnpaidAttempts(
  tx: TxClient,
  input: {
    paymentTransactionId: string;
    orderId: string;
    orderNumber: string;
    metadata: RecordValue;
  },
) {
  const same = sameCheckoutWhere(input.metadata);
  if (!same) return;
  await tx
    .update(paymentTransactions)
    .set({
      metadata: sql`${paymentTransactions.metadata} || ${JSON.stringify(paidOnRetry(input))}::jsonb`,
      status: sql`case when ${paymentTransactions.status} = 'conflict' then 'failed' else ${paymentTransactions.status} end`,
      conflictCode: null,
      conflictMessage: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        ne(paymentTransactions.id, input.paymentTransactionId),
        isNull(paymentTransactions.orderId),
        // Only attempts Paystack has finished without taking money; one still
        // pending may yet go through.
        inArray(paymentTransactions.paystackStatus, UNPAID_PAYSTACK_STATUSES),
        same,
      ),
    );
}

async function sendOrderEmails(input: {
  paymentTransactionId?: string;
  reference?: string;
  source?: PaymentSource;
  orderId: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone?: string | null;
  totalAmount: number;
  subtotalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  discountAmount: number;
  couponCode?: string | null;
  currencyCode: string;
  orderDate: string;
  shippingAddress: unknown;
  items: EmailItem[];
}) {
  // sendEmail reports failure in its result rather than throwing; note it on
  // the payment so the team can see the confirmation never went out.
  const noteFailure = async (who: string, error: unknown) => {
    console.error(`Payment reconcile: failed to send ${who} order email`, error);
    if (!input.paymentTransactionId) return;
    await db
      .insert(paymentEvents)
      .values({
        paymentTransactionId: input.paymentTransactionId,
        provider: "paystack",
        reference: input.reference ?? input.orderNumber,
        source: input.source ?? "catalog_checkout",
        eventType: "admin_reconcile",
        status: "email_failed",
        message: `The ${who} order email for ${input.orderNumber} was not sent: ${
          error instanceof Error ? error.message : String(error)
        }`,
      })
      .catch(() => {});
  };

  try {
    const sent = await sendOrderConfirmationWithMarkup({
      orderNumber: input.orderNumber,
      customerName: input.customerName,
      email: input.email,
      totalAmount: input.totalAmount,
      subtotalAmount: input.subtotalAmount,
      shippingAmount: input.shippingAmount,
      taxAmount: input.taxAmount,
      discountAmount: input.discountAmount,
      couponCode: input.couponCode || null,
      items: input.items,
      shippingAddress: input.shippingAddress,
      orderDate: input.orderDate,
    });
    if (!sent.success) await noteFailure("customer", sent.error);
  } catch (emailError) {
    await noteFailure("customer", emailError);
  }

  try {
    const adminEmails = await getAdminNotificationEmails();
    if (adminEmails.length === 0) return;

    const sent = await sendAdminNewOrderNotification({
      to: adminEmails,
      orderNumber: input.orderNumber,
      orderId: input.orderId,
      customerName: input.customerName,
      email: input.email,
      phone: input.phone || null,
      totalAmount: input.totalAmount,
      subtotalAmount: input.subtotalAmount,
      shippingAmount: input.shippingAmount,
      taxAmount: input.taxAmount,
      discountAmount: input.discountAmount,
      couponCode: input.couponCode || null,
      currencyCode: input.currencyCode,
      orderDate: input.orderDate,
      items: input.items.map((item) => ({
        productTitle: item.productTitle,
        variantTitle: item.variantTitle,
        quantity: item.quantity,
      })),
    });
    if (!sent.success) await noteFailure("admin", sent.error);
  } catch (emailError) {
    await noteFailure("admin", emailError);
  }
}

type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function insertPaymentEvent(
  tx: TxClient,
  input: {
    paymentTransactionId: string;
    reference: string;
    provider?: string;
    source: PaymentSource;
    eventType: PaymentEventType;
    status: string;
    message?: string | null;
    payload?: unknown;
  },
) {
  await tx.insert(paymentEvents).values({
    paymentTransactionId: input.paymentTransactionId,
    provider: input.provider || "paystack",
    reference: input.reference,
    source: input.source,
    eventType: input.eventType,
    status: input.status,
    message: input.message || null,
    payload: (input.payload ?? null) as Record<string, unknown> | null,
  });
}

async function setConflict(
  tx: TxClient,
  input: {
    paymentTransactionId: string;
    reference: string;
    source: PaymentSource;
    eventType: PaymentEventType;
    conflictCode: PaymentConflictCode;
    message: string;
    paystackStatus?: string | null;
    payload?: unknown;
  },
) {
  await tx
    .update(paymentTransactions)
    .set({
      status: "conflict",
      conflictCode: input.conflictCode,
      conflictMessage: input.message,
      paystackStatus: input.paystackStatus || null,
      resolvedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(paymentTransactions.id, input.paymentTransactionId));

  await insertPaymentEvent(tx, {
    paymentTransactionId: input.paymentTransactionId,
    reference: input.reference,
    source: input.source,
    eventType: input.eventType,
    status: "conflict",
    message: input.message,
    payload: input.payload,
  });
}

async function setFailed(
  tx: TxClient,
  input: {
    paymentTransactionId: string;
    reference: string;
    source: PaymentSource;
    eventType: PaymentEventType;
    message: string;
    payload?: unknown;
    paystackStatus?: string | null;
  },
) {
  await tx
    .update(paymentTransactions)
    .set({
      status: "failed",
      conflictCode: "unknown",
      conflictMessage: input.message,
      paystackStatus: input.paystackStatus || null,
      updatedAt: new Date(),
    })
    .where(eq(paymentTransactions.id, input.paymentTransactionId));

  await insertPaymentEvent(tx, {
    paymentTransactionId: input.paymentTransactionId,
    reference: input.reference,
    source: input.source,
    eventType: input.eventType,
    status: "failed",
    message: input.message,
    payload: input.payload,
  });
}

async function attachExistingOrder(
  tx: TxClient,
  input: {
    paymentTransactionId: string;
    orderId: string;
    reference: string;
    source: PaymentSource;
    eventType: PaymentEventType;
    paymentProvider: string;
    payload?: unknown;
    paystackStatus?: string | null;
  },
) {
  await tx
    .update(paymentTransactions)
    .set({
      status: "paid",
      orderId: input.orderId,
      paystackStatus: input.paystackStatus || "success",
      conflictCode: null,
      conflictMessage: null,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(paymentTransactions.id, input.paymentTransactionId));

  await tx
    .update(orders)
    .set({
      paymentTransactionId: input.paymentTransactionId,
      paymentProvider: input.paymentProvider,
      paymentReference: input.reference,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, input.orderId));

  await insertPaymentEvent(tx, {
    paymentTransactionId: input.paymentTransactionId,
    reference: input.reference,
    source: input.source,
    eventType: input.eventType,
    status: "duplicate",
    message: "Existing order reused for this payment reference",
    payload: input.payload,
  });
}

export async function registerInitializedPaymentTransaction(input: {
  reference: string;
  source: PaymentSource;
  amount: number;
  currencyCode: string;
  metadata?: Record<string, unknown>;
  /** The priced bag the customer is paying for (catalog checkout). */
  snapshot?: CheckoutSnapshot;
  payload?: unknown;
}) {
  const metadata: RecordValue = {
    ...(isRecord(input.metadata) ? input.metadata : {}),
    ...(input.snapshot ? { checkout_snapshot: input.snapshot } : {}),
  };
  const source = input.source;
  const provider =
    toStringOrNull(metadata.payment_provider) === "coupon_free"
      ? "coupon_free"
      : "paystack";

  const [paymentTransaction] = await db
    .insert(paymentTransactions)
    .values({
      provider,
      reference: input.reference,
      source,
      status: "initialized",
      amount: input.amount,
      currencyCode: input.currencyCode,
      metadata,
      paystackStatus: "initialized",
      payload: (input.payload ?? null) as Record<string, unknown> | null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [paymentTransactions.provider, paymentTransactions.reference],
      set: {
        source,
        status: "initialized",
        amount: input.amount,
        currencyCode: input.currencyCode,
        metadata,
        paystackStatus: "initialized",
        payload: (input.payload ?? null) as Record<string, unknown> | null,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: paymentTransactions.id,
      reference: paymentTransactions.reference,
      source: paymentTransactions.source,
    });

  if (!paymentTransaction) {
    throw new Error("Failed to register payment transaction");
  }

  await db.insert(paymentEvents).values({
    paymentTransactionId: paymentTransaction.id,
    provider,
    reference: paymentTransaction.reference,
    source: paymentTransaction.source as PaymentSource,
    eventType: "initialize",
    status: "initialized",
    message: "Paystack transaction initialized",
    payload: (input.payload ?? null) as Record<string, unknown> | null,
  });

  return paymentTransaction.id;
}

export async function reconcilePaystackPayment(
  input: ReconcilePaystackPaymentInput,
): Promise<ReconcileResult> {
  const reference = input.reference.trim();
  if (!reference) {
    return {
      status: "failed",
      message: "Missing payment reference",
    };
  }

  let metadata: RecordValue = isRecord(input.metadata) ? input.metadata : {};
  let source = getSourceFromMetadata(metadata);
  let paymentProvider = toStringOrNull(metadata.payment_provider) || "paystack";
  let paymentTransactionId: string | undefined;

  try {
    const output = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${reference}))`);

      // What we stored at initialize beats what Paystack echoes back: the
      // echo comes from the browser for popup payments, our copy doesn't.
      const [stored] = await tx
        .select({
          metadata: paymentTransactions.metadata,
          status: paymentTransactions.status,
        })
        .from(paymentTransactions)
        .where(eq(paymentTransactions.reference, reference))
        .limit(1);
      if (stored && isRecord(stored.metadata)) {
        metadata = { ...metadata, ...stored.metadata };
        source = getSourceFromMetadata(metadata);
        paymentProvider = toStringOrNull(metadata.payment_provider) || "paystack";
      }

      const [upserted] = await tx
        .insert(paymentTransactions)
        .values({
          provider: paymentProvider,
          reference,
          source,
          status: "processing",
          amount: input.amount,
          currencyCode: input.currencyCode || "NGN",
          metadata,
          paystackStatus: input.paystackStatus || null,
          customer: (input.customer ?? null) as Record<string, unknown> | null,
          payload: (input.payload ?? null) as Record<string, unknown> | null,
          lastVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [paymentTransactions.provider, paymentTransactions.reference],
          set: {
            source,
            amount: input.amount,
            currencyCode: input.currencyCode || "NGN",
            metadata,
            paystackStatus: input.paystackStatus || null,
            customer: (input.customer ?? null) as Record<string, unknown> | null,
            payload: (input.payload ?? null) as Record<string, unknown> | null,
            status: "processing",
            lastVerifiedAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!upserted) {
        throw new Error("Failed to upsert payment transaction");
      }
      paymentTransactionId = upserted.id;

      // An unpaid attempt can carry the order a later attempt created; only
      // an attempt that was itself paid already has its order.
      if (
        upserted.orderId &&
        (stored?.status === "paid" || stored?.status === "duplicate")
      ) {
        const [linkedOrder] = await tx
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
          })
          .from(orders)
          .where(eq(orders.id, upserted.orderId))
          .limit(1);

        if (linkedOrder) {
          // The upsert above set it to processing; put back what it was.
          await tx
            .update(paymentTransactions)
            .set({ status: stored.status })
            .where(eq(paymentTransactions.id, upserted.id));
          await insertPaymentEvent(tx, {
            paymentTransactionId: upserted.id,
            reference,
            source,
            eventType: input.eventType,
            status: "duplicate",
            message: "Order already linked to this transaction",
            payload: input.payload,
          });
          return {
            status: "paid" as const,
            orderId: linkedOrder.id,
            orderNumber: linkedOrder.orderNumber,
            created: false,
            emailPayload: null as null,
          };
        }
      }

      const [existingOrderByReference] = await tx
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentProvider, paymentProvider),
            eq(orders.paymentReference, reference),
          ),
        )
        .limit(1);

      if (existingOrderByReference) {
        await attachExistingOrder(tx, {
          paymentTransactionId: upserted.id,
          orderId: existingOrderByReference.id,
          reference,
          source,
          eventType: input.eventType,
          paymentProvider,
          payload: input.payload,
          paystackStatus: input.paystackStatus,
        });
        return {
          status: "paid" as const,
          orderId: existingOrderByReference.id,
          orderNumber: existingOrderByReference.orderNumber,
          created: false,
          emailPayload: null as null,
        };
      }

      if (input.paystackStatus && input.paystackStatus !== "success") {
        // No money moved (closed popup, declined card, refunded), so there's
        // nothing to review. If they paid on another attempt, link that order.
        const done = UNPAID_PAYSTACK_STATUSES.includes(input.paystackStatus);
        const paidAttempt = done
          ? await findPaidAttemptOrder(tx, upserted.id, metadata)
          : null;
        await tx
          .update(paymentTransactions)
          .set({
            status: done ? "failed" : "processing",
            ...(paidAttempt
              ? { metadata: { ...metadata, ...paidOnRetry(paidAttempt) } }
              : {}),
            conflictCode: null,
            conflictMessage: null,
            updatedAt: new Date(),
          })
          .where(eq(paymentTransactions.id, upserted.id));
        await insertPaymentEvent(tx, {
          paymentTransactionId: upserted.id,
          reference,
          source,
          eventType: input.eventType,
          status: done ? "failed" : "processing",
          message: done
            ? `Paystack status is ${input.paystackStatus}. No money was taken.${
                paidAttempt
                  ? ` The customer paid on another attempt (order ${paidAttempt.orderNumber}).`
                  : ""
              }`
            : `Paystack status is ${input.paystackStatus}. Waiting for Paystack to finish.`,
          payload: input.payload,
        });

        return {
          status: "conflict" as const,
          conflictCode: "invalid_status" as const,
          message: `Paystack status is ${input.paystackStatus}`,
        };
      }

      if (source === "custom_quote") {
        const quoteId =
          toStringOrNull(metadata.custom_quote_id) ||
          toStringOrNull(input.customQuoteId);
        const requestId =
          toStringOrNull(metadata.custom_request_id) ||
          toStringOrNull(input.customRequestId);

        if (!quoteId || !requestId) {
          const message = "Missing custom quote metadata";
          await setConflict(tx, {
            paymentTransactionId: upserted.id,
            reference,
            source,
            eventType: input.eventType,
            conflictCode: "missing_metadata",
            message,
            payload: input.payload,
            paystackStatus: input.paystackStatus,
          });

          return {
            status: "conflict" as const,
            conflictCode: "missing_metadata" as const,
            message,
          };
        }

        const [quote, requestRow] = await Promise.all([
          tx
            .select()
            .from(customOrderQuotes)
            .where(eq(customOrderQuotes.id, quoteId))
            .limit(1)
            .then((rows) => rows[0]),
          tx
            .select()
            .from(customOrderRequests)
            .where(eq(customOrderRequests.id, requestId))
            .limit(1)
            .then((rows) => rows[0]),
        ]);

        if (!quote) {
          const message = "Custom quote not found";
          await setConflict(tx, {
            paymentTransactionId: upserted.id,
            reference,
            source,
            eventType: input.eventType,
            conflictCode: "quote_not_found",
            message,
            payload: input.payload,
            paystackStatus: input.paystackStatus,
          });
          return {
            status: "conflict" as const,
            conflictCode: "quote_not_found" as const,
            message,
          };
        }

        if (!requestRow) {
          const message = "Custom request not found";
          await setConflict(tx, {
            paymentTransactionId: upserted.id,
            reference,
            source,
            eventType: input.eventType,
            conflictCode: "request_not_found",
            message,
            payload: input.payload,
            paystackStatus: input.paystackStatus,
          });
          return {
            status: "conflict" as const,
            conflictCode: "request_not_found" as const,
            message,
          };
        }

        if (input.currencyCode && input.currencyCode !== quote.currencyCode) {
          const message = "Currency mismatch for custom quote";
          await setConflict(tx, {
            paymentTransactionId: upserted.id,
            reference,
            source,
            eventType: input.eventType,
            conflictCode: "currency_mismatch",
            message,
            payload: input.payload,
            paystackStatus: input.paystackStatus,
          });
          return {
            status: "conflict" as const,
            conflictCode: "currency_mismatch" as const,
            message,
          };
        }

        // deposit = start production, full = quote + delivery, balance = rest of the order.
        const kind = toStringOrNull(metadata.custom_payment_kind);
        const itemsAmount = Number(quote.amount);
        const shippingAmount = Number(quote.shippingAmount ?? 0);
        const depositAmount = quote.depositAmount ? Number(quote.depositAmount) : null;

        if (kind === "balance") {
          const [order] = requestRow.convertedOrderId
            ? await tx
                .select({
                  id: orders.id,
                  orderNumber: orders.orderNumber,
                  balanceDue: orders.balanceDue,
                })
                .from(orders)
                .where(eq(orders.id, requestRow.convertedOrderId))
                .limit(1)
            : [];
          const expectedBalance = Math.round(Number(order?.balanceDue ?? 0) * 100);
          if (!order || !expectedBalance || input.amount !== expectedBalance) {
            const message = order
              ? `Amount mismatch for custom balance. Expected ${expectedBalance}, got ${input.amount}`
              : "No order to apply the balance to";
            await setConflict(tx, {
              paymentTransactionId: upserted.id,
              reference,
              source,
              eventType: input.eventType,
              conflictCode: "amount_mismatch",
              message,
              payload: input.payload,
              paystackStatus: input.paystackStatus,
            });
            return {
              status: "conflict" as const,
              conflictCode: "amount_mismatch" as const,
              message,
            };
          }

          await tx
            .update(orders)
            .set({ balanceDue: "0", updatedAt: new Date() })
            .where(eq(orders.id, order.id));
          await tx
            .update(customOrderRequests)
            .set({ status: "ready", updatedAt: new Date() })
            .where(eq(customOrderRequests.id, requestRow.id));
          await tx
            .update(paymentTransactions)
            .set({
              status: "paid",
              orderId: order.id,
              paystackStatus: input.paystackStatus || "success",
              conflictCode: null,
              conflictMessage: null,
              resolvedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(paymentTransactions.id, upserted.id));
          await linkUnpaidAttempts(tx, {
            paymentTransactionId: upserted.id,
            orderId: order.id,
            orderNumber: order.orderNumber,
            metadata,
          });
          await insertPaymentEvent(tx, {
            paymentTransactionId: upserted.id,
            reference,
            provider: paymentProvider,
            source,
            eventType: input.eventType,
            status: "paid",
            message: "Custom order balance paid",
            payload: input.payload,
          });
          await tx.insert(customRequestMessages).values({
            requestId: requestRow.id,
            author: "system",
            body: `Balance paid: ₦${(expectedBalance / 100).toLocaleString("en-NG")}`,
          });
          return {
            status: "paid" as const,
            orderId: order.id,
            orderNumber: order.orderNumber,
            created: false,
            emailPayload: null as null,
          };
        }

        const expectedAmountInKobo = Math.round(
          (kind === "deposit" && depositAmount
            ? depositAmount
            : itemsAmount + shippingAmount) * 100,
        );
        if (!Number.isFinite(input.amount) || input.amount !== expectedAmountInKobo) {
          const message = `Amount mismatch for custom quote. Expected ${expectedAmountInKobo}, got ${input.amount}`;
          await setConflict(tx, {
            paymentTransactionId: upserted.id,
            reference,
            source,
            eventType: input.eventType,
            conflictCode: "amount_mismatch",
            message,
            payload: input.payload,
            paystackStatus: input.paystackStatus,
          });
          return {
            status: "conflict" as const,
            conflictCode: "amount_mismatch" as const,
            message,
          };
        }

        if (requestRow.convertedOrderId) {
          const [existingOrder] = await tx
            .select({
              id: orders.id,
              orderNumber: orders.orderNumber,
            })
            .from(orders)
            .where(eq(orders.id, requestRow.convertedOrderId))
            .limit(1);

          if (existingOrder) {
            await attachExistingOrder(tx, {
              paymentTransactionId: upserted.id,
              orderId: existingOrder.id,
              reference,
              source,
              eventType: input.eventType,
              paymentProvider,
              payload: input.payload,
              paystackStatus: input.paystackStatus,
            });
            return {
              status: "paid" as const,
              orderId: existingOrder.id,
              orderNumber: existingOrder.orderNumber,
              created: false,
              emailPayload: null as null,
            };
          }
        }

        const orderNumber = await nextOrderNumber(tx);
        const [createdOrder] = await tx
          .insert(orders)
          .values({
            userId: requestRow.userId,
            orderNumber,
            email: requestRow.email,
            phone: requestRow.phone,
            customerName: requestRow.customerName,
            shippingAddress: requestRow.deliveryAddress ?? {},
            billingAddress: null,
            status: "processing",
            subtotalAmount: String(itemsAmount),
            shippingAmount: String(shippingAmount),
            discountAmount: "0",
            totalAmount: String(itemsAmount + shippingAmount),
            balanceDue: String(
              kind === "deposit" && depositAmount
                ? itemsAmount + shippingAmount - depositAmount
                : 0,
            ),
            currencyCode: quote.currencyCode,
            notes: buildOrderNotes(`Custom order ${requestRow.requestNumber}`, reference),
            orderType: "custom",
            customOrderRequestId: requestRow.id,
            paymentTransactionId: upserted.id,
            paymentProvider,
            paymentReference: reference,
          })
          .returning();

        if (!createdOrder) {
          throw new Error("Failed to create custom order");
        }

        await tx.insert(orderItems).values({
          orderId: createdOrder.id,
          // The order links back through custom_order_request_id; the item only
          // points at a real product (the design it was based on), if any.
          productId: requestRow.baseProductId ?? null,
          productVariantId: null,
          productTitle: `Custom Order - ${requestRow.requestNumber}`,
          variantTitle: "Quoted Request",
          quantity: 1,
          price: String(quote.amount),
          totalAmount: String(quote.amount),
          currencyCode: quote.currencyCode,
          productImage: Array.isArray(requestRow.referenceImages)
            ? ((requestRow.referenceImages[0] as string | undefined) ?? null)
            : null,
        });

        await tx
          .update(customOrderQuotes)
          .set({ status: "paid", updatedAt: new Date() })
          .where(eq(customOrderQuotes.id, quote.id));

        await tx
          .update(customOrderRequests)
          .set({
            status: "paid",
            paidAt: new Date(),
            convertedOrderId: createdOrder.id,
            quotedAmount: String(quote.amount),
            updatedAt: new Date(),
          })
          .where(eq(customOrderRequests.id, requestRow.id));

        if (input.customQuoteTokenHash) {
          await tx
            .update(customOrderQuoteTokens)
            .set({ usedAt: new Date() })
            .where(
              and(
                eq(customOrderQuoteTokens.quoteId, quote.id),
                eq(customOrderQuoteTokens.tokenHash, input.customQuoteTokenHash),
              ),
            );
        } else {
          await tx
            .update(customOrderQuoteTokens)
            .set({ usedAt: new Date() })
            .where(
              and(
                eq(customOrderQuoteTokens.quoteId, quote.id),
                eq(customOrderQuoteTokens.email, requestRow.email),
                isNull(customOrderQuoteTokens.usedAt),
              ),
            );
        }

        await tx
          .update(paymentTransactions)
          .set({
            status: "paid",
            orderId: createdOrder.id,
            paystackStatus: input.paystackStatus || "success",
            conflictCode: null,
            conflictMessage: null,
            resolvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(paymentTransactions.id, upserted.id));
        await linkUnpaidAttempts(tx, {
          paymentTransactionId: upserted.id,
          orderId: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          metadata,
        });

        await insertPaymentEvent(tx, {
          paymentTransactionId: upserted.id,
          reference,
            provider: paymentProvider,
          source,
          eventType: input.eventType,
          status: "paid",
          message: "Custom quote reconciled and order created",
          payload: input.payload,
        });
        await tx.insert(customRequestMessages).values({
          requestId: requestRow.id,
          author: "system",
          body:
            kind === "deposit" && depositAmount
              ? `Deposit paid: ₦${depositAmount.toLocaleString("en-NG")}`
              : `Paid in full: ₦${(itemsAmount + shippingAmount).toLocaleString("en-NG")}`,
        });

        return {
          status: "paid" as const,
          orderId: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          created: true,
          emailPayload: {
            orderId: createdOrder.id,
            orderNumber: createdOrder.orderNumber,
            customerName: createdOrder.customerName,
            email: createdOrder.email,
            phone: createdOrder.phone,
            totalAmount: Number(createdOrder.totalAmount),
            subtotalAmount: Number(createdOrder.subtotalAmount),
            shippingAmount: Number(createdOrder.shippingAmount),
            taxAmount: Number(createdOrder.taxAmount),
            discountAmount: Number(createdOrder.discountAmount || 0),
            couponCode: createdOrder.couponCode,
            currencyCode: createdOrder.currencyCode,
            orderDate: createdOrder.createdAt.toISOString(),
            shippingAddress: createdOrder.shippingAddress,
            items: [
              {
                productTitle: `Custom Order - ${requestRow.requestNumber}`,
                variantTitle: "Quoted Request",
                quantity: 1,
                price: Number(quote.amount),
                productImage: Array.isArray(requestRow.referenceImages)
                  ? ((requestRow.referenceImages[0] as string | undefined) ?? null)
                  : null,
                sku: quote.id,
              },
            ],
          },
        };
      }

      const conflict = async (
        conflictCode: PaymentConflictCode,
        message: string,
      ) => {
        await setConflict(tx, {
          paymentTransactionId: upserted.id,
          reference,
          source,
          eventType: input.eventType,
          conflictCode,
          message,
          payload: input.payload,
          paystackStatus: input.paystackStatus,
        });
        return { status: "conflict" as const, conflictCode, message };
      };

      // The snapshot stored when the customer pressed Pay is the order: the
      // lines and prices they saw are the ones they get, even if a price,
      // coupon or the bag changed while Paystack was open.
      const storedSnapshot = readSnapshot(metadata.checkout_snapshot);
      const cartId =
        storedSnapshot?.cartId ||
        toStringOrNull(metadata.cart_id) ||
        toStringOrNull(input.checkoutCartId);

      if (!cartId) {
        return conflict("missing_metadata", "Missing catalog cart metadata");
      }
      if (
        !storedSnapshot &&
        input.checkoutCartId &&
        input.checkoutCartId !== cartId
      ) {
        return conflict(
          "metadata_mismatch",
          "Checkout cart mismatch between session and metadata",
        );
      }

      const currencyCode = toStringOrNull(input.currencyCode) || "NGN";
      if (currencyCode !== "NGN") {
        return conflict(
          "currency_mismatch",
          `Currency mismatch. Expected NGN, got ${currencyCode}`,
        );
      }

      const shippingAddress = isRecord(metadata.checkout_shipping_address)
        ? metadata.checkout_shipping_address
        : {};
      const billingAddress = isRecord(metadata.checkout_billing_address)
        ? metadata.checkout_billing_address
        : null;
      const couponCode = toStringOrNull(metadata.coupon_code);
      const userId = toStringOrNull(metadata.checkout_user_id);
      const checkoutSessionId = toStringOrNull(metadata.checkout_session_id);

      let snapshot = storedSnapshot;
      if (!snapshot) {
        // Payments started before snapshots existed: price the live bag.
        const quote = await quoteCheckout({
          cartId,
          address: shippingAddress as { state?: string; lga?: string; ward?: string },
          couponCode,
          userId,
          sessionId: checkoutSessionId,
        });
        if (!quote.lines.length) {
          return conflict("cart_not_found", "Cart has no line items");
        }
        if (couponCode && quote.couponError) {
          return conflict(
            "invalid_status",
            "Coupon is no longer valid for this checkout",
          );
        }
        snapshot = toSnapshot(cartId, quote);
      }

      if (!Number.isFinite(input.amount) || input.amount !== snapshot.amountInKobo) {
        return conflict(
          "amount_mismatch",
          `Amount mismatch. Expected ${snapshot.amountInKobo}, got ${input.amount}`,
        );
      }

      const email =
        toStringOrNull(metadata.checkout_email) ||
        toStringOrNull(input.customer?.email);
      if (!email) {
        return conflict("missing_metadata", "Missing customer email");
      }

      const phone = toStringOrNull(metadata.phone) || toStringOrNull(input.customer?.phone);
      const shouldSaveAddress = toBoolean(metadata.checkout_save_address);
      const customerName =
        toStringOrNull(metadata.customer_name) ||
        [toStringOrNull(shippingAddress.firstName), toStringOrNull(shippingAddress.lastName)]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        [toStringOrNull(input.customer?.first_name), toStringOrNull(input.customer?.last_name)]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "Customer";
      const userNote = toStringOrNull(metadata.checkout_notes);

      const snapshotCouponCode = snapshot.couponCode ?? couponCode;
      const [coupon] = snapshot.couponId
        ? [{ id: snapshot.couponId }]
        : snapshotCouponCode
          ? await tx
              .select({ id: coupons.id })
              .from(coupons)
              .where(eq(coupons.code, snapshotCouponCode.trim().toUpperCase()))
              .limit(1)
          : [];

      const orderNumber = await nextOrderNumber(tx);
      const [createdOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId: userId || null,
          email,
          phone,
          customerName,
          shippingAddress,
          billingAddress,
          status: "processing",
          subtotalAmount: String(snapshot.subtotal),
          shippingAmount: String(snapshot.shipping),
          discountAmount: String(snapshot.discount),
          couponCode: snapshotCouponCode,
          couponId: coupon?.id ?? null,
          totalAmount: String(snapshot.total),
          currencyCode: "NGN",
          notes: buildOrderNotes(userNote, reference),
          paymentTransactionId: upserted.id,
          paymentProvider,
          paymentReference: reference,
        })
        .returning();

      if (!createdOrder) {
        throw new Error("Failed to create catalog order");
      }

      await tx.insert(orderItems).values(
        snapshot.lines.map((line) => ({
          orderId: createdOrder.id,
          productId: line.productId,
          productVariantId: line.variantId,
          productTitle: line.productTitle,
          variantTitle: line.variantTitle,
          quantity: line.quantity,
          price: String(line.unitPrice),
          totalAmount: String(line.lineTotal),
          currencyCode: line.currencyCode,
          productImage: line.image,
        })),
      );

      const notices: string[] = [];

      if (coupon) {
        await tx.insert(couponUsages).values({
          couponId: coupon.id,
          orderId: createdOrder.id,
          userId: userId || null,
          sessionId: userId ? null : checkoutSessionId,
        });
        // Claim a use only while uses are left. If the last one went while
        // this customer was paying, they still get the price they paid — we
        // just flag it for the team.
        const claimed = await tx
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1`, updatedAt: new Date() })
          .where(
            and(
              eq(coupons.id, coupon.id),
              sql`(${coupons.maxUses} is null or ${coupons.usedCount} < ${coupons.maxUses})`,
            ),
          )
          .returning({ id: coupons.id });
        if (!claimed.length) {
          await tx
            .update(coupons)
            .set({ usedCount: sql`${coupons.usedCount} + 1`, updatedAt: new Date() })
            .where(eq(coupons.id, coupon.id));
          notices.push(
            `Coupon ${snapshotCouponCode} went over its usage limit while this customer paid; the order was honoured.`,
          );
        }
      }

      // Stock only moves for variants that track it (most pairs are made to
      // order). Never fail a paid order over it: clamp at zero and flag.
      for (const line of snapshot.lines) {
        const [variant] = await tx
          .update(productVariants)
          .set({
            stockQuantity: sql`greatest(${productVariants.stockQuantity} - ${line.quantity}, 0)`,
            availableForSale: sql`${productVariants.stockQuantity} - ${line.quantity} > 0`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(productVariants.id, line.variantId),
              eq(productVariants.trackInventory, true),
            ),
          )
          .returning({ stockQuantity: productVariants.stockQuantity });
        if (variant && variant.stockQuantity === 0) {
          notices.push(`${line.productTitle} (${line.variantTitle}) is now sold out.`);
        }
      }

      if (shouldSaveAddress && userId) {
        await tx
          .update(users)
          .set({ shippingAddress, billingAddress })
          .where(eq(users.id, userId));
      }

      const [cart] = await tx
        .select({ id: carts.id })
        .from(carts)
        .where(eq(carts.id, cartId))
        .limit(1);
      if (cart) {
        // Only the lines that were paid for; anything added since stays.
        await tx
          .delete(cartLines)
          .where(
            and(
              eq(cartLines.cartId, cart.id),
              inArray(
                cartLines.id,
                snapshot.lines.map((l) => l.lineId),
              ),
            ),
          );
        const [totals] = await tx
          .select({
            quantity: sql<number>`coalesce(sum(${cartLines.quantity}), 0)::int`,
            amount: sql<string>`coalesce(sum(${cartLines.totalAmount}), 0)::text`,
          })
          .from(cartLines)
          .where(eq(cartLines.cartId, cart.id));
        await tx
          .update(carts)
          .set({
            totalQuantity: totals?.quantity ?? 0,
            subtotalAmount: totals?.amount ?? "0",
            totalAmount: totals?.amount ?? "0",
            totalTaxAmount: "0",
          })
          .where(eq(carts.id, cart.id));

        await tx
          .update(abandonedCarts)
          .set({ recovered: true, recoveredAt: new Date() })
          .where(
            and(eq(abandonedCarts.cartId, cart.id), eq(abandonedCarts.recovered, false)),
          );
      }

      await tx
        .update(paymentTransactions)
        .set({
          status: "paid",
          orderId: createdOrder.id,
          paystackStatus: input.paystackStatus || "success",
          conflictCode: null,
          conflictMessage: null,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(paymentTransactions.id, upserted.id));
      await linkUnpaidAttempts(tx, {
        paymentTransactionId: upserted.id,
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        metadata,
      });

      await insertPaymentEvent(tx, {
        paymentTransactionId: upserted.id,
        reference,
        source,
        eventType: input.eventType,
        status: "paid",
        message: ["Catalog checkout reconciled and order created", ...notices].join(" "),
        payload: input.payload,
      });

      return {
        status: "paid" as const,
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        created: true,
        emailPayload: {
          orderId: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          customerName: createdOrder.customerName,
          email: createdOrder.email,
          phone: createdOrder.phone,
          totalAmount: Number(createdOrder.totalAmount),
          subtotalAmount: Number(createdOrder.subtotalAmount),
          shippingAmount: Number(createdOrder.shippingAmount),
          taxAmount: Number(createdOrder.taxAmount),
          discountAmount: Number(createdOrder.discountAmount || 0),
          couponCode: createdOrder.couponCode,
          currencyCode: createdOrder.currencyCode,
          orderDate: createdOrder.createdAt.toISOString(),
          shippingAddress: createdOrder.shippingAddress,
          items: snapshot.lines.map((line) => ({
            productTitle: line.productTitle,
            variantTitle: line.variantTitle,
            quantity: line.quantity,
            price: line.unitPrice,
            productImage: line.image,
            sku: line.variantId,
          })),
        },
      };
    });

    if (output.status === "paid" && output.created && output.emailPayload) {
      await sendOrderEmails({
        ...output.emailPayload,
        paymentTransactionId,
        reference,
        source,
      });
    }

    if (output.status === "paid") {
      return {
        status: "paid",
        orderId: output.orderId,
        orderNumber: output.orderNumber,
        created: output.created,
        paymentTransactionId: paymentTransactionId!,
      };
    }

    return {
      status: "conflict",
      paymentTransactionId: paymentTransactionId!,
      conflictCode: output.conflictCode,
      message: output.message,
    };
  } catch (error) {
    console.error("Payment reconcile error:", error);

    if (paymentTransactionId) {
      try {
        const transactionId = paymentTransactionId;
        await db.transaction(async (tx) => {
          await setFailed(tx, {
            paymentTransactionId: transactionId,
            reference,
            source,
            eventType: input.eventType,
            message: (error as Error).message || "Payment reconciliation failed",
            payload: input.payload,
            paystackStatus: input.paystackStatus,
          });
        });
      } catch (setFailedError) {
        console.error("Failed to persist payment failure state:", setFailedError);
      }
    }

    return {
      status: "failed",
      paymentTransactionId,
      message: "Payment reconciliation failed",
    };
  }
}
