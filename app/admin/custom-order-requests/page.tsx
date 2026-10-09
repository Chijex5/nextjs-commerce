import {
  RequestsInbox,
  type RequestItem,
} from "components/admin/custom-requests/requests-inbox";
import { Page, PageHeader } from "components/admin/ui";
import { desc, inArray } from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { customOrderQuotes, customOrderRequests } from "lib/db/schema";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CustomRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; id?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  if (process.env.CUSTOM_ORDER_REQUESTS_ENABLED !== "true") {
    return (
      <Page>
        <PageHeader
          eyebrow="Sales"
          title="Custom requests"
          description="Custom requests are switched off. Set CUSTOM_ORDER_REQUESTS_ENABLED=true in the Vercel project's environment variables to let customers request bespoke pairs."
        />
      </Page>
    );
  }

  const params = await searchParams;
  const requestRows = await db
    .select()
    .from(customOrderRequests)
    .orderBy(desc(customOrderRequests.createdAt));
  const ids = requestRows.map((r) => r.id);
  const quoteRows = ids.length
    ? await db
        .select()
        .from(customOrderQuotes)
        .where(inArray(customOrderQuotes.requestId, ids))
        .orderBy(desc(customOrderQuotes.version))
    : [];

  const requests: RequestItem[] = requestRows.map((r) => ({
    id: r.id,
    requestNumber: r.requestNumber,
    customerName: r.customerName,
    email: r.email,
    phone: r.phone,
    title: r.title,
    description: r.description,
    sizeNotes: r.sizeNotes,
    colorPreferences: r.colorPreferences,
    budgetMin: r.budgetMin ? Number(r.budgetMin) : null,
    budgetMax: r.budgetMax ? Number(r.budgetMax) : null,
    desiredDate: r.desiredDate?.toISOString() ?? null,
    referenceImages: Array.isArray(r.referenceImages)
      ? (r.referenceImages as string[])
      : [],
    status: r.status,
    adminNotes: r.adminNotes,
    customerNotes: r.customerNotes,
    quotedAmount: r.quotedAmount ? Number(r.quotedAmount) : null,
    quoteExpiresAt: r.quoteExpiresAt?.toISOString() ?? null,
    paidAt: r.paidAt?.toISOString() ?? null,
    convertedOrderId: r.convertedOrderId,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    quotes: quoteRows
      .filter((q) => q.requestId === r.id)
      .map((q) => ({
        id: q.id,
        version: q.version,
        amount: Number(q.amount),
        note: q.note,
        status: q.status,
        expiresAt: q.expiresAt?.toISOString() ?? null,
        createdBy: q.createdBy,
        createdAt: q.createdAt.toISOString(),
      })),
  }));

  return (
    <Page className="lg:pb-10">
      <PageHeader
        eyebrow="Sales"
        title="Custom requests"
        description="Bespoke pairs, from first message to paid order. Send a quote and the customer gets a link to pay it."
      />
      <RequestsInbox
        requests={requests}
        initialView={params.view}
        initialId={params.id}
      />
    </Page>
  );
}
