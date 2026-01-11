import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "lib/prisma";

// Paystack webhook handler
// This endpoint receives payment notifications from Paystack
// Configure this URL in your Paystack dashboard: https://dashboard.paystack.com/#/settings/developer
export async function POST(request: NextRequest) {
  try {
    // Verify Paystack signature
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

    // Parse the webhook data
    const event = JSON.parse(body);

    // Handle different event types
    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(event.data);
        break;

      case "charge.failed":
        await handleChargeFailed(event.data);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
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

async function handleChargeSuccess(data: any) {
  try {
    const reference = data.reference;
    const cartId = data.metadata?.cart_id;

    if (!cartId) {
      console.error("No cart_id in webhook metadata");
      return;
    }

    // Check if order already exists
    const existingOrder = await prisma.order.findFirst({
      where: {
        notes: {
          contains: reference,
        },
      },
    });

    if (existingOrder) {
      console.log(`Order already exists for reference: ${reference}`);
      return;
    }

    // The order should have been created by the verify endpoint
    // This webhook is mainly for logging and backup
    console.log(
      `Payment successful for cart ${cartId}, reference: ${reference}`,
    );
  } catch (error) {
    console.error("Error handling charge success:", error);
  }
}

async function handleChargeFailed(data: any) {
  try {
    const reference = data.reference;
    const cartId = data.metadata?.cart_id;

    console.log(`Payment failed for cart ${cartId}, reference: ${reference}`);
    // You could send an email notification here or log to a monitoring service
  } catch (error) {
    console.error("Error handling charge failed:", error);
  }
}
