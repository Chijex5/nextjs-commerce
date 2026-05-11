import { db } from "@/lib/db";
import {
  campaignEmailLogs,
  campaignProducts,
  emailCampaigns,
  newsletterSubscribers,
  productImages,
  products,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/resend";
import { baseTemplate } from "@/lib/email/templates/base";
import { render } from "@react-email/render";
import { and, asc, eq, inArray } from "drizzle-orm";

export type CampaignType = "JUST_ARRIVED" | "SALE" | "COLLECTION";
export type CampaignStatus = "DRAFT" | "SCHEDULED" | "SENT";
export type EmailLogStatus =
  | "SENT"
  | "OPENED"
  | "CLICKED"
  | "BOUNCED"
  | "FAILED";

interface CampaignProduct {
  id: string;
  handle: string;
  title: string;
  description?: string;
  price?: string;
  image?: string;
}

interface CampaignData {
  id: string;
  name: string;
  type: CampaignType;
  subject: string;
  preheader?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  footerText?: string;
  ctaButtonText?: string;
  ctaButtonUrl?: string;
  products: CampaignProduct[];
}

/**
 * Get campaign details with products
 */
export async function getCampaignWithProducts(campaignId: string) {
  const campaign = await db.query.emailCampaigns.findFirst({
    where: eq(emailCampaigns.id, campaignId),
  });

  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  // Get products in this campaign
  const campaignProds = await db
    .select({
      productId: campaignProducts.productId,
      position: campaignProducts.position,
    })
    .from(campaignProducts)
    .where(eq(campaignProducts.campaignId, campaignId))
    .orderBy(campaignProducts.position);

  const productIds = campaignProds.map((cp) => cp.productId);
  const campaignProductDetails: CampaignProduct[] = [];

  if (productIds.length > 0) {
    const [productRows, imageRows] = await Promise.all([
      db.select().from(products).where(inArray(products.id, productIds)),
      db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
        .orderBy(asc(productImages.position)),
    ]);

    const productById = new Map(
      productRows.map((product) => [product.id, product]),
    );
    const imageRowsByProductId = new Map<string, typeof imageRows>();

    for (const image of imageRows) {
      const current = imageRowsByProductId.get(image.productId) ?? [];
      current.push(image);
      imageRowsByProductId.set(image.productId, current);
    }

    for (const cp of campaignProds) {
      const prod = productById.get(cp.productId);
      if (!prod) continue;

      const images = imageRowsByProductId.get(prod.id) ?? [];
      const featuredImage =
        images.find((image) => image.isFeatured) || images[0];

      campaignProductDetails.push({
        id: prod.id,
        handle: prod.handle,
        title: prod.title,
        description: prod.description || undefined,
        image: featuredImage?.url,
      });
    }
  }

  return {
    ...campaign,
    products: campaignProductDetails,
  };
}

/**
 * Get all active newsletter subscribers
 */
export async function getActiveSubscribers() {
  return await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, "active"));
}

/**
 * Send campaign to all active subscribers
 */
export async function sendMarketingCampaign(
  campaignId: string,
  emailTemplate: (props: any) => React.ReactElement,
) {
  const campaign = await getCampaignWithProducts(campaignId);
  const subscribers = await getActiveSubscribers();

  if (subscribers.length === 0) {
    console.warn(`No active subscribers for campaign: ${campaignId}`);
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    try {
      // Render email template
      const renderedEmailHtml = await render(
        emailTemplate({
          campaign,
          subscriber,
        }),
      );

      const unsubscribeUrl = getUnsubscribeUrl(subscriber.email);
      const emailHtml = baseTemplate(renderedEmailHtml, unsubscribeUrl);

      // Send email via Resend
      const result = await sendEmail({
        to: subscriber.email,
        subject: campaign.subject,
        html: emailHtml,
        preheader: campaign?.preheader || "",
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Log the send
      await db.insert(campaignEmailLogs).values({
        campaignId,
        subscriberEmail: subscriber.email,
        status: "SENT",
        resendMessageId: result.data?.data?.id,
      });

      sent++;
    } catch (error) {
      console.error(
        `Failed to send campaign ${campaignId} to ${subscriber.email}:`,
        error,
      );

      // Log the failure
      await db.insert(campaignEmailLogs).values({
        campaignId,
        subscriberEmail: subscriber.email,
        status: "FAILED",
        bounceReason: error instanceof Error ? error.message : "Unknown error",
      });

      failed++;
    }
  }

  // Update campaign status to SENT
  await db
    .update(emailCampaigns)
    .set({
      status: "SENT",
      sentAt: new Date(),
    })
    .where(eq(emailCampaigns.id, campaignId));

  return { sent, failed };
}

/**
 * Generate unsubscribe URL with HMAC token
 */
function getUnsubscribeUrl(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error("UNSUBSCRIBE_SECRET is not set");
  }

  // Create HMAC token
  const crypto = require("crypto");
  const token = crypto.createHmac("sha256", secret).update(email).digest("hex");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

/**
 * Update email log status when webhook event is received (OPEN, CLICK, BOUNCE)
 */
export async function updateEmailLogStatus(
  resendMessageId: string,
  status: EmailLogStatus,
  extraData?: { clickCount?: number; bounceReason?: string },
) {
  const log = await db.query.campaignEmailLogs.findFirst({
    where: eq(campaignEmailLogs.resendMessageId, resendMessageId),
  });

  if (!log) {
    console.warn(`Email log not found for Resend message: ${resendMessageId}`);
    return;
  }

  const updates: any = { status, updatedAt: new Date() };

  if (status === "OPENED" && !log.openedAt) {
    updates.openedAt = new Date();
  }

  if (status === "CLICKED") {
    updates.clickedAt = new Date();
    updates.clickCount = (log.clickCount || 0) + 1;
  }

  if (status === "BOUNCED") {
    updates.bounceReason = extraData?.bounceReason || "Unknown";
  }

  await db
    .update(campaignEmailLogs)
    .set(updates)
    .where(eq(campaignEmailLogs.resendMessageId, resendMessageId));
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(campaignId: string) {
  const logs = await db
    .select()
    .from(campaignEmailLogs)
    .where(eq(campaignEmailLogs.campaignId, campaignId));

  const total = logs.length;
  const sent = logs.filter((l) => l.status !== "FAILED").length;
  const opened = logs.filter((l) => l.openedAt).length;
  const clicked = logs.filter((l) => l.clickCount && l.clickCount > 0).length;
  const bounced = logs.filter((l) => l.status === "BOUNCED").length;
  const failed = logs.filter((l) => l.status === "FAILED").length;

  return {
    total,
    sent,
    opened,
    clicked,
    bounced,
    failed,
    openRate: sent > 0 ? ((opened / sent) * 100).toFixed(2) : "0.00",
    clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(2) : "0.00",
    bounceRate: sent > 0 ? ((bounced / sent) * 100).toFixed(2) : "0.00",
    failureRate: total > 0 ? ((failed / total) * 100).toFixed(2) : "0.00",
  };
}

/**
 * Auto-unsubscribe bounced emails
 */
export async function unsubscribeBounced(campaignId: string) {
  const bouncedLogs = await db
    .select()
    .from(campaignEmailLogs)
    .where(
      and(
        eq(campaignEmailLogs.campaignId, campaignId),
        eq(campaignEmailLogs.status, "BOUNCED"),
      ),
    );

  for (const log of bouncedLogs) {
    await db
      .update(newsletterSubscribers)
      .set({
        status: "unsubscribed",
        unsubscribedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.email, log.subscriberEmail));
  }
}
