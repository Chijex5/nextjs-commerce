import { db } from "@/lib/db";
import {
  campaignEmailLogs,
  campaignProducts,
  emailCampaigns,
  newsletterSubscribers,
  productImages,
  productVariants,
  products,
} from "@/lib/db/schema";
import crypto from "crypto";
import { asc, eq, inArray } from "drizzle-orm";

export type CampaignType = "JUST_ARRIVED" | "SALE" | "COLLECTION";

const CAMPAIGN_TYPES = ["JUST_ARRIVED", "SALE", "COLLECTION"] as const;

function toCampaignType(type: string): CampaignType {
  return CAMPAIGN_TYPES.includes(type as CampaignType)
    ? (type as CampaignType)
    : "COLLECTION";
}
export type CampaignStatus = "DRAFT" | "SCHEDULED" | "SENDING" | "SENT";
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
  discountPercentage?: number | null;
  couponCode?: string | null;
  saleDeadline?: Date | null;
  discountNote?: string | null;
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
    const [productRows, imageRows, variantRows] = await Promise.all([
      db.select().from(products).where(inArray(products.id, productIds)),
      db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
        .orderBy(asc(productImages.position)),
      db
        .select({
          productId: productVariants.productId,
          price: productVariants.price,
          currencyCode: productVariants.currencyCode,
        })
        .from(productVariants)
        .where(inArray(productVariants.productId, productIds)),
    ]);

    const productById = new Map(
      productRows.map((product) => [product.id, product]),
    );
    const imageRowsByProductId = new Map<string, typeof imageRows>();
    const variantRowsByProductId = new Map<string, typeof variantRows>();

    for (const variant of variantRows) {
      const current = variantRowsByProductId.get(variant.productId) ?? [];
      current.push(variant);
      variantRowsByProductId.set(variant.productId, current);
    }

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

      const variants = variantRowsByProductId.get(prod.id) ?? [];
      const cheapestVariant = variants
        .filter((variant) => variant.price)
        .sort((a, b) => Number(a.price) - Number(b.price))[0];

      campaignProductDetails.push({
        id: prod.id,
        handle: prod.handle,
        title: prod.title,
        description: prod.description || undefined,
        image: featuredImage?.url,
        price: cheapestVariant
          ? `${cheapestVariant.currencyCode || "NGN"} ${Number(cheapestVariant.price).toLocaleString()}`
          : undefined,
      });
    }
  }

  return {
    ...campaign,
    type: toCampaignType(campaign.type),
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
 * Generate unsubscribe URL with HMAC token
 */
export function getUnsubscribeUrl(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error("UNSUBSCRIBE_SECRET is not set");
  }

  // Create HMAC token
  const token = crypto.createHmac("sha256", secret).update(email).digest("hex");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
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
