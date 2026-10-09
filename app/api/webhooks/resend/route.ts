import { handleResendEvent, verifySvixSignature } from "lib/marketing/events";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const payload = await req.text();

  // Without this check anyone could post fake opens, clicks or bounces.
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RESEND_WEBHOOK_SECRET is not set; rejecting webhook");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }
  if (!verifySvixSignature(payload, req.headers, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(payload);
    if (!event?.type || !event?.data) {
      return NextResponse.json(
        { error: "Invalid webhook format" },
        { status: 400 },
      );
    }
    await handleResendEvent(event);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend webhook processing error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}
