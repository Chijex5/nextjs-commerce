import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import prisma from "lib/prisma";
import { canonicalUrl } from "lib/seo";
import { buildSitemapXml } from "lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await prisma.product.findMany({
    select: {
      handle: true,
      updatedAt: true,
      tags: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const entries = products
    .filter((product) => !product.tags.includes(HIDDEN_PRODUCT_TAG))
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
