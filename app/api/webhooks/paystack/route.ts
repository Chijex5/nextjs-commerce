import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
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
  productImages,
  productVariants,
  products,
  users,
} from "lib/db/schema";
import {
  sendAdminNewOrderNotification,
  sendOrderConfirmationWithMarkup,
} from "@/lib/email/order-emails";
import { getAdminNotificationEmails } from "lib/email/admin-notification-emails";

type PaystackChargeData = {
  reference?: string;
  amount?: number;
  currency?: string;
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
  typeof value === "string" && value.trim() ? value.trim() : null;

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

async function findOrderByReference(reference: string) {
  const [existingOrder] = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber })
    .from(orders)
    .where(ilike(orders.notes, `%Paystack Ref: ${reference}%`))
    .limit(1);

  return existingOrder || null;
}

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
  items: Array<{
    productTitle: string;
    variantTitle: string;
    quantity: number;
    price: number;
    productImage?: string | null;
    sku?: string;
  }>;
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
      items: input.items.map((item) => ({
        productTitle: item.productTitle,
        variantTitle: item.variantTitle,
        quantity: item.quantity,
        price: item.price,
        productImage: item.productImage || null,
        sku: item.sku,
      })),
      shippingAddress: input.shippingAddress,
      orderDate: input.orderDate,
    });
  } catch (emailError) {
    console.error("Webhook: failed to send customer order confirmation:", emailError);
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
    console.error("Webhook: failed to send admin order notification:", emailError);
  }
}

async function reconcileCustomQuoteCharge({
  reference,
  amount,
  metadata,
}: {
  reference: string;
  amount: number;
  metadata: Record<string, unknown>;
}) {
  const quoteId = toStringOrNull(metadata.custom_quote_id);
  const requestId = toStringOrNull(metadata.custom_request_id);
  if (!quoteId || !requestId) return;

  const [quote, requestRow] = await Promise.all([
    db
      .select()
      .from(customOrderQuotes)
      .where(eq(customOrderQuotes.id, quoteId))
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select()
      .from(customOrderRequests)
      .where(eq(customOrderRequests.id, requestId))
      .limit(1)
      .then((rows) => rows[0]),
  ]);

  if (!quote || !requestRow) {
    console.error("Webhook: missing quote/request for custom charge", {
      reference,
      quoteId,
      requestId,
    });
    return;
  }

  if (requestRow.convertedOrderId || quote.status === "paid") {
    return;
  }

  const expectedAmountInKobo = Math.round(Number(quote.amount) * 100);
  if (!Number.isFinite(amount) || amount !== expectedAmountInKobo) {
    console.error("Webhook: custom quote amount mismatch", {
      reference,
      expectedAmountInKobo,
      amount,
    });
    return;
  }

  const orderNumber = buildOrderNumber();

  try {
    const created = await db.transaction(async (tx) => {
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
          notes: buildOrderNotes(
            `Custom order ${requestRow.requestNumber}`,
            reference,
          ),
          orderType: "custom",
          customOrderRequestId: requestRow.id,
        })
        .returning();

      if (!createdOrder) throw new Error("Failed to create custom order");

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
          ? (requestRow.referenceImages[0] as string | undefined) || null
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

      return createdOrder;
    });

    await sendOrderEmails({
      orderId: created.id,
      orderNumber: created.orderNumber,
      customerName: created.customerName,
      email: created.email,
      phone: created.phone,
      totalAmount: Number(created.totalAmount),
      subtotalAmount: Number(created.subtotalAmount),
      shippingAmount: Number(created.shippingAmount),
      taxAmount: Number(created.taxAmount),
      discountAmount: Number(created.discountAmount || 0),
      couponCode: created.couponCode,
      currencyCode: created.currencyCode,
      orderDate: created.createdAt.toISOString(),
      shippingAddress: created.shippingAddress,
      items: [
        {
          productTitle: `Custom Order - ${requestRow.requestNumber}`,
          variantTitle: "Quoted Request",
          quantity: 1,
          price: Number(quote.amount),
          productImage: Array.isArray(requestRow.referenceImages)
            ? (requestRow.referenceImages[0] as string | undefined) || null
            : null,
          sku: quote.id,
        },
      ],
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      // Unique conflict from concurrent verify/webhook processing.
      return;
    }
    throw error;
  }
}

async function reconcileCatalogCharge({
  reference,
  amount,
  metadata,
  customer,
}: {
  reference: string;
  amount: number;
  metadata: Record<string, unknown>;
  customer?: PaystackChargeData["customer"];
}) {
  const cartId = toStringOrNull(metadata.cart_id);
  if (!cartId) return;

  const [cart] = await db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
  if (!cart) {
    console.error("Webhook: cart not found for charge", { reference, cartId });
    return;
  }

  const cartLineRows = await db
    .select({
      line: cartLines,
      variant: productVariants,
      product: products,
      image: productImages,
    })
    .from(cartLines)
    .innerJoin(productVariants, eq(cartLines.productVariantId, productVariants.id))
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
    return;
  }

  const subtotalAmount = Number(cart.subtotalAmount);
  const discountAmount = Math.min(
    subtotalAmount,
    Math.max(0, toNumberOrZero(metadata.discount_amount)),
  );
  const shippingAmount = 0;
  const totalAmount = subtotalAmount - discountAmount + shippingAmount;
  const expectedAmountInKobo = Math.round(totalAmount * 100);

  if (!Number.isFinite(amount) || amount !== expectedAmountInKobo) {
    console.error("Webhook: catalog charge amount mismatch", {
      reference,
      expectedAmountInKobo,
      amount,
    });
    return;
  }

  const shippingAddress = isRecord(metadata.checkout_shipping_address)
    ? metadata.checkout_shipping_address
    : {};
  const billingAddress = isRecord(metadata.checkout_billing_address)
    ? metadata.checkout_billing_address
    : null;
  const email =
    toStringOrNull(metadata.checkout_email) ||
    toStringOrNull(customer?.email);

  if (!email) {
    console.error("Webhook: missing customer email for catalog charge", {
      reference,
      cartId,
    });
    return;
  }

  const phone =
    toStringOrNull(metadata.phone) || toStringOrNull(customer?.phone);
  const couponCode = toStringOrNull(metadata.coupon_code);
  const userId = toStringOrNull(metadata.checkout_user_id);
  const shouldSaveAddress = toBoolean(metadata.checkout_save_address);
  const customerName =
    toStringOrNull(metadata.customer_name) ||
    (() => {
      if (isRecord(shippingAddress)) {
        const first = toStringOrNull(shippingAddress.firstName);
        const last = toStringOrNull(shippingAddress.lastName);
        const full = [first, last].filter(Boolean).join(" ").trim();
        if (full) return full;
      }
      const fromCustomer = [
        toStringOrNull(customer?.first_name),
        toStringOrNull(customer?.last_name),
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      return fromCustomer || "Customer";
    })();
  const userNote = toStringOrNull(metadata.checkout_notes);
  const orderNumber = buildOrderNumber();

  const orderItemsData = uniqueLines.map(({ line, variant, product, image }) => ({
    productId: variant.productId,
    productVariantId: line.productVariantId,
    productTitle: product.title,
    variantTitle: variant.title,
    quantity: line.quantity,
    price: Number(variant.price),
    totalAmount: Number(line.totalAmount),
    currencyCode: line.currencyCode,
    productImage: image?.url || null,
    sku: line.productVariantId,
  }));

  const created = await db.transaction(async (tx) => {
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
      })
      .returning();

    if (!createdOrder) throw new Error("Failed to create webhook catalog order");

    await tx.insert(orderItems).values(
      orderItemsData.map((item) => ({
        orderId: createdOrder.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productTitle: item.productTitle,
        variantTitle: item.variantTitle,
        quantity: item.quantity,
        price: String(item.price),
        totalAmount: String(item.totalAmount),
        currencyCode: item.currencyCode,
        productImage: item.productImage,
      })),
    );

    return createdOrder;
  });

  if (couponCode) {
    try {
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(ilike(coupons.code, couponCode))
        .limit(1);

      if (coupon) {
        await db.insert(couponUsages).values({
          couponId: coupon.id,
          userId: userId || null,
          sessionId: null,
        });
        await db
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(eq(coupons.id, coupon.id));
      }
    } catch (couponError) {
      console.error("Webhook: failed to track coupon usage:", couponError);
    }
  }

  if (shouldSaveAddress && userId) {
    try {
      await db
        .update(users)
        .set({ shippingAddress, billingAddress })
        .where(eq(users.id, userId));
    } catch (addressError) {
      console.error("Webhook: failed to save user addresses:", addressError);
    }
  }

  await sendOrderEmails({
    orderId: created.id,
    orderNumber: created.orderNumber,
    customerName: created.customerName,
    email: created.email,
    phone: created.phone,
    totalAmount: Number(created.totalAmount),
    subtotalAmount: Number(created.subtotalAmount),
    shippingAmount: Number(created.shippingAmount),
    taxAmount: Number(created.taxAmount),
    discountAmount: Number(created.discountAmount || 0),
    couponCode: created.couponCode,
    currencyCode: created.currencyCode,
    orderDate: created.createdAt.toISOString(),
    shippingAddress: created.shippingAddress,
    items: orderItemsData.map((item) => ({
      productTitle: item.productTitle,
      variantTitle: item.variantTitle,
      quantity: item.quantity,
      price: item.price,
      productImage: item.productImage,
      sku: item.sku,
    })),
  });

  await db.delete(cartLines).where(eq(cartLines.cartId, cart.id));
  await db
    .update(carts)
    .set({
      totalQuantity: 0,
      subtotalAmount: "0",
      totalAmount: "0",
      totalTaxAmount: "0",
    })
    .where(eq(carts.id, cart.id));

  await db
    .update(abandonedCarts)
    .set({ recovered: true, recoveredAt: new Date() })
    .where(
      and(eq(abandonedCarts.cartId, cart.id), eq(abandonedCarts.recovered, false)),
    );
}

async function handleChargeSuccess(data: PaystackChargeData) {
  const reference = toStringOrNull(data.reference);
  if (!reference) return;

  const existingOrder = await findOrderByReference(reference);
  if (existingOrder) return;

  const metadata = isRecord(data.metadata) ? data.metadata : {};
  const amount = toNumberOrZero(data.amount);

  if (metadata.custom_quote_id && metadata.custom_request_id) {
    await reconcileCustomQuoteCharge({ reference, amount, metadata });
    return;
  }

  if (metadata.cart_id) {
    await reconcileCatalogCharge({
      reference,
      amount,
      metadata,
      customer: data.customer,
    });
  }
}

async function handleChargeFailed(data: PaystackChargeData) {
  const reference = toStringOrNull(data.reference);
  const metadata = isRecord(data.metadata) ? data.metadata : {};
  const cartId = toStringOrNull(metadata.cart_id);
  void reference;
  void cartId;
}

export async function POST(request: NextRequest) {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error("Paystack secret key not configured");
      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 },
      );
    }

    const signature = request.headers.get("x-paystack-signature");
    if (!signature) {
      console.error("No Paystack signature found");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const body = await request.text();
    const hash = crypto
      .createHmac("sha512", paystackSecretKey)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid Paystack signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body) as {
      event?: string;
      data?: PaystackChargeData;
    };

    if (!event?.event || !event?.data) {
      return NextResponse.json({ status: "ignored" });
    }

    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(event.data);
        break;
      case "charge.failed":
        await handleChargeFailed(event.data);
        break;
      default:
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
