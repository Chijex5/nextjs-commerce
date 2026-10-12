import { eq } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { customOrderRequests } from "lib/db/schema";
import { isCustomOrderFeatureEnabled } from "lib/custom-order-utils";
import {
  MAX_MESSAGE_LENGTH,
  MAX_MESSAGE_PHOTOS,
  postMessage,
} from "lib/custom-orders/messages";
import { toUploadList } from "lib/custom-orders/uploads";
import { NextRequest, NextResponse } from "next/server";

/** The shop replies in a request's thread (the customer is emailed). */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!isCustomOrderFeatureEnabled())
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const session = await requireAdminSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const [row] = await db
      .select()
      .from(customOrderRequests)
      .where(eq(customOrderRequests.id, id))
      .limit(1);
    if (!row)
      return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const text =
      typeof body.body === "string"
        ? body.body.trim().slice(0, MAX_MESSAGE_LENGTH)
        : "";
    const attachments = toUploadList(body.attachments, MAX_MESSAGE_PHOTOS);
    if (!text && !attachments.length)
      return NextResponse.json({ error: "Write a message first" }, { status: 400 });

    const result = await postMessage({
      request: row,
      author: "admin",
      authorName: session.user?.name || "D'FOOTPRINT",
      body: text || "(photo)",
      attachments,
      askQuestion: body.askQuestion === true,
    });
    return NextResponse.json({ success: true, status: result.status });
  } catch (error) {
    console.error("Failed to post admin custom request message:", error);
    return NextResponse.json({ error: "Couldn't send the message" }, { status: 500 });
  }
}
