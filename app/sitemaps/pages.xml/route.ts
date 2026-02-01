import { db } from "lib/db";
import { pages } from "lib/db/schema";
import { canonicalUrl } from "lib/seo";
import { buildSitemapXml } from "lib/sitemap";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const pageRows = await db
    .select({ handle: pages.handle, updatedAt: pages.updatedAt })
    .from(pages)
    .orderBy(desc(pages.updatedAt));

  const entries = pageRows.map((page) => ({
    loc: canonicalUrl(`/${page.handle}`),
    lastmod: page.updatedAt.toISOString(),
  }));

  return new Response(buildSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
