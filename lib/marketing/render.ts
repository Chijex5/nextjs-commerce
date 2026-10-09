/** Server-side campaign rendering: block designs, with the legacy templates as fallback. */
import { inArray, sql } from "drizzle-orm";
import { db } from "lib/db";
import { productImages, products, productVariants } from "lib/db/schema";
import {
  parseBlocks,
  personaliseSubject,
  productIdsIn,
  renderBlocksEmail,
  type EmailProduct,
} from "lib/email/blocks";
import {
  renderMarketingCampaignEmail,
  renderMarketingSubject,
} from "lib/email/marketing-renderer";
import {
  renderVariables,
  type MarketingCampaign,
} from "lib/email/templates/marketing-campaign-base";

export async function loadEmailProducts(
  ids: string[],
): Promise<Map<string, EmailProduct>> {
  if (!ids.length) return new Map();
  const [rows, images, prices] = await Promise.all([
    db
      .select({
        id: products.id,
        title: products.title,
        handle: products.handle,
      })
      .from(products)
      .where(inArray(products.id, ids)),
    db
      .selectDistinctOn([productImages.productId], {
        productId: productImages.productId,
        url: productImages.url,
      })
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(
        productImages.productId,
        sql`${productImages.isFeatured} desc`,
        productImages.position,
      ),
    db
      .select({
        productId: productVariants.productId,
        min: sql<string>`min(${productVariants.price})`,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, ids))
      .groupBy(productVariants.productId),
  ]);
  const img = new Map(images.map((i) => [i.productId, i.url]));
  const price = new Map(prices.map((p) => [p.productId, Number(p.min)]));
  return new Map(
    rows.map((r) => [
      r.id,
      { ...r, image: img.get(r.id) ?? null, price: price.get(r.id) ?? null },
    ]),
  );
}

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "https://www.dfootprint.me";

/**
 * Returns a renderer for one campaign. Product data is loaded once, then each
 * recipient's email is rendered synchronously (important inside send batches).
 */
export async function prepareCampaignRenderer(
  campaign: MarketingCampaign & { content?: unknown },
) {
  const blocks = parseBlocks(campaign.content);
  if (blocks) {
    const productMap = await loadEmailProducts(productIdsIn(blocks));
    return {
      subject: (name?: string | null) =>
        personaliseSubject(campaign.subject, name),
      preheader: (name?: string | null) =>
        personaliseSubject(campaign.preheader || "", name),
      html: (name: string | null | undefined, unsubscribeUrl: string) =>
        renderBlocksEmail(
          blocks,
          { products: productMap, firstName: name, siteUrl: siteUrl() },
          unsubscribeUrl || undefined,
        ),
    };
  }
  return {
    subject: (name?: string | null) =>
      renderMarketingSubject(campaign, { name }),
    preheader: (name?: string | null) =>
      renderVariables(campaign.preheader || "", {
        campaign,
        subscriber: { name },
        siteUrl: siteUrl(),
      }),
    html: (name: string | null | undefined, unsubscribeUrl: string) =>
      renderMarketingCampaignEmail(campaign, { name }, unsubscribeUrl),
  };
}
