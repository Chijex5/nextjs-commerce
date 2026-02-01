import { db } from "lib/db";
import { collections } from "lib/db/schema";
import { canonicalUrl } from "lib/seo";
import { buildSitemapXml } from "lib/sitemap";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const collectionRows = await db
    .select({ handle: collections.handle, updatedAt: collections.updatedAt })
    .from(collections)
    .orderBy(desc(collections.updatedAt));

  const entries = collectionRows
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
