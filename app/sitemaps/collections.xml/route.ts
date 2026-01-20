import prisma from "lib/prisma";
import { canonicalUrl } from "lib/seo";
import { buildSitemapXml } from "lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const collections = await prisma.collection.findMany({
    select: {
      handle: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const entries = collections
    .filter(
      (collection) =>
        !collection.handle.startsWith("hidden-") && collection.handle !== "all",
    )
    .map((collection) => ({
      loc: canonicalUrl(`/search/${collection.handle}`),
      lastmod: collection.updatedAt.toISOString(),
    }));

  return new Response(buildSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
