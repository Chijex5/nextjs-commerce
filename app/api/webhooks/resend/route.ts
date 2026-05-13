import { updateEmailLogStatus } from "@/lib/email/marketing-campaigns";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Invalid webhook format" },
        { status: 400 }
      );
    }

    console.log("RESEND WEBHOOK:", type);

    const emailId = data.email_id;
    const recipient = data.to?.[0];

    switch (type) {
      case "email.sent":
        console.log(`Email sent: ${emailId}`);
        break;

      case "email.delivered":
        console.log(`Email delivered: ${emailId}`);
        break;

      case "email.opened":
        await updateEmailLogStatus(emailId, "OPENED");
        console.log(`Email opened: ${emailId}`);
        break;

      case "email.clicked":
        await updateEmailLogStatus(emailId, "CLICKED");

        console.log(
          `Email clicked: ${emailId}`,
          data.click?.link
        );

        break;

      case "email.bounced":
        await updateEmailLogStatus(emailId, "BOUNCED", {
          bounceReason: data.bounce_type || "Unknown",
        });

        console.log(`Email bounced: ${recipient}`);

        break;

      case "email.complained":
        console.log(`Email complained: ${emailId}`);
        break;

      default:
        console.log(`Unhandled event type: ${type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);

    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}