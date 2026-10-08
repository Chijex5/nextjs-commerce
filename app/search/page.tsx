import { ShopView } from "components/shop/shop-view";
import { getShopCollections, getShopPage } from "lib/data/shop";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";

const description = "Search D'FOOTPRINT's handmade slides and slippers.";

export const metadata: Metadata = {
  title: "Search",
  description,
  alternates: { canonical: canonicalUrl("/search") },
  robots: { index: false, follow: true },
  openGraph: {
    title: `Search | ${siteName}`,
    description,
    url: canonicalUrl("/search"),
    type: "website",
    images: ["/opengraph-image"],
  },
};

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const q =
    typeof searchParams?.q === "string" ? searchParams.q.trim() : undefined;
  const sort =
    typeof searchParams?.sort === "string" ? searchParams.sort : null;
  const query = { q: q || undefined, sort };

  const [page, collections] = await Promise.all([
    getShopPage(query),
    getShopCollections(),
  ]);

  return (
    <ShopView
      eyebrow={q ? "(Search) — Results for" : "(Search)"}
      title={q ? <>&ldquo;{q}&rdquo;</> : "Search"}
      page={page}
      query={query}
      collections={collections}
      basePath="/search"
    />
  );
}
