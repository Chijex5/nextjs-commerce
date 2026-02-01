#!/usr/bin/env -S tsx

/**
 * Send a production-representative order confirmation email with Google Email Markup.
 * Run: pnpm tsx scripts/send-google-test-email.ts
 *
 * Optional env:
 * - GOOGLE_SAMPLE_ORDER_NUMBER=ORD-123 (use a specific order)
 * - GOOGLE_SCHEMA_SAMPLE_EMAIL=schema.whitelisting+sample@gmail.com
 * - ORDER_FROM_EMAIL=order@dfootprint.me
 * - ORDER_REPLY_TO=support@dfootprint.me
 * - DATABASE_URL / DIRECT_DATABASE_URL / PRISMA_DATABASE_URL
 */

import "dotenv/config";
import { Resend } from "resend";
import prisma from "../lib/prisma";
import { orderConfirmationWithMarkupTemplate } from "../lib/email/templates/order-confirmation-with-markup";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.ORDER_FROM_EMAIL || "order@dfootprint.me";
const replyToEmail = process.env.ORDER_REPLY_TO || "support@dfootprint.me";
const sampleRecipient =
  process.env.GOOGLE_SCHEMA_SAMPLE_EMAIL ||
  "schema.whitelisting+sample@gmail.com";
const orderNumberOverride =
  process.env.GOOGLE_SAMPLE_ORDER_NUMBER || process.env.ORDER_NUMBER;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "https://yourdomain.com";

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof (value as { toNumber?: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
};

const pickString = (...values: Array<unknown>) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return "";
};

const normalizeShippingAddress = (input: unknown) => {
  const raw =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  const normalized = {
    ...raw,
    firstName: pickString(raw.firstName, raw.first_name),
    lastName: pickString(raw.lastName, raw.last_name),
    address: pickString(
      raw.address,
      raw.streetAddress,
      raw.street_address,
      raw.street,
    ),
    city: pickString(raw.city, raw.lga, raw.town),
    state: pickString(raw.state, raw.region, raw.stateName),
  };

  return normalized;
};

async function loadOrder() {
  if (orderNumberOverride) {
    return prisma.order.findUnique({
      where: { orderNumber: orderNumberOverride },
      include: { items: true },
    });
  }

  return prisma.order.findFirst({
    where: {
      items: {
        some: {},
      },
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}

async function sendGoogleSampleEmail() {
  if (!apiKey) {
    console.error("ERROR: RESEND_API_KEY not set in environment variables");
    console.log('Set it: export RESEND_API_KEY="re_xxxxxxxxxxxxx"');
    process.exit(1);
  }

  if (
    !process.env.PRISMA_DATABASE_URL &&
    !process.env.DATABASE_URL &&
    !process.env.DIRECT_DATABASE_URL
  ) {
    console.error(
      "ERROR: Database URL is not set (PRISMA_DATABASE_URL / DATABASE_URL / DIRECT_DATABASE_URL)",
    );
    process.exit(1);
  }

  if (siteUrl.includes("yourdomain.com")) {
    console.warn(
      "WARNING: NEXT_PUBLIC_SITE_URL is not set. Email links will use https://yourdomain.com",
    );
  }

  console.log("Loading a real order from production data...");
  const order = await loadOrder();

  if (!order) {
    console.error("ERROR: No order found with line items to send.");
    process.exit(1);
  }

  const productIds = Array.from(
    new Set(order.items.map((item) => item.productId).filter(Boolean)),
  );

  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, handle: true },
      })
    : [];

  const handleById = new Map(products.map((product) => [product.id, product.handle]));

  const items = order.items.map((item) => ({
    productTitle: item.productTitle,
    variantTitle: item.variantTitle,
    quantity: item.quantity,
    price: toNumber(item.price),
    productImage: item.productImage || undefined,
    productHandle: handleById.get(item.productId),
  }));

  const normalizedShippingAddress = normalizeShippingAddress(order.shippingAddress);

  const html = orderConfirmationWithMarkupTemplate({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    email: order.email,
    totalAmount: toNumber(order.totalAmount),
    items,
    shippingAddress: normalizedShippingAddress,
    orderDate: order.createdAt.toISOString(),
  });

  console.log("Sending production-representative email to Google...");
  console.log(`From: ${fromEmail}`);
  console.log(`To: ${sampleRecipient}`);
  console.log(`Reply-To: ${replyToEmail}`);
  console.log(`Order: ${order.orderNumber}`);

  const resend = new Resend(apiKey);

  const result = await resend.emails.send({
    from: fromEmail,
    to: sampleRecipient,
    replyTo: replyToEmail,
    subject: `Order Confirmation #${order.orderNumber} - D'FOOTPRINT`,
    html,
  });

  console.log(result);
  console.log("Email sent successfully.");
  console.log("Email ID:", result.data?.id);
}

sendGoogleSampleEmail()
  .catch((error) => {
    console.error("ERROR: Script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
