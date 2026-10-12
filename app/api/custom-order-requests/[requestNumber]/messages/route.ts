import { isCustomOrderFeatureEnabled } from "lib/custom-order-utils";
import { getRequestForCustomer } from "lib/custom-orders/access";
import {
  MAX_MESSAGE_LENGTH,
  MAX_MESSAGE_PHOTOS,
  postMessage,
} from "lib/custom-orders/messages";
import { toUploadList } from "lib/custom-orders/uploads";
import { limitByIp } from "lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

const CLOSED = ["completed", "cancelled", "rejected"];

/** The customer replies in their request's thread. */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestNumber: string }> },
) {
  try {
    if (!isCustomOrderFeatureEnabled())
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const limited = limitByIp(request, "custom-message", 20, 60 * 60_000);
    if (limited) return limited;

    const { requestNumber } = await context.params;
    const body = await request.json().catch(() => ({}));
    const row = await getRequestForCustomer(
      requestNumber,
      typeof body.t === "string" ? body.t : null,
    );
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (CLOSED.includes(row.status))
      return NextResponse.json(
        { error: "This request is closed. Start a new one if you need anything else." },
        { status: 400 },
      );

    const text =
      typeof body.body === "string"
        ? body.body.trim().slice(0, MAX_MESSAGE_LENGTH)
        : "";
    const attachments = toUploadList(body.attachments, MAX_MESSAGE_PHOTOS);
    if (!text && !attachments.length)
      return NextResponse.json({ error: "Write a message or add a photo" }, { status: 400 });

    const { message, status } = await postMessage({
      request: row,
      author: "customer",
      authorName: row.customerName,
      body: text || "(photo)",
      attachments,
    });
    return NextResponse.json({ success: true, id: message?.id, status });
  } catch (error) {
    console.error("Failed to post custom request message:", error);
    return NextResponse.json({ error: "Couldn't send your message" }, { status: 500 });
  }
}
