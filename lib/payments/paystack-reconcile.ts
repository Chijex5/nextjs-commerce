import {
  sendAdminNewOrderNotification,
  sendOrderConfirmationWithMarkup,
} from "@/lib/email/order-emails";
import { and, eq, ilike, isNull, sql } from "drizzle-orm";
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

const buildOrderNumber = () =>
  `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

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

async function sendOrderEmails(input: {
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
  try {
    await sendOrderConfirmationWithMarkup({
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
  } catch (emailError) {
    console.error("Payment reconcile: failed to send customer order email", emailError);
  }

  try {
    const adminEmails = await getAdminNotificationEmails();
    if (adminEmails.length === 0) return;

    await sendAdminNewOrderNotification({
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
  } catch (emailError) {
    console.error("Payment reconcile: failed to send admin order email", emailError);
  }
}

type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function insertPaymentEvent(
  tx: TxClient,
  input: {
    paymentTransactionId: string;
    reference: string;
    source: PaymentSource;
    eventType: PaymentEventType;
    status: string;
    message?: string | null;
    payload?: unknown;
  },
) {
  await tx.insert(paymentEvents).values({
    paymentTransactionId: input.paymentTransactionId,
    provider: "paystack",
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
      paymentProvider: "paystack",
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
  payload?: unknown;
}) {
  const metadata = isRecord(input.metadata) ? input.metadata : {};
  const source = input.source;

  const [paymentTransaction] = await db
    .insert(paymentTransactions)
    .values({
      provider: "paystack",
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
    provider: "paystack",
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

  const metadata = isRecord(input.metadata) ? input.metadata : {};
  const source = getSourceFromMetadata(metadata);
  let paymentTransactionId: string | undefined;

  try {
    const output = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${reference}))`);

      const [upserted] = await tx
        .insert(paymentTransactions)
        .values({
          provider: "paystack",
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

      if (upserted.orderId) {
        const [linkedOrder] = await tx
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
          })
          .from(orders)
          .where(eq(orders.id, upserted.orderId))
          .limit(1);

        if (linkedOrder) {
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
            eq(orders.paymentProvider, "paystack"),
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
        await setConflict(tx, {
          paymentTransactionId: upserted.id,
          reference,
          source,
          eventType: input.eventType,
          conflictCode: "invalid_status",
          message: `Paystack status is ${input.paystackStatus}`,
          payload: input.payload,
          paystackStatus: input.paystackStatus,
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

        const expectedAmountInKobo = Math.round(Number(quote.amount) * 100);
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

        const orderNumber = buildOrderNumber();
        const [createdOrder] = await tx
          .insert(orders)
          .values({
            userId: requestRow.userId,
            orderNumber,
            email: requestRow.email,
            phone: requestRow.phone,
            customerName: requestRow.customerName,
            shippingAddress: {},
            billingAddress: null,
            status: "processing",
            subtotalAmount: String(quote.amount),
            shippingAmount: "0",
            discountAmount: "0",
            totalAmount: String(quote.amount),
            currencyCode: quote.currencyCode,
            notes: buildOrderNotes(`Custom order ${requestRow.requestNumber}`, reference),
            orderType: "custom",
            customOrderRequestId: requestRow.id,
            paymentTransactionId: upserted.id,
            paymentProvider: "paystack",
            paymentReference: reference,
          })
          .returning();

        if (!createdOrder) {
          throw new Error("Failed to create custom order");
        }

        await tx.insert(orderItems).values({
          orderId: createdOrder.id,
          productId: requestRow.id,
          productVariantId: quote.id,
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

        await insertPaymentEvent(tx, {
          paymentTransactionId: upserted.id,
          reference,
          source,
          eventType: input.eventType,
          status: "paid",
          message: "Custom quote reconciled and order created",
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

      const cartId =
        toStringOrNull(metadata.cart_id) || toStringOrNull(input.checkoutCartId);

      if (!cartId) {
        const message = "Missing catalog cart metadata";
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

      if (input.checkoutCartId && input.checkoutCartId !== cartId) {
        const message = "Checkout cart mismatch between session and metadata";
        await setConflict(tx, {
          paymentTransactionId: upserted.id,
          reference,
          source,
          eventType: input.eventType,
          conflictCode: "metadata_mismatch",
          message,
          payload: input.payload,
          paystackStatus: input.paystackStatus,
        });
        return {
          status: "conflict" as const,
          conflictCode: "metadata_mismatch" as const,
          message,
        };
      }

      const [cart] = await tx.select().from(carts).where(eq(carts.id, cartId)).limit(1);
      if (!cart) {
        const message = "Cart not found";
        await setConflict(tx, {
          paymentTransactionId: upserted.id,
          reference,
          source,
          eventType: input.eventType,
          conflictCode: "cart_not_found",
          message,
          payload: input.payload,
          paystackStatus: input.paystackStatus,
        });
        return {
          status: "conflict" as const,
          conflictCode: "cart_not_found" as const,
          message,
        };
      }

      const cartLineRows = await tx
        .select({
          line: cartLines,
          variant: productVariants,
          product: products,
          image: productImages,
        })
        .from(cartLines)
        .innerJoin(
          productVariants,
          eq(cartLines.productVariantId, productVariants.id),
        )
        .innerJoin(products, eq(productVariants.productId, products.id))
        .leftJoin(
          productImages,
          and(
            eq(productImages.productId, products.id),
            eq(productImages.isFeatured, true),
          ),
        )
        .where(eq(cartLines.cartId, cart.id));

      const uniqueLines = Array.from(
        cartLineRows.reduce((acc, row) => {
          if (!acc.has(row.line.id)) {
            acc.set(row.line.id, row);
          }
          return acc;
        }, new Map<string, (typeof cartLineRows)[number]>()),
      ).map(([, value]) => value);

      if (!uniqueLines.length) {
        const message = "Cart has no line items";
        await setConflict(tx, {
          paymentTransactionId: upserted.id,
          reference,
          source,
          eventType: input.eventType,
          conflictCode: "cart_not_found",
          message,
          payload: input.payload,
          paystackStatus: input.paystackStatus,
        });
        return {
          status: "conflict" as const,
          conflictCode: "cart_not_found" as const,
          message,
        };
      }

      const subtotalAmount = Number(cart.subtotalAmount);
      const discountAmount = Math.min(
        subtotalAmount,
        Math.max(0, toNumberOrZero(metadata.discount_amount)),
      );
      const shippingAmount = 0;
      const totalAmount = subtotalAmount - discountAmount + shippingAmount;
      const expectedAmountInKobo = Math.round(totalAmount * 100);
      const currencyCode = toStringOrNull(input.currencyCode) || "NGN";

      if (currencyCode !== "NGN") {
        const message = `Currency mismatch. Expected NGN, got ${currencyCode}`;
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

      if (!Number.isFinite(input.amount) || input.amount !== expectedAmountInKobo) {
        const message = `Amount mismatch. Expected ${expectedAmountInKobo}, got ${input.amount}`;
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

      const shippingAddress = isRecord(metadata.checkout_shipping_address)
        ? metadata.checkout_shipping_address
        : {};
      const billingAddress = isRecord(metadata.checkout_billing_address)
        ? metadata.checkout_billing_address
        : null;
      const email =
        toStringOrNull(metadata.checkout_email) ||
        toStringOrNull(input.customer?.email);

      if (!email) {
        const message = "Missing customer email";
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

      const phone = toStringOrNull(metadata.phone) || toStringOrNull(input.customer?.phone);
      const couponCode = toStringOrNull(metadata.coupon_code);
      const userId = toStringOrNull(metadata.checkout_user_id);
      const shouldSaveAddress = toBoolean(metadata.checkout_save_address);
      const customerName =
        toStringOrNull(metadata.customer_name) ||
        (() => {
          const maybeAddress = isRecord(shippingAddress) ? shippingAddress : null;
          const first = maybeAddress ? toStringOrNull(maybeAddress.firstName) : null;
          const last = maybeAddress ? toStringOrNull(maybeAddress.lastName) : null;
          const fullName = [first, last].filter(Boolean).join(" ").trim();
          if (fullName) return fullName;
          const fromCustomer = [
            toStringOrNull(input.customer?.first_name),
            toStringOrNull(input.customer?.last_name),
          ]
            .filter(Boolean)
            .join(" ")
            .trim();
          return fromCustomer || "Customer";
        })();
      const userNote = toStringOrNull(metadata.checkout_notes);

      const orderNumber = buildOrderNumber();
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
          subtotalAmount: String(subtotalAmount),
          shippingAmount: String(shippingAmount),
          discountAmount: String(discountAmount),
          couponCode,
          totalAmount: String(totalAmount),
          currencyCode: "NGN",
          notes: buildOrderNotes(userNote, reference),
          paymentTransactionId: upserted.id,
          paymentProvider: "paystack",
          paymentReference: reference,
        })
        .returning();

      if (!createdOrder) {
        throw new Error("Failed to create catalog order");
      }

      await tx.insert(orderItems).values(
        uniqueLines.map(({ line, variant, product, image }) => ({
          orderId: createdOrder.id,
          productId: variant.productId,
          productVariantId: line.productVariantId,
          productTitle: product.title,
          variantTitle: variant.title,
          quantity: line.quantity,
          price: String(variant.price),
          totalAmount: String(line.totalAmount),
          currencyCode: line.currencyCode,
          productImage: image?.url || null,
        })),
      );

      if (couponCode) {
        const [coupon] = await tx
          .select()
          .from(coupons)
          .where(ilike(coupons.code, couponCode))
          .limit(1);

        if (coupon) {
          await tx.insert(couponUsages).values({
            couponId: coupon.id,
            userId: userId || null,
            sessionId: null,
          });
          await tx
            .update(coupons)
            .set({ usedCount: sql`${coupons.usedCount} + 1` })
            .where(eq(coupons.id, coupon.id));
        }
      }

      if (shouldSaveAddress && userId) {
        await tx
          .update(users)
          .set({ shippingAddress, billingAddress })
          .where(eq(users.id, userId));
      }

      await tx.delete(cartLines).where(eq(cartLines.cartId, cart.id));
      await tx
        .update(carts)
        .set({
          totalQuantity: 0,
          subtotalAmount: "0",
          totalAmount: "0",
          totalTaxAmount: "0",
        })
        .where(eq(carts.id, cart.id));

      await tx
        .update(abandonedCarts)
        .set({ recovered: true, recoveredAt: new Date() })
        .where(
          and(eq(abandonedCarts.cartId, cart.id), eq(abandonedCarts.recovered, false)),
        );

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

      await insertPaymentEvent(tx, {
        paymentTransactionId: upserted.id,
        reference,
        source,
        eventType: input.eventType,
        status: "paid",
        message: "Catalog checkout reconciled and order created",
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
          items: uniqueLines.map(({ line, variant, product, image }) => ({
            productTitle: product.title,
            variantTitle: variant.title,
            quantity: line.quantity,
            price: Number(variant.price),
            productImage: image?.url || null,
            sku: line.productVariantId,
          })),
        },
      };
    });

    if (output.status === "paid" && output.created && output.emailPayload) {
      await sendOrderEmails(output.emailPayload);
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
