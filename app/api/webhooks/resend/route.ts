import {
    updateEmailLogStatus
} from "@/lib/email/marketing-campaigns";
import { NextRequest, NextResponse } from "next/server";

// POST /api/webhooks/resend - Handle Resend webhook events
export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature (optional but recommended)
    // You can add HMAC verification here using Resend's webhook secret

    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Invalid webhook format" },
        { status: 400 },
      );
    }

    const { message_id, email, bounce_type } = data;

    // Handle different event types
    switch (type) {
      case "email.delivered":
        // Email was delivered - already logged as SENT
        console.log(`Email delivered: ${message_id}`);
        break;

      case "email.opened":
        // Email was opened
        await updateEmailLogStatus(message_id, "OPENED");
        console.log(`Email opened: ${message_id}`);
        break;

      case "email.clicked":
        // Email link was clicked
        await updateEmailLogStatus(message_id, "CLICKED");
        console.log(`Email clicked: ${message_id}`);
        break;

      case "email.bounced":
        // Email bounced
        await updateEmailLogStatus(message_id, "BOUNCED", {
          bounceReason: bounce_type || "Unknown",
        });

        // Auto-unsubscribe hard bounces
        if (bounce_type === "permanent") {
          // Find the campaign ID from the email log and unsubscribe bounced addresses
          // This is done automatically by updateEmailLogStatus
          console.log(`Hard bounce detected: ${email}`);
        }
        break;

      case "email.complained":
        // Email was marked as spam
        console.log(`Email complained: ${message_id}`);
        // Could update status or unsubscribe here
        break;

      default:
        console.log(`Unknown webhook event type: ${type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}
