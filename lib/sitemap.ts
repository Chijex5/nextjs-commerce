type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const renderLastMod = (lastmod?: string) =>
  lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : "";

export const buildSitemapXml = (entries: SitemapEntry[]) => {
  const urls = entries
    .map(
      (entry) =>
        `<url><loc>${escapeXml(entry.loc)}</loc>${renderLastMod(
          entry.lastmod,
        )}</url>`,
    )
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
  );
};

export const buildSitemapIndexXml = (entries: SitemapEntry[]) => {
  const sitemaps = entries
    .map(
      (entry) =>
        `<sitemap><loc>${escapeXml(entry.loc)}</loc>${renderLastMod(
          entry.lastmod,
        )}</sitemap>`,
    )
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps}</sitemapindex>`
  );
};
