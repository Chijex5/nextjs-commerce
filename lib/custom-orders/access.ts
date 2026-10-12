import { eq } from "drizzle-orm";
import { db } from "lib/db";
import { customOrderRequests } from "lib/db/schema";
import { isValidRequestAccessToken } from "lib/custom-order-utils";
import { getUserSession } from "lib/user-session";

/**
 * Loads a request for the customer: allowed with the access key from their
 * emails, or when signed in to the account that owns it. Null otherwise
 * (callers answer 404 so request numbers can't be probed).
 */
export async function getRequestForCustomer(
  requestNumber: string,
  token: string | null | undefined,
) {
  const [row] = await db
    .select()
    .from(customOrderRequests)
    .where(eq(customOrderRequests.requestNumber, requestNumber))
    .limit(1);
  if (!row) return null;
  if (isValidRequestAccessToken(row.requestNumber, token)) return row;
  const session = await getUserSession();
  if (session?.id && row.userId === session.id) return row;
  return null;
}
