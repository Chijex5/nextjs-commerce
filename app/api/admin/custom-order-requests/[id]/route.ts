import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { customOrderQuotes, customOrderRequests } from "lib/db/schema";
import {
  CUSTOM_ORDER_REQUEST_STATUSES,
  isCustomOrderFeatureEnabled,
  toRequestStatus,
} from "lib/custom-order-utils";

export async function GET(
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

    const [requestRow] = await db
      .select()
      .from(customOrderRequests)
      .where(eq(customOrderRequests.id, id))
      .limit(1);

    if (!requestRow) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const quoteRows = await db
      .select()
      .from(customOrderQuotes)
      .where(eq(customOrderQuotes.requestId, id))
      .orderBy(desc(customOrderQuotes.version));

    return NextResponse.json({
      request: {
        id: requestRow.id,
        requestNumber: requestRow.requestNumber,
        userId: requestRow.userId,
        customerName: requestRow.customerName,
        email: requestRow.email,
        phone: requestRow.phone,
        title: requestRow.title,
        description: requestRow.description,
        sizeNotes: requestRow.sizeNotes,
        colorPreferences: requestRow.colorPreferences,
        budgetMin: requestRow.budgetMin ? String(requestRow.budgetMin) : null,
        budgetMax: requestRow.budgetMax ? String(requestRow.budgetMax) : null,
        desiredDate: requestRow.desiredDate?.toISOString() || null,
        referenceImages: Array.isArray(requestRow.referenceImages)
          ? requestRow.referenceImages
          : [],
        status: toRequestStatus(requestRow.status),
        adminNotes: requestRow.adminNotes,
        customerNotes: requestRow.customerNotes,
        quotedAmount: requestRow.quotedAmount
          ? String(requestRow.quotedAmount)
          : null,
        currencyCode: requestRow.currencyCode,
        quoteExpiresAt: requestRow.quoteExpiresAt?.toISOString() || null,
        paidAt: requestRow.paidAt?.toISOString() || null,
        convertedOrderId: requestRow.convertedOrderId,
        createdAt: requestRow.createdAt.toISOString(),
        updatedAt: requestRow.updatedAt.toISOString(),
        quotes: quoteRows.map((quote) => ({
          id: quote.id,
          requestId: quote.requestId,
          version: quote.version,
          amount: String(quote.amount),
          currencyCode: quote.currencyCode,
          breakdown: quote.breakdown,
          note: quote.note,
          status: quote.status,
          expiresAt: quote.expiresAt?.toISOString() || null,
          createdBy: quote.createdBy,
          createdAt: quote.createdAt.toISOString(),
          updatedAt: quote.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin custom request:", error);
    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 },
    );
  }
}

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
    const nextStatus =
      typeof body.status === "string" ? body.status.trim() : undefined;

    if (
      nextStatus &&
      !CUSTOM_ORDER_REQUEST_STATUSES.includes(nextStatus as any)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [updated] = await db
      .update(customOrderRequests)
      .set({
        status: nextStatus,
        adminNotes:
          typeof body.adminNotes === "string" ? body.adminNotes.trim() : undefined,
        customerNotes:
          typeof body.customerNotes === "string"
            ? body.customerNotes.trim()
            : undefined,
        quoteExpiresAt:
          typeof body.quoteExpiresAt === "string" && body.quoteExpiresAt
            ? new Date(body.quoteExpiresAt)
            : undefined,
        quotedAmount:
          typeof body.quotedAmount === "number" && Number.isFinite(body.quotedAmount)
            ? String(body.quotedAmount)
            : undefined,
        updatedAt: new Date(),
      })
      .where(eq(customOrderRequests.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      request: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update admin custom request:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 },
    );
  }
}
