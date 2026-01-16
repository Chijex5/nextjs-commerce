import { canonicalUrl } from "lib/seo";
import { buildSitemapXml } from "lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date().toISOString();

  const entries = [
    {
      loc: canonicalUrl("/"),
      lastmod: now,
    },
    {
      loc: canonicalUrl("/products"),
      lastmod: now,
    },
    {
      loc: canonicalUrl("/custom-orders"),
      lastmod: now,
    },
  ];

  return new Response(buildSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
