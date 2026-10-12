import { asc, eq } from "drizzle-orm";
import { db } from "lib/db";
import { customOrderRequests, customRequestMessages } from "lib/db/schema";
import { buildRequestPageUrl } from "lib/custom-order-utils";
import { getAdminNotificationEmails } from "lib/email/admin-notification-emails";
import { sendCustomRequestMessage } from "lib/email/order-emails";
import { baseUrl } from "lib/utils";

type RequestRow = typeof customOrderRequests.$inferSelect;

export type ThreadMessage = {
  id: string;
  author: "customer" | "admin" | "system";
  authorName: string | null;
  body: string;
  attachments: string[];
  createdAt: string;
};

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_MESSAGE_PHOTOS = 4;

export async function listMessages(requestId: string): Promise<ThreadMessage[]> {
  const rows = await db
    .select()
    .from(customRequestMessages)
    .where(eq(customRequestMessages.requestId, requestId))
    .orderBy(asc(customRequestMessages.createdAt));
  return rows.map((m) => ({
    id: m.id,
    author: m.author as ThreadMessage["author"],
    authorName: m.authorName,
    body: m.body,
    attachments: Array.isArray(m.attachments) ? (m.attachments as string[]) : [],
    createdAt: m.createdAt.toISOString(),
  }));
}

/** A line in the thread recording something that happened ("We sent a price"). */
export async function addSystemMessage(requestId: string, body: string) {
  await db.insert(customRequestMessages).values({ requestId, author: "system", body });
}

/**
 * Adds a customer or shop message, moves the request along, and emails the
 * other side. `askQuestion` (shop only) marks the request as waiting on the
 * customer; a customer reply puts it back in the shop's queue.
 */
export async function postMessage({
  request,
  author,
  authorName,
  body,
  attachments,
  askQuestion = false,
}: {
  request: RequestRow;
  author: "customer" | "admin";
  authorName: string | null;
  body: string;
  attachments: string[];
  askQuestion?: boolean;
}) {
  const [message] = await db
    .insert(customRequestMessages)
    .values({ requestId: request.id, author, authorName, body, attachments })
    .returning();

  let status = request.status;
  if (author === "customer" && request.status === "needs_info") status = "under_review";
  if (
    author === "admin" &&
    askQuestion &&
    ["submitted", "under_review", "quoted"].includes(request.status)
  )
    status = "needs_info";
  if (author === "admin" && request.status === "submitted" && !askQuestion)
    status = "under_review";
  await db
    .update(customOrderRequests)
    .set({ status, updatedAt: new Date() })
    .where(eq(customOrderRequests.id, request.id));

  const common = {
    requestNumber: request.requestNumber,
    title: request.title,
    body,
    photoCount: attachments.length,
  };
  try {
    if (author === "admin") {
      await sendCustomRequestMessage({
        ...common,
        to: request.email,
        recipient: "customer",
        greetingName: request.customerName.split(" ")[0] || request.customerName,
        fromName: "D'FOOTPRINT",
        url: buildRequestPageUrl(request.requestNumber),
      });
    } else {
      const to = await getAdminNotificationEmails();
      if (to.length)
        await sendCustomRequestMessage({
          ...common,
          to,
          recipient: "admin",
          greetingName: "there",
          fromName: request.customerName,
          url: `${baseUrl}/admin/custom-order-requests/${request.id}`,
        });
    }
  } catch (error) {
    console.error("Failed to send custom request message email:", error);
  }

  return { message, status };
}
