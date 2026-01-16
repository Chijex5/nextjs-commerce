import { canonicalUrl } from "lib/seo";
import { buildSitemapIndexXml } from "lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date().toISOString();

  const sitemapEntries = [
    {
      loc: canonicalUrl("/sitemaps/products.xml"),
      lastmod: now,
    },
    {
      loc: canonicalUrl("/sitemaps/collections.xml"),
      lastmod: now,
    },
    {
      loc: canonicalUrl("/sitemaps/pages.xml"),
      lastmod: now,
    },
    {
      loc: canonicalUrl("/sitemaps/static.xml"),
      lastmod: now,
    },
  ];

  return new Response(buildSitemapIndexXml(sitemapEntries), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
