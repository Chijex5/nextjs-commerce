import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "lib/db";
import { customOrderQuotes, customOrderRequests } from "lib/db/schema";
import {
  isCustomOrderFeatureEnabled,
  normalizeEmail,
  toQuoteStatus,
  toRequestStatus,
} from "lib/custom-order-utils";

export async function GET(request: NextRequest) {
  try {
    if (!isCustomOrderFeatureEnabled()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const requestNumber = searchParams.get("requestNumber")?.trim();
    const email = normalizeEmail(searchParams.get("email") || "");

    if (!requestNumber || !email) {
      return NextResponse.json(
        { error: "Request number and email are required" },
        { status: 400 },
      );
    }

    const [customRequest] = await db
      .select()
      .from(customOrderRequests)
      .where(
        and(
          ilike(customOrderRequests.requestNumber, requestNumber),
          ilike(customOrderRequests.email, email),
        ),
      )
      .limit(1);

    if (!customRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const [latestQuote] = await db
      .select()
      .from(customOrderQuotes)
      .where(eq(customOrderQuotes.requestId, customRequest.id))
      .orderBy(desc(customOrderQuotes.version))
      .limit(1);

    return NextResponse.json({
      request: {
        id: customRequest.id,
        requestNumber: customRequest.requestNumber,
        customerName: customRequest.customerName,
        email: customRequest.email,
        phone: customRequest.phone,
        title: customRequest.title,
        description: customRequest.description,
        sizeNotes: customRequest.sizeNotes,
        colorPreferences: customRequest.colorPreferences,
        budgetMin: customRequest.budgetMin ? String(customRequest.budgetMin) : null,
        budgetMax: customRequest.budgetMax ? String(customRequest.budgetMax) : null,
        desiredDate: customRequest.desiredDate?.toISOString() || null,
        referenceImages: Array.isArray(customRequest.referenceImages)
          ? customRequest.referenceImages
          : [],
        status: toRequestStatus(customRequest.status),
        adminNotes: customRequest.adminNotes,
        quotedAmount: customRequest.quotedAmount
          ? String(customRequest.quotedAmount)
          : null,
        currencyCode: customRequest.currencyCode,
        quoteExpiresAt: customRequest.quoteExpiresAt?.toISOString() || null,
        paidAt: customRequest.paidAt?.toISOString() || null,
        convertedOrderId: customRequest.convertedOrderId,
        createdAt: customRequest.createdAt.toISOString(),
        updatedAt: customRequest.updatedAt.toISOString(),
        latestQuote: latestQuote
          ? {
              id: latestQuote.id,
              version: latestQuote.version,
              amount: String(latestQuote.amount),
              currencyCode: latestQuote.currencyCode,
              breakdown: latestQuote.breakdown,
              note: latestQuote.note,
              status: toQuoteStatus(latestQuote.status),
              expiresAt: latestQuote.expiresAt?.toISOString() || null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Failed to track custom request:", error);
    return NextResponse.json(
      { error: "Failed to track custom request" },
      { status: 500 },
    );
  }
}
