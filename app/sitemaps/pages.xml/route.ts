import prisma from "lib/prisma";
import { canonicalUrl } from "lib/seo";
import { buildSitemapXml } from "lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const pages = await prisma.page.findMany({
    select: {
      handle: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const entries = pages.map((page) => ({
    loc: canonicalUrl(`/${page.handle}`),
    lastmod: page.updatedAt.toISOString(),
  }));

  return new Response(buildSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
