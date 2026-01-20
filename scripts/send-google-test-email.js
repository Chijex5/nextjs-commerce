#!/usr/bin/env node

/**
 * Script to send test email to Google for Email Markup whitelisting
 * Run: node scripts/send-google-test-email.js
 */

const { Resend } = require("resend");
require("dotenv").config();

async function sendGoogleTestEmail() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = "order@dfootprint.me";
  const replyToEmail = "support@dfootprint.me";

  if (!apiKey) {
    console.error("❌ Error: RESEND_API_KEY not set in environment variables");
    console.log("Please set your Resend API key:");
    console.log('export RESEND_API_KEY="re_xxxxxxxxxxxxx"');
    process.exit(1);
  }

  console.log(
    "🚀 Sending test email to Google for Email Markup whitelisting...",
  );
  console.log(`From: ${fromEmail}`);
  console.log(`To: schema.whitelisting+sample@gmail.com`);
  console.log(`Reply-To: ${replyToEmail}`);

  const resend = new Resend(apiKey);

  // Sample order data for the test
  const testOrder = {
    "@context": "http://schema.org",
    "@type": "Order",
    merchant: {
      "@type": "Organization",
      name: "D'FOOTPRINT",
    },
    orderNumber: "ORD-TEST-12345",
    orderDate: new Date().toISOString(),
    orderStatus: "http://schema.org/OrderProcessing",
    priceCurrency: "NGN",
    price: 25000,
    acceptedOffer: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: "Handcrafted Leather Sandals - Size 42",
          image:
            "https://dfootprint.me/images/products/handcrafted-leather-sandals-42.jpg",
          sku: "SANDAL-42",
          url: "https://dfootprint.me/products/handcrafted-leather-sandals",
        },
        price: 25000,
        priceCurrency: "NGN",
        priceSpecification: {
          "@type": "PriceSpecification",
          price: 25000,
          priceCurrency: "NGN",
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
      email: "schema.whitelisting+sample@gmail.com",
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
    url: "https://dfootprint.me/orders",
    potentialAction: {
      "@type": "ViewAction",
      url: "https://dfootprint.me/orders",
      name: "View Order",
    },
  };

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Email for Google Email Markup Whitelisting</title>
  <!-- Google Email Markup -->
  <script type="application/ld+json">
  ${JSON.stringify(testOrder, null, 2)}
  </script>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1>Test Email for Google Email Markup Whitelisting</h1>
  <p>This is a test email sent to Google to request whitelisting for Email Markup.</p>
  
  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h2>Test Order Details</h2>
    <p><strong>Order Number:</strong> ORD-TEST-12345</p>
    <p><strong>Customer:</strong> Test Customer</p>
    <p><strong>Total:</strong> ₦25,000</p>
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
      from: fromEmail,
      to: "schema.whitelisting+sample@gmail.com",
      replyTo: replyToEmail,
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
    if (error.message) {
      console.error("Error message:", error.message);
    }
    process.exit(1);
  }
}

// Run the script
sendGoogleTestEmail().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
