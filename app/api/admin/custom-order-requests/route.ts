import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { customOrderQuotes, customOrderRequests } from "lib/db/schema";
import {
  buildCustomOrderRequestNumber,
  isCustomOrderFeatureEnabled,
  normalizeEmail,
  toRequestStatus,
} from "lib/custom-order-utils";

export async function GET(request: NextRequest) {
  try {
    if (!isCustomOrderFeatureEnabled()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const filters = [];
    if (status && status !== "all") {
      filters.push(eq(customOrderRequests.status, status));
    }
    if (search) {
      const q = `%${search}%`;
      filters.push(
        or(
          ilike(customOrderRequests.requestNumber, q),
          ilike(customOrderRequests.customerName, q),
          ilike(customOrderRequests.email, q),
          ilike(customOrderRequests.title, q),
        ),
      );
    }

    const whereClause = filters.length ? and(...filters) : undefined;
    const requestRows = await db
      .select()
      .from(customOrderRequests)
      .where(whereClause)
      .orderBy(desc(customOrderRequests.createdAt));

    const requestIds = requestRows.map((row) => row.id);
    const quoteRows = requestIds.length
      ? await db
          .select()
          .from(customOrderQuotes)
          .where(inArray(customOrderQuotes.requestId, requestIds))
          .orderBy(desc(customOrderQuotes.version))
      : [];

    const latestQuoteByRequest = new Map<string, (typeof quoteRows)[number]>();
    for (const quote of quoteRows) {
      if (!latestQuoteByRequest.has(quote.requestId)) {
        latestQuoteByRequest.set(quote.requestId, quote);
      }
    }

    return NextResponse.json({
      requests: requestRows.map((row) => {
        const latestQuote = latestQuoteByRequest.get(row.id);
        return {
          id: row.id,
          requestNumber: row.requestNumber,
          userId: row.userId,
          customerName: row.customerName,
          email: row.email,
          phone: row.phone,
          title: row.title,
          description: row.description,
          sizeNotes: row.sizeNotes,
          colorPreferences: row.colorPreferences,
          budgetMin: row.budgetMin ? String(row.budgetMin) : null,
          budgetMax: row.budgetMax ? String(row.budgetMax) : null,
          desiredDate: row.desiredDate?.toISOString() || null,
          referenceImages: Array.isArray(row.referenceImages)
            ? row.referenceImages
            : [],
          status: toRequestStatus(row.status),
          adminNotes: row.adminNotes,
          customerNotes: row.customerNotes,
          quotedAmount: row.quotedAmount ? String(row.quotedAmount) : null,
          currencyCode: row.currencyCode,
          quoteExpiresAt: row.quoteExpiresAt?.toISOString() || null,
          paidAt: row.paidAt?.toISOString() || null,
          convertedOrderId: row.convertedOrderId,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          latestQuote: latestQuote
            ? {
                id: latestQuote.id,
                version: latestQuote.version,
                amount: String(latestQuote.amount),
                status: latestQuote.status,
                expiresAt: latestQuote.expiresAt?.toISOString() || null,
              }
            : null,
        };
      }),
    });
  } catch (error) {
    console.error("Failed to fetch admin custom requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom requests" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isCustomOrderFeatureEnabled()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const customerName = (body.customerName || "").trim();
    const email = normalizeEmail(body.email || "");
    const title = (body.title || "").trim();
    const description = (body.description || "").trim();

    if (!customerName || !email || !title || !description) {
      return NextResponse.json(
        { error: "Name, email, title, and description are required" },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(customOrderRequests)
      .values({
        requestNumber: buildCustomOrderRequestNumber(),
        email,
        phone: body.phone?.trim() || null,
        customerName,
        title,
        description,
        sizeNotes: body.sizeNotes?.trim() || null,
        colorPreferences: body.colorPreferences?.trim() || null,
        status: "submitted",
        adminNotes: body.adminNotes?.trim() || null,
        customerNotes: body.customerNotes?.trim() || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        request: {
          id: created?.id,
          requestNumber: created?.requestNumber,
          status: created?.status,
          createdAt: created?.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create admin custom request:", error);
    return NextResponse.json(
      { error: "Failed to create custom request" },
      { status: 500 },
    );
  }
}
