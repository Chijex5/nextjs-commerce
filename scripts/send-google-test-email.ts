#!/usr/bin/env tsx

/**
 * Script to send a real order confirmation email to Google for Email Markup review.
 * Run: pnpm tsx scripts/send-google-test-email.ts
 *
 * Optional overrides:
 * - --order-id <uuid>
 * - --order-number <value>
 * - --product-id <uuid> (selects the latest order containing this product)
 * - --create-order (create a real order if none exist)
 * - --customer-email / --customer-name / --customer-phone
 * - --quantity <number>
 * - ORDER_ID_OVERRIDE / ORDER_NUMBER_OVERRIDE / PRODUCT_ID_OVERRIDE env vars
 * - CREATE_ORDER_IF_MISSING / CUSTOMER_EMAIL / CUSTOMER_NAME / CUSTOMER_PHONE
 * - SHIPPING_ADDRESS_JSON (JSON string override)
 */

import "dotenv/config";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { sendEmail } from "../lib/email/resend";
import { orderConfirmationWithMarkupTemplate } from "../lib/email/templates/order-confirmation-with-markup";
import {
  db,
  orderItems,
  orders,
  productImages,
  productVariants,
  products,
  users,
} from "../lib/db";

const GOOGLE_REVIEW_EMAIL = "schema.whitelisting+sample@gmail.com";
const FROM_EMAIL = "order@dfootprint.me";
const REPLY_TO_EMAIL = "support@dfootprint.me";

const getArgValue = (flag: string): string | undefined => {
  const flagIndex = process.argv.findIndex((arg) => arg === flag);
  if (flagIndex !== -1 && process.argv[flagIndex + 1]) {
    return process.argv[flagIndex + 1];
  }

  const withEquals = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (withEquals) {
    return withEquals.split("=")[1];
  }

  return undefined;
};

const orderIdOverride =
  getArgValue("--order-id") ||
  process.env.ORDER_ID_OVERRIDE ||
  process.env.GOOGLE_TEST_ORDER_ID ||
  process.env.TEST_ORDER_ID;

const orderNumberOverride =
  getArgValue("--order-number") ||
  process.env.ORDER_NUMBER_OVERRIDE ||
  process.env.GOOGLE_TEST_ORDER_NUMBER ||
  process.env.TEST_ORDER_NUMBER;

const productIdOverride =
  getArgValue("--product-id") ||
  process.env.PRODUCT_ID_OVERRIDE ||
  process.env.GOOGLE_TEST_PRODUCT_ID ||
  process.env.TEST_PRODUCT_ID;

const createOrderIfMissing =
  process.argv.includes("--create-order") ||
  ["1", "true", "yes"].includes(
    (process.env.CREATE_ORDER_IF_MISSING || "").toLowerCase(),
  );

const customerEmailOverride =
  getArgValue("--customer-email") ||
  process.env.CUSTOMER_EMAIL ||
  process.env.GOOGLE_REVIEW_CUSTOMER_EMAIL;

const customerNameOverride =
  getArgValue("--customer-name") ||
  process.env.CUSTOMER_NAME ||
  process.env.GOOGLE_REVIEW_CUSTOMER_NAME;

const customerPhoneOverride =
  getArgValue("--customer-phone") ||
  process.env.CUSTOMER_PHONE ||
  process.env.GOOGLE_REVIEW_CUSTOMER_PHONE;

const quantityOverrideRaw =
  getArgValue("--quantity") || process.env.ORDER_ITEM_QUANTITY;

const shippingAddressOverrideRaw =
  process.env.SHIPPING_ADDRESS_JSON || process.env.GOOGLE_REVIEW_SHIPPING_ADDRESS;

type SelectedItem = {
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: number;
  productImage?: string | null;
  productHandle?: string;
  sku?: string;
};

type OrderSelection = {
  order: typeof orders.$inferSelect;
  items: SelectedItem[];
};

type ProductSelection = {
  product: typeof products.$inferSelect;
  variant: typeof productVariants.$inferSelect;
  imageUrl?: string | null;
};

const parseQuantity = (): number => {
  if (!quantityOverrideRaw) return 1;
  const parsed = Number(quantityOverrideRaw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.round(parsed);
};

const parseShippingAddressOverride = (): Record<string, any> | null => {
  if (!shippingAddressOverrideRaw) return null;
  try {
    const parsed = JSON.parse(shippingAddressOverrideRaw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    throw new Error("SHIPPING_ADDRESS_JSON is not valid JSON");
  }
};

const loadProductSelection = async (): Promise<ProductSelection> => {
  const [product] = productIdOverride
    ? await db
        .select()
        .from(products)
        .where(eq(products.id, productIdOverride))
        .limit(1)
    : await db
        .select()
        .from(products)
        .orderBy(desc(products.updatedAt))
        .limit(1);

  if (!product) {
    throw new Error(
      productIdOverride
        ? `No product found for id ${productIdOverride}`
        : "No products found in the database",
    );
  }

  let [variant] = await db
    .select()
    .from(productVariants)
    .where(
      and(
        eq(productVariants.productId, product.id),
        eq(productVariants.availableForSale, true),
      ),
    )
    .orderBy(desc(productVariants.updatedAt))
    .limit(1);

  if (!variant) {
    [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id))
      .orderBy(desc(productVariants.updatedAt))
      .limit(1);
  }

  if (!variant) {
    throw new Error(`No variants found for product ${product.id}`);
  }

  const [image] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(desc(productImages.isFeatured), asc(productImages.position))
    .limit(1);

  return {
    product,
    variant,
    imageUrl: image?.url ?? null,
  };
};

const loadCustomerDefaults = async (): Promise<{
  userId: string | null;
  email: string;
  name: string;
  phone: string | null;
  shippingAddress: Record<string, any>;
}> => {
  const shippingOverride = parseShippingAddressOverride();

  const [user] = await db
    .select()
    .from(users)
    .orderBy(desc(users.updatedAt))
    .limit(1);

  const email =
    customerEmailOverride ||
    user?.email ||
    process.env.SUPPORT_EMAIL ||
    REPLY_TO_EMAIL;

  const nameFromAddress = shippingOverride
    ? `${shippingOverride.firstName || ""} ${shippingOverride.lastName || ""}`.trim()
    : "";

  const name =
    customerNameOverride ||
    user?.name ||
    nameFromAddress ||
    "Customer";

  const phone =
    customerPhoneOverride ||
    user?.phone ||
    (typeof shippingOverride?.phone1 === "string"
      ? shippingOverride.phone1
      : null);

  const shippingAddress =
    shippingOverride ||
    (user?.shippingAddress as Record<string, any> | null) || {
      firstName: name.split(" ")[0] || "Customer",
      lastName: name.split(" ").slice(1).join(" ") || "Order",
      address: "12 Ozumba Mbadiwe Rd",
      streetAddress: "12 Ozumba Mbadiwe Rd",
      city: "Lagos",
      lga: "Lagos Island",
      state: "Lagos",
      phone1: phone || "08000000000",
      phone2: "",
      country: "Nigeria",
    };

  const useUserId =
    !!user &&
    !customerEmailOverride &&
    !customerNameOverride &&
    !customerPhoneOverride &&
    !shippingOverride;

  return {
    userId: useUserId ? user.id : null,
    email,
    name,
    phone,
    shippingAddress,
  };
};

const createOrderFromProduct = async (): Promise<OrderSelection> => {
  const quantity = parseQuantity();
  const { product, variant, imageUrl } = await loadProductSelection();
  const customer = await loadCustomerDefaults();

  const unitPrice = Number(variant.price);
  const safeUnitPrice = Number.isFinite(unitPrice) ? unitPrice : 0;
  const lineTotal = safeUnitPrice * quantity;
  const currencyCode = variant.currencyCode || "NGN";

  const orderNumber = `ORD-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 11)
    .toUpperCase()}`;

  const order = await db.transaction(async (tx) => {
    const [createdOrder] = await tx
      .insert(orders)
      .values({
        orderNumber,
        userId: customer.userId,
        email: customer.email,
        phone: customer.phone,
        customerName: customer.name,
        shippingAddress: customer.shippingAddress,
        billingAddress: customer.shippingAddress,
        status: "processing",
        deliveryStatus: "production",
        subtotalAmount: lineTotal.toFixed(2),
        shippingAmount: "0.00",
        discountAmount: "0.00",
        totalAmount: lineTotal.toFixed(2),
        currencyCode,
      })
      .returning();

    if (!createdOrder) {
      throw new Error("Failed to create order");
    }

    await tx.insert(orderItems).values({
      orderId: createdOrder.id,
      productId: product.id,
      productVariantId: variant.id,
      productTitle: product.title,
      variantTitle: variant.title,
      quantity,
      price: safeUnitPrice.toFixed(2),
      totalAmount: lineTotal.toFixed(2),
      currencyCode,
      productImage: imageUrl ?? null,
    });

    return createdOrder;
  });

  return {
    order,
    items: [
      {
        productTitle: product.title,
        variantTitle: variant.title,
        quantity,
        price: safeUnitPrice,
        productImage: imageUrl ?? null,
        productHandle: product.handle,
        sku: variant.id,
      },
    ],
  };
};

const loadOrderSelection = async (): Promise<OrderSelection> => {
  let selectedOrder: typeof orders.$inferSelect | undefined;

  if (orderIdOverride) {
    [selectedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderIdOverride))
      .limit(1);
  } else if (orderNumberOverride) {
    [selectedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumberOverride))
      .limit(1);
  } else if (productIdOverride) {
    const [row] = await db
      .select({ order: orders })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(eq(orderItems.productId, productIdOverride))
      .orderBy(desc(orders.createdAt))
      .limit(1);

    selectedOrder = row?.order;
  } else {
    [selectedOrder] = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(1);
  }

  if (!selectedOrder) {
    if (createOrderIfMissing) {
      console.log("No existing orders found. Creating a real order...");
      return createOrderFromProduct();
    }
    if (orderIdOverride) {
      throw new Error(`No order found for id ${orderIdOverride}`);
    }
    if (orderNumberOverride) {
      throw new Error(`No order found for number ${orderNumberOverride}`);
    }
    if (productIdOverride) {
      throw new Error(
        `No order found containing product id ${productIdOverride}`,
      );
    }
    throw new Error(
      "No orders found in the database (pass --create-order to create one)",
    );
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, selectedOrder.id))
    .orderBy(asc(orderItems.createdAt));

  if (!items.length) {
    throw new Error(`No items found for order ${selectedOrder.orderNumber}`);
  }

  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const productRows = productIds.length
    ? await db
        .select({ id: products.id, handle: products.handle })
        .from(products)
        .where(inArray(products.id, productIds))
    : [];

  const handleById = new Map(productRows.map((row) => [row.id, row.handle]));

  const mappedItems = items.map((item) => ({
    productTitle: item.productTitle,
    variantTitle: item.variantTitle,
    quantity: item.quantity,
    price: Number(item.price),
    productImage: item.productImage,
    productHandle: handleById.get(item.productId),
    sku: item.productVariantId,
  }));

  return {
    order: selectedOrder,
    items: mappedItems,
  };
};

async function sendGoogleReviewEmail() {
  if (!process.env.RESEND_API_KEY) {
    console.error("Error: RESEND_API_KEY not set in environment variables");
    console.log("Please set your Resend API key:");
    console.log('export RESEND_API_KEY="re_xxxxxxxxxxxxx"');
    process.exit(1);
  }

  const { order, items } = await loadOrderSelection();

  if (!order.shippingAddress) {
    throw new Error(
      `Order ${order.orderNumber} is missing shipping address data`,
    );
  }

  const siteUrl = "https://dfootprint.me";
  const orderUrl = `${siteUrl}/orders?orderNumber=${encodeURIComponent(order.orderNumber)}`;

  console.log(
    "Sending production-style order confirmation to Google review inbox...",
  );
  console.log(`From: ${FROM_EMAIL}`);
  console.log(`To: ${GOOGLE_REVIEW_EMAIL}`);
  console.log(`Reply-To: ${REPLY_TO_EMAIL}`);
  console.log(`Order: ${order.orderNumber} (${order.id})`);
  if (orderIdOverride) {
    console.log(`Order override: ${orderIdOverride}`);
  }
  if (orderNumberOverride) {
    console.log(`Order number override: ${orderNumberOverride}`);
  }
  if (productIdOverride) {
    console.log(`Product override: ${productIdOverride}`);
  }

  const html = orderConfirmationWithMarkupTemplate({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    email: order.email,
    totalAmount: Number(order.totalAmount),
    currencyCode: order.currencyCode,
    items,
    shippingAddress: order.shippingAddress,
    orderDate: order.createdAt.toISOString(),
    estimatedArrival: order.estimatedArrival?.toISOString(),
    trackingNumber: order.trackingNumber || undefined,
    orderUrl,
  });

  const result = await sendEmail({
    to: GOOGLE_REVIEW_EMAIL,
    from: FROM_EMAIL,
    replyTo: REPLY_TO_EMAIL,
    subject: `Order Confirmation #${order.orderNumber} - D'FOOTPRINT`,
    html,
  });

  if (!result.success) {
    console.error("Failed to send review email:", result.error);
    process.exit(1);
  }

  console.log("Email sent successfully.");
  const emailId =
    result.data && typeof result.data === "object" && "id" in result.data
      ? (result.data as { id?: string }).id
      : undefined;
  if (emailId) {
    console.log("Email ID:", emailId);
  }
}

sendGoogleReviewEmail().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
