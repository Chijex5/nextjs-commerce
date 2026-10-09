import { eq, sql } from "drizzle-orm";
import { db } from "lib/db";
import { newsletterSubscribers } from "lib/db/schema";
import { sendNewsletterWelcomeEmail } from "lib/email/newsletter-emails";
import { getFlowConfig, logFlowSend } from "./flows";

export const CONSENT_SOURCES = [
  "newsletter",
  "popup",
  "footer",
  "checkout",
  "account",
  "restock",
  "import",
] as const;
export type ConsentSource = (typeof CONSENT_SOURCES)[number];

/**
 * Record marketing consent and run the welcome flow for new subscribers.
 * Emails are stored lower-cased so the same person can't subscribe twice.
 */
export async function subscribeEmail({
  email,
  name,
  source,
}: {
  email: string;
  name?: string | null;
  source: ConsentSource;
}) {
  const normalized = email.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(newsletterSubscribers)
    .where(sql`lower(${newsletterSubscribers.email}) = ${normalized}`)
    .limit(1);

  if (existing?.status === "active")
    return { status: "already-subscribed" as const };

  if (existing) {
    await db
      .update(newsletterSubscribers)
      .set({
        status: "active",
        source,
        subscribedAt: new Date(),
        unsubscribedAt: null,
        name: name || existing.name,
      })
      .where(eq(newsletterSubscribers.id, existing.id));
  } else {
    await db
      .insert(newsletterSubscribers)
      .values({ email: normalized, name: name || null, source });
  }

  // Checkout opt-ins already get an order confirmation; a welcome email on top is noise.
  if (source !== "checkout" && (await getFlowConfig("welcome")).enabled) {
    const result = await sendNewsletterWelcomeEmail({
      email: normalized,
      name: name || "Friend",
    });
    if (result.success) {
      const id = (result as { data?: { data?: { id?: string } } }).data?.data
        ?.id;
      await logFlowSend(
        "welcome",
        normalized,
        `subscribe:${new Date().toISOString().slice(0, 10)}`,
        id,
      );
    } else console.error("Failed to send newsletter welcome email");
  }
  return { status: "subscribed" as const };
}
