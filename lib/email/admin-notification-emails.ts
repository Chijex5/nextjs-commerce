import { eq } from "drizzle-orm";
import { db } from "lib/db";
import { adminUsers } from "lib/db/schema";

export async function getAdminNotificationEmails() {
  const adminRows = await db
    .select({ email: adminUsers.email })
    .from(adminUsers)
    .where(eq(adminUsers.isActive, true));

  const envAdmins = process.env.ADMIN_NOTIFICATION_EMAILS;
  const envEmail = process.env.ADMIN_EMAIL;
  const envEmails = [
    envEmail,
    ...(envAdmins
      ? envAdmins
          .split(",")
          .map((email) => email.trim())
          .filter(Boolean)
      : []),
  ].filter(Boolean) as string[];

  return Array.from(
    new Set([...adminRows.map((admin) => admin.email), ...envEmails]),
  ).filter((email): email is string => Boolean(email));
}
