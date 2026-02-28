import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { customOrderQuotes, customOrderRequests } from "lib/db/schema";
import {
  CUSTOM_ORDER_QUOTE_STATUSES,
  isCustomOrderFeatureEnabled,
} from "lib/custom-order-utils";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!isCustomOrderFeatureEnabled()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const status = typeof body.status === "string" ? body.status.trim() : "";

    if (!CUSTOM_ORDER_QUOTE_STATUSES.includes(status as any)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(customOrderQuotes)
      .where(eq(customOrderQuotes.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const [updatedQuote] = await db
      .update(customOrderQuotes)
      .set({
        status,
        note: typeof body.note === "string" ? body.note.trim() : undefined,
        expiresAt:
          typeof body.expiresAt === "string" && body.expiresAt
            ? new Date(body.expiresAt)
            : undefined,
        updatedAt: new Date(),
      })
      .where(eq(customOrderQuotes.id, id))
      .returning();

    if (!updatedQuote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    let requestStatus: string | undefined;
    if (status === "accepted") requestStatus = "awaiting_payment";
    if (status === "rejected") requestStatus = "under_review";
    if (status === "expired") requestStatus = "quoted";
    if (status === "paid") requestStatus = "paid";

    if (requestStatus) {
      await db
        .update(customOrderRequests)
        .set({
          status: requestStatus,
          updatedAt: new Date(),
        })
        .where(eq(customOrderRequests.id, existing.requestId));
    }

    return NextResponse.json({
      success: true,
      quote: {
        id: updatedQuote.id,
        status: updatedQuote.status,
        updatedAt: updatedQuote.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update custom quote:", error);
    return NextResponse.json(
      { error: "Failed to update quote" },
      { status: 500 },
    );
  }
}
