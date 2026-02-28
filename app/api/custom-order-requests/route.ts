import { NextRequest, NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "lib/db";
import { customOrderQuotes, customOrderRequests } from "lib/db/schema";
import { getUserSession } from "lib/user-session";
import {
  buildCustomOrderRequestNumber,
  buildCustomRequestTrackUrl,
  isCustomOrderFeatureEnabled,
  normalizeEmail,
  toRequestStatus,
} from "lib/custom-order-utils";
import {
  sendAdminNewCustomOrderRequest,
  sendCustomOrderRequestReceived,
} from "lib/email/order-emails";
import { getAdminNotificationEmails } from "lib/email/admin-notification-emails";
import { baseUrl } from "lib/utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CreateCustomOrderRequestBody = {
  customerName?: string;
  email?: string;
  phone?: string;
  title?: string;
  description?: string;
  sizeNotes?: string;
  colorPreferences?: string;
  budgetMin?: number;
  budgetMax?: number;
  desiredDate?: string;
  referenceImages?: string[];
  customerNotes?: string;
};

const toImageArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
};

export async function GET() {
  try {
    if (!isCustomOrderFeatureEnabled()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session = await getUserSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await db
      .select()
      .from(customOrderRequests)
      .where(eq(customOrderRequests.userId, session.id))
      .orderBy(desc(customOrderRequests.createdAt));

    const requestIds = requests.map((request) => request.id);
    const quoteRows = requestIds.length
      ? await db
          .select()
          .from(customOrderQuotes)
          .where(inArray(customOrderQuotes.requestId, requestIds))
          .orderBy(desc(customOrderQuotes.createdAt))
      : [];

    const latestQuoteByRequest = new Map<string, (typeof quoteRows)[number]>();
    for (const quote of quoteRows) {
      if (!latestQuoteByRequest.has(quote.requestId)) {
        latestQuoteByRequest.set(quote.requestId, quote);
      }
    }

    return NextResponse.json({
      requests: requests.map((request) => {
        const latestQuote = latestQuoteByRequest.get(request.id);
        return {
          id: request.id,
          requestNumber: request.requestNumber,
          customerName: request.customerName,
          email: request.email,
          phone: request.phone,
          title: request.title,
          description: request.description,
          sizeNotes: request.sizeNotes,
          colorPreferences: request.colorPreferences,
          budgetMin: request.budgetMin ? String(request.budgetMin) : null,
          budgetMax: request.budgetMax ? String(request.budgetMax) : null,
          desiredDate: request.desiredDate?.toISOString() || null,
          referenceImages: Array.isArray(request.referenceImages)
            ? request.referenceImages
            : [],
          status: toRequestStatus(request.status),
          customerNotes: request.customerNotes,
          quotedAmount: request.quotedAmount ? String(request.quotedAmount) : null,
          currencyCode: request.currencyCode,
          quoteExpiresAt: request.quoteExpiresAt?.toISOString() || null,
          paidAt: request.paidAt?.toISOString() || null,
          convertedOrderId: request.convertedOrderId,
          createdAt: request.createdAt.toISOString(),
          updatedAt: request.updatedAt.toISOString(),
              latestQuote: latestQuote
                ? {
                    id: latestQuote.id,
                    version: latestQuote.version,
                    amount: String(latestQuote.amount),
                    currencyCode: latestQuote.currencyCode,
                    status: latestQuote.status,
                    expiresAt: latestQuote.expiresAt?.toISOString() || null,
                  }
                : null,
        };
      }),
    });
  } catch (error) {
    console.error("Failed to fetch custom order requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom order requests" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isCustomOrderFeatureEnabled()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body: CreateCustomOrderRequestBody = await request.json();
    const session = await getUserSession();

    const customerName = body.customerName?.trim() || "";
    const email = normalizeEmail(body.email || "");
    const phone = body.phone?.trim() || null;
    const title = body.title?.trim() || "";
    const description = body.description?.trim() || "";

    if (!customerName || !title || !description) {
      return NextResponse.json(
        { error: "Name, title, and description are required" },
        { status: 400 },
      );
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 },
      );
    }

    const requestNumber = buildCustomOrderRequestNumber();
    const referenceImages = toImageArray(body.referenceImages);
    const desiredDate =
      typeof body.desiredDate === "string" && body.desiredDate
        ? new Date(body.desiredDate)
        : null;
    const budgetMin =
      typeof body.budgetMin === "number" && Number.isFinite(body.budgetMin)
        ? Math.max(0, body.budgetMin)
        : null;
    const budgetMax =
      typeof body.budgetMax === "number" && Number.isFinite(body.budgetMax)
        ? Math.max(0, body.budgetMax)
        : null;
    const userId =
      session?.id && normalizeEmail(session.email) === email ? session.id : null;

    const [createdRequest] = await db
      .insert(customOrderRequests)
      .values({
        requestNumber,
        userId,
        email,
        phone,
        customerName,
        title,
        description,
        sizeNotes: body.sizeNotes?.trim() || null,
        colorPreferences: body.colorPreferences?.trim() || null,
        budgetMin: budgetMin !== null ? String(budgetMin) : null,
        budgetMax: budgetMax !== null ? String(budgetMax) : null,
        desiredDate:
          desiredDate && !Number.isNaN(desiredDate.getTime()) ? desiredDate : null,
        referenceImages,
        status: "submitted",
        customerNotes: body.customerNotes?.trim() || null,
      })
      .returning();

    if (!createdRequest) {
      return NextResponse.json(
        { error: "Failed to create request" },
        { status: 500 },
      );
    }

    const trackUrl = buildCustomRequestTrackUrl(requestNumber, email);
    const adminUrl = `${baseUrl}/admin/custom-order-requests`;

    void sendCustomOrderRequestReceived({
      to: email,
      customerName,
      requestNumber,
      trackUrl,
    });

    try {
      const adminEmails = await getAdminNotificationEmails();
      if (adminEmails.length > 0) {
        await sendAdminNewCustomOrderRequest({
          to: adminEmails,
          customerName,
          email,
          phone,
          requestNumber,
          title,
          description,
          adminUrl,
        });
      }
    } catch (emailError) {
      console.error("Failed to send admin custom-request email:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        request: {
          id: createdRequest.id,
          requestNumber: createdRequest.requestNumber,
          status: createdRequest.status,
          email: createdRequest.email,
          createdAt: createdRequest.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create custom order request:", error);
    return NextResponse.json(
      { error: "Failed to create custom order request" },
      { status: 500 },
    );
  }
}
