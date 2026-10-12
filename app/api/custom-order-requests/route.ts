import { limitByIp } from "lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "lib/db";
import {
  customEditOptions,
  customOrderQuotes,
  customOrderRequests,
} from "lib/db/schema";
import { getProduct } from "lib/db/queries";
import { getUserSession } from "lib/user-session";
import {
  buildCustomOrderRequestNumber,
  buildRequestPageUrl,
  isCustomOrderFeatureEnabled,
  normalizeEmail,
  requestPagePath,
  toRequestStatus,
} from "lib/custom-order-utils";
import { getCustomOrderSettings } from "lib/custom-orders/settings";
import {
  BUDGETS,
  DEADLINES,
  KIND_LABEL,
  MAX_LINKS,
  MAX_PHOTOS,
  SIZES,
  buildTitle,
  estimate,
  labelFor,
  type ChosenEdit,
  type CustomKind,
} from "lib/custom-orders/shared";
import { toLinkList, toUploadList } from "lib/custom-orders/uploads";
import {
  sendAdminNewCustomOrderRequest,
  sendCustomOrderRequestReceived,
} from "lib/email/order-emails";
import { getAdminNotificationEmails } from "lib/email/admin-notification-emails";
import { baseUrl } from "lib/utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KINDS: CustomKind[] = ["modify", "recreate", "new"];

type CreateBody = {
  kind?: string;
  productHandle?: string;
  style?: string;
  edits?: Array<{ id?: unknown; detail?: unknown }>;
  note?: string;
  referenceImages?: unknown;
  referenceLinks?: unknown;
  sizeEu?: unknown;
  pairs?: unknown;
  footLengthCm?: unknown;
  budgetBand?: string;
  deadlineKind?: string;
  desiredDate?: string;
  customerName?: string;
  email?: string;
  phone?: string;
};

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/** Nigerian numbers in any common format → +234XXXXXXXXXX; null if invalid. */
function normalisePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("234")
    ? digits.slice(3)
    : digits.replace(/^0/, "");
  if (/^[789]\d{9}$/.test(local)) return `+234${local}`;
  // Allow international numbers for customers abroad.
  if (raw.trim().startsWith("+") && digits.length >= 8 && digits.length <= 15)
    return `+${digits}`;
  return null;
}

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
          pageUrl: requestPagePath(request.requestNumber),
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
          quotedAmount: request.quotedAmount
            ? String(request.quotedAmount)
            : null,
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
    const limited = limitByIp(request, "custom-request", 5, 60 * 60_000);
    if (limited) return limited;

    if (!isCustomOrderFeatureEnabled()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body: CreateBody = await request.json();
    const session = await getUserSession();
    const bad = (error: string) =>
      NextResponse.json({ error }, { status: 400 });

    const kind = KINDS.includes(body.kind as CustomKind)
      ? (body.kind as CustomKind)
      : null;
    if (!kind) return bad("Choose what kind of custom pair you want");

    const customerName = text(body.customerName, 120);
    const email = normalizeEmail(text(body.email, 255));
    const phone = normalisePhone(text(body.phone, 30));
    if (!customerName) return bad("Please tell us your name");
    if (!email || !EMAIL_REGEX.test(email))
      return bad("Please enter a valid email address");
    if (!phone) return bad("Please enter a valid phone number");

    const note = text(body.note, 1500);
    const style = text(body.style, 40) || null;
    const referenceImages = toUploadList(body.referenceImages, MAX_PHOTOS);
    const referenceLinks = toLinkList(body.referenceLinks, MAX_LINKS);

    const product =
      kind === "modify" && body.productHandle
        ? await getProduct(text(body.productHandle, 255))
        : undefined;
    if (kind === "modify" && !product)
      return bad("Choose the design you'd like us to change");
    if (kind === "recreate" && !referenceImages.length && !referenceLinks.length)
      return bad("Add a photo or a link to the pair you want");
    if (kind === "new" && !note && !referenceImages.length)
      return bad("Tell us about your idea or add a photo");

    // Edits: only active menu items, priced from the database (never the client).
    const requested = Array.isArray(body.edits) ? body.edits.slice(0, 12) : [];
    const ids = requested
      .map((e) => (typeof e?.id === "string" ? e.id : ""))
      .filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    const options = ids.length
      ? await db
          .select()
          .from(customEditOptions)
          .where(inArray(customEditOptions.id, ids))
      : [];
    const edits: ChosenEdit[] = options
      .filter((o) => o.isActive)
      .map((o) => {
        const detail = text(
          requested.find((e) => e?.id === o.id)?.detail,
          120,
        );
        return {
          id: o.id,
          name: o.name,
          price: Number(o.price),
          needsReview: o.needsReview,
          ...(detail ? { detail } : {}),
        };
      });
    if (kind === "modify" && !edits.length && !note)
      return bad("Tell us what you'd like to change");

    const sizeEu = Number(body.sizeEu);
    const size = SIZES.some((s) => s.eu === sizeEu) ? sizeEu : null;
    const pairs = Math.min(20, Math.max(1, Math.round(Number(body.pairs) || 1)));
    const foot = Number(body.footLengthCm);
    const footLengthCm =
      Number.isFinite(foot) && foot >= 15 && foot <= 35
        ? Math.round(foot * 10) / 10
        : null;
    const budgetBand = labelFor(BUDGETS, body.budgetBand)
      ? body.budgetBand!
      : null;
    const deadlineKind = labelFor(DEADLINES, body.deadlineKind)
      ? body.deadlineKind!
      : null;
    let desiredDate: Date | null = null;
    if (deadlineKind === "date") {
      desiredDate = body.desiredDate ? new Date(body.desiredDate) : null;
      if (!desiredDate || Number.isNaN(desiredDate.getTime()))
        return bad("Pick the date you need it by");
    } else if (deadlineKind === "two_weeks") {
      desiredDate = new Date(Date.now() + 14 * 86_400_000);
    }

    const settings = await getCustomOrderSettings();
    const est = product
      ? estimate({
          basePrice: Number(product.priceRange.minVariantPrice.amount),
          edits,
          sizeEu: size,
          pairs,
          hasExtraNote: Boolean(note),
          settings,
        })
      : null;

    const title = buildTitle({
      kind,
      productTitle: product?.title,
      style,
      edits,
    });
    // Plain-text summary for emails and anything still reading `description`.
    const description =
      [
        `${KIND_LABEL[kind]}${product ? `: ${product.title}` : style ? `: ${style}` : ""}`,
        ...edits.map(
          (e) => `• ${e.name}${e.detail ? ` — ${e.detail}` : ""}`,
        ),
        note ? `\n${note}` : "",
        referenceLinks.length ? `\nLinks: ${referenceLinks.join(" ")}` : "",
      ]
        .filter(Boolean)
        .join("\n") || title;
    const sizeNotes = size
      ? `EU ${size}${footLengthCm ? ` · foot ${footLengthCm} cm` : ""}${pairs > 1 ? ` · ${pairs} pairs` : ""}`
      : `Size to confirm${pairs > 1 ? ` · ${pairs} pairs` : ""}`;
    const colourEdit = edits.find((e) => /colou?r/i.test(e.name));

    const requestNumber = buildCustomOrderRequestNumber();
    const userId =
      session?.id && normalizeEmail(session.email) === email
        ? session.id
        : null;

    const [created] = await db
      .insert(customOrderRequests)
      .values({
        requestNumber,
        userId,
        email,
        phone,
        customerName,
        title,
        description,
        kind,
        baseProductId: product?.id ?? null,
        edits,
        estimateAmount: est ? String(est.total) : null,
        sizeEu: size,
        pairs,
        footLengthCm: footLengthCm !== null ? String(footLengthCm) : null,
        sizeNotes,
        colorPreferences: colourEdit?.detail ?? null,
        budgetBand,
        deadlineKind,
        desiredDate,
        referenceImages,
        referenceLinks,
        customerNotes: note || null,
        status: "submitted",
      })
      .returning();

    if (!created) {
      return NextResponse.json(
        { error: "Failed to create request" },
        { status: 500 },
      );
    }

    void sendCustomOrderRequestReceived({
      to: email,
      customerName: customerName.split(" ")[0] || customerName,
      requestNumber,
      trackUrl: buildRequestPageUrl(requestNumber),
      title,
      replyHours: settings.replyHours,
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
          description: `${description}\n\n${sizeNotes}${est ? `\nEstimate: ₦${est.total.toLocaleString("en-NG")}${est.partial ? " (from)" : ""}` : ""}`,
          adminUrl: `${baseUrl}/admin/custom-order-requests/${created.id}`,
        });
      }
    } catch (emailError) {
      console.error("Failed to send admin custom-request email:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        request: {
          id: created.id,
          requestNumber,
          status: created.status,
          email,
          pageUrl: requestPagePath(requestNumber),
          createdAt: created.createdAt.toISOString(),
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
