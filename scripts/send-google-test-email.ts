#!/usr/bin/env tsx

/**
 * Script to send test email to Google for Email Markup whitelisting
 * Run: pnpm tsx scripts/send-google-test-email.ts
 *
 * Optional overrides:
 * - --product-id <uuid>
 * - PRODUCT_ID_OVERRIDE env var
 */

import "dotenv/config";
import { and, asc, desc, eq } from "drizzle-orm";
import { Resend } from "resend";
import { db, productImages, productVariants, products } from "../lib/db";

const GOOGLE_TEST_EMAIL = "schema.whitelisting+sample@gmail.com";
const FROM_EMAIL = "order@dfootprint.me";
const REPLY_TO_EMAIL = "support@dfootprint.me";
const STORE_BASE_URL = "https://dfootprint.me";

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

const productIdOverride =
  getArgValue("--product-id") ||
  process.env.PRODUCT_ID_OVERRIDE ||
  process.env.GOOGLE_TEST_PRODUCT_ID ||
  process.env.TEST_PRODUCT_ID;

type ProductSelection = {
  product: typeof products.$inferSelect;
  variant: typeof productVariants.$inferSelect;
  imageUrl?: string;
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
    imageUrl: image?.url,
  };
};

const formatCurrency = (amount: number, currencyCode: string): string => {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};

async function sendGoogleTestEmail() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("❌ Error: RESEND_API_KEY not set in environment variables");
    console.log("Please set your Resend API key:");
    console.log('export RESEND_API_KEY="re_xxxxxxxxxxxxx"');
    process.exit(1);
  }

  const { product, variant, imageUrl } = await loadProductSelection();
  const productUrl = `${STORE_BASE_URL}/products/${product.handle}`;
  const priceNumber = Number(variant.price);
  const currencyCode = variant.currencyCode || "NGN";
  const priceDisplay = formatCurrency(
    Number.isFinite(priceNumber) ? priceNumber : 0,
    currencyCode,
  );
  const orderNumber = `ORD-GOOGLE-${Date.now()}`;

  console.log(
    "🚀 Sending test email to Google for Email Markup whitelisting...",
  );
  console.log(`From: ${FROM_EMAIL}`);
  console.log(`To: ${GOOGLE_TEST_EMAIL}`);
  console.log(`Reply-To: ${REPLY_TO_EMAIL}`);
  console.log(`Product: ${product.title} (${product.id})`);
  if (productIdOverride) {
    console.log(`Product override: ${productIdOverride}`);
  }

  const resend = new Resend(apiKey);

  const testOrder = {
    "@context": "http://schema.org",
    "@type": "Order",
    merchant: {
      "@type": "Organization",
      name: "D'FOOTPRINT",
    },
    orderNumber,
    orderDate: new Date().toISOString(),
    orderStatus: "http://schema.org/OrderProcessing",
    priceCurrency: currencyCode,
    price: Number.isFinite(priceNumber) ? priceNumber : 0,
    acceptedOffer: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: product.title,
          image: imageUrl || undefined,
          sku: variant.id || product.id,
          url: productUrl,
        },
        price: Number.isFinite(priceNumber) ? priceNumber : 0,
        priceCurrency: currencyCode,
        priceSpecification: {
          "@type": "PriceSpecification",
          price: Number.isFinite(priceNumber) ? priceNumber : 0,
          priceCurrency: currencyCode,
        },
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          value: 1,
        },
      },
    ],
    customer: {
      "@type": "Person",
      name: "Test Customer",
      email: GOOGLE_TEST_EMAIL,
    },
    orderDelivery: {
      "@type": "ParcelDelivery",
      deliveryAddress: {
        "@type": "PostalAddress",
        streetAddress: "123 Test Street",
        addressLocality: "Lagos",
        addressRegion: "Lagos State",
        addressCountry: "NG",
      },
      expectedArrivalFrom: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      expectedArrivalUntil: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    url: `${STORE_BASE_URL}/orders`,
    potentialAction: {
      "@type": "ViewAction",
      url: `${STORE_BASE_URL}/orders`,
      name: "View Order",
    },
  };

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Email for Google Email Markup Whitelisting</title>
  <script type="application/ld+json">
  ${JSON.stringify(testOrder, null, 2)}
  </script>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1>Test Email for Google Email Markup Whitelisting</h1>
  <p>This is a test email sent to Google to request whitelisting for Email Markup.</p>

  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h2>Test Order Details</h2>
    <p><strong>Order Number:</strong> ${orderNumber}</p>
    <p><strong>Customer:</strong> Test Customer</p>
    <p><strong>Product:</strong> ${product.title}</p>
    <p><strong>Total:</strong> ${priceDisplay}</p>
    <p><strong>Status:</strong> Processing</p>
  </div>

  <div style="background-color: #e8f5e9; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h3>What is Email Markup?</h3>
    <p>Email Markup allows Gmail to display rich, interactive information directly in the inbox, such as:</p>
    <ul>
      <li>Order tracking information</li>
      <li>Quick action buttons</li>
      <li>Structured order details</li>
      <li>Delivery status updates</li>
    </ul>
  </div>

  <p><strong>D'FOOTPRINT</strong> - Handcrafted Footwear from Lagos, Nigeria</p>
  <p style="font-size: 12px; color: #666;">
    This email contains structured data (JSON-LD) for Google Email Markup whitelisting.
  </p>
</body>
</html>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: GOOGLE_TEST_EMAIL,
      replyTo: REPLY_TO_EMAIL,
      subject:
        "[Test] Order Confirmation - Google Email Markup Whitelisting Request",
      html: emailHtml,
    });

    console.log(result);
    console.log("✅ Test email sent successfully!");
    console.log("📧 Email ID:", result.data?.id);
    console.log("\n📝 Next Steps:");
    console.log(
      "1. Wait for Google to process your whitelisting request (can take 5-7 business days)",
    );
    console.log("2. You will receive an email confirmation when approved");
    console.log(
      "3. Once approved, Email Markup will work in Gmail for all your order emails",
    );
    console.log(
      "\n💡 Tip: Make sure your production domain is verified in Resend",
    );
    console.log('💡 Tip: Use the same "From" email address in production');
  } catch (error) {
    console.error("❌ Failed to send test email:", error);
    if (error instanceof Error && error.message) {
      console.error("Error message:", error.message);
    }
    process.exit(1);
  }
}

sendGoogleTestEmail().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
