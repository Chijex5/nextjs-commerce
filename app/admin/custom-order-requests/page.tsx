import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { desc, inArray } from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { customOrderQuotes, customOrderRequests } from "lib/db/schema";
import AdminNav from "components/admin/AdminNav";
import CustomOrderRequestsManagement from "components/admin/CustomOrderRequestsManagement";

export default async function AdminCustomOrderRequestsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const enabled = process.env.CUSTOM_ORDER_REQUESTS_ENABLED === "true";
  if (!enabled) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <AdminNav
          currentPage="custom-order-requests"
          userEmail={session.user?.email}
        />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              Custom Requests
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Enable `CUSTOM_ORDER_REQUESTS_ENABLED=true` to manage custom
              requests.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const requestRows = await db
    .select()
    .from(customOrderRequests)
    .orderBy(desc(customOrderRequests.createdAt));

  const requestIds = requestRows.map((row) => row.id);
  const quoteRows = requestIds.length
    ? await db
        .select()
        .from(customOrderQuotes)
        .where(inArray(customOrderQuotes.requestId, requestIds))
        .orderBy(desc(customOrderQuotes.version))
    : [];

  const quotesByRequest = quoteRows.reduce<
    Record<string, (typeof quoteRows)[number][]>
  >((acc, quote) => {
    const bucket = acc[quote.requestId] || [];
    bucket.push(quote);
    acc[quote.requestId] = bucket;
    return acc;
  }, {});

  const serializedRequests = requestRows.map((request) => ({
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
    status: request.status,
    adminNotes: request.adminNotes,
    customerNotes: request.customerNotes,
    quotedAmount: request.quotedAmount ? String(request.quotedAmount) : null,
    currencyCode: request.currencyCode,
    quoteExpiresAt: request.quoteExpiresAt?.toISOString() || null,
    paidAt: request.paidAt?.toISOString() || null,
    convertedOrderId: request.convertedOrderId,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    quotes: (quotesByRequest[request.id] || []).map((quote) => ({
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
  }));

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav
        currentPage="custom-order-requests"
        userEmail={session.user?.email}
      />
      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              Custom Requests
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Review requests, send quotes, and track quote/payment status.
            </p>
          </div>
          <CustomOrderRequestsManagement requests={serializedRequests} />
        </div>
      </div>
    </div>
  );
}
