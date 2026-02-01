import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { db } from "lib/db";
import { products } from "lib/db/schema";
import { canonicalUrl } from "lib/seo";
import { buildSitemapXml } from "lib/sitemap";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const productRows = await db
    .select({ handle: products.handle, updatedAt: products.updatedAt, tags: products.tags })
    .from(products)
    .orderBy(desc(products.updatedAt));

  const entries = productRows
    .filter((product) => !(product.tags ?? []).includes(HIDDEN_PRODUCT_TAG))
    .map((product) => ({
      loc: canonicalUrl(`/product/${product.handle}`),
      lastmod: product.updatedAt.toISOString(),
    }));

  return new Response(buildSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
