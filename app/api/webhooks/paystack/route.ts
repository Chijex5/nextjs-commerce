import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "lib/db";
import { orders } from "lib/db/schema";
import { ilike } from "drizzle-orm";

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

    const event = JSON.parse(body);

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

async function handleChargeSuccess(data: any) {
  try {
    const reference = data.reference;
    const cartId = data.metadata?.cart_id;

    if (!cartId) {
      console.error("No cart_id in webhook metadata");
      return;
    }

    const [existingOrder] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(ilike(orders.notes, `%${reference}%`))
      .limit(1);

    if (existingOrder) {
      return;
    }

    // Order should be created by verify endpoint
  } catch (error) {
    console.error("Error handling charge success:", error);
  }
}

async function handleChargeFailed(data: any) {
  try {
    const reference = data.reference;
    const cartId = data.metadata?.cart_id;
    void reference;
    void cartId;
  } catch (error) {
    console.error("Error handling charge failed:", error);
  }
}
