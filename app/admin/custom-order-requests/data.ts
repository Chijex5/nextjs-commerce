import type { RequestItem } from "components/admin/custom-requests/meta";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { quoteLines, type ChosenEdit } from "lib/custom-orders/shared";
import { db } from "lib/db";
import {
  customOrderQuotes,
  customOrderRequests,
  customRequestMessages,
  orders,
  productImages,
  products,
} from "lib/db/schema";

/** Custom requests with their quotes, messages, base design and balance, newest first. */
export async function loadRequests(id?: string): Promise<RequestItem[]> {
  const requestRows = await db
    .select()
    .from(customOrderRequests)
    .where(id ? eq(customOrderRequests.id, id) : undefined)
    .orderBy(desc(customOrderRequests.createdAt));
  const ids = requestRows.map((r) => r.id);
  if (!ids.length) return [];

  const productIds = [
    ...new Set(requestRows.map((r) => r.baseProductId).filter(Boolean)),
  ] as string[];
  const orderIds = requestRows
    .map((r) => r.convertedOrderId)
    .filter(Boolean) as string[];

  const [quoteRows, messageRows, productRows, imageRows, orderRows] =
    await Promise.all([
      db
        .select()
        .from(customOrderQuotes)
        .where(inArray(customOrderQuotes.requestId, ids))
        .orderBy(desc(customOrderQuotes.version)),
      db
        .select()
        .from(customRequestMessages)
        .where(inArray(customRequestMessages.requestId, ids))
        .orderBy(asc(customRequestMessages.createdAt)),
      productIds.length
        ? db
            .select({ id: products.id, title: products.title, handle: products.handle })
            .from(products)
            .where(inArray(products.id, productIds))
        : Promise.resolve([]),
      productIds.length
        ? db
            .select({ productId: productImages.productId, url: productImages.url })
            .from(productImages)
            .where(inArray(productImages.productId, productIds))
            .orderBy(asc(productImages.position))
        : Promise.resolve([]),
      orderIds.length
        ? db
            .select({ id: orders.id, balanceDue: orders.balanceDue })
            .from(orders)
            .where(inArray(orders.id, orderIds))
        : Promise.resolve([]),
    ]);

  const balanceByOrder = new Map(orderRows.map((o) => [o.id, Number(o.balanceDue)]));
  const productById = new Map(
    productRows.map((p) => [
      p.id,
      { ...p, image: imageRows.find((i) => i.productId === p.id)?.url ?? null },
    ]),
  );

  return requestRows.map((r) => ({
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
    kind: r.kind,
    baseProduct: r.baseProductId ? (productById.get(r.baseProductId) ?? null) : null,
    edits: (Array.isArray(r.edits) ? r.edits : []) as ChosenEdit[],
    estimateAmount: r.estimateAmount ? Number(r.estimateAmount) : null,
    sizeEu: r.sizeEu,
    pairs: r.pairs,
    footLengthCm: r.footLengthCm ? Number(r.footLengthCm) : null,
    budgetBand: r.budgetBand,
    deadlineKind: r.deadlineKind,
    referenceLinks: Array.isArray(r.referenceLinks)
      ? (r.referenceLinks as string[])
      : [],
    messages: messageRows
      .filter((m) => m.requestId === r.id)
      .map((m) => ({
        id: m.id,
        author: m.author as "customer" | "admin" | "system",
        authorName: m.authorName,
        body: m.body,
        attachments: Array.isArray(m.attachments) ? (m.attachments as string[]) : [],
        createdAt: m.createdAt.toISOString(),
      })),
    adminNotes: r.adminNotes,
    customerNotes: r.customerNotes,
    quotedAmount: r.quotedAmount ? Number(r.quotedAmount) : null,
    quoteExpiresAt: r.quoteExpiresAt?.toISOString() ?? null,
    paidAt: r.paidAt?.toISOString() ?? null,
    convertedOrderId: r.convertedOrderId,
    balanceDue: r.convertedOrderId ? (balanceByOrder.get(r.convertedOrderId) ?? 0) : 0,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    quotes: quoteRows
      .filter((q) => q.requestId === r.id)
      .map((q) => ({
        id: q.id,
        version: q.version,
        amount: Number(q.amount),
        depositAmount: q.depositAmount ? Number(q.depositAmount) : null,
        lines: quoteLines(q.breakdown),
        note: q.note,
        status: q.status,
        expiresAt: q.expiresAt?.toISOString() ?? null,
        createdBy: q.createdBy,
        createdAt: q.createdAt.toISOString(),
      })),
  }));
}
