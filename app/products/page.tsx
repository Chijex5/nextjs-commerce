import { ShopView } from "components/shop/shop-view";
import { getShopCollections, getShopPage } from "lib/data/shop";
import {
  canonicalUrl,
  hasContentAffectingSearchParams,
  siteName,
} from "lib/seo";
import type { Metadata } from "next";

type SearchParams = { [key: string]: string | string[] | undefined };

const description =
  "Every D'FOOTPRINT design — handmade slides and slippers for men and women, delivered across Nigeria.";

export async function generateMetadata(props: {
  searchParams?: Promise<SearchParams>;
}): Promise<Metadata> {
  const searchParams = await props.searchParams;
  return {
    title: "Shop all designs",
    description,
    alternates: { canonical: canonicalUrl("/products") },
    robots: {
      index: !hasContentAffectingSearchParams(searchParams, ["sort"]),
      follow: true,
    },
    openGraph: {
      title: `Shop all designs | ${siteName}`,
      description,
      url: canonicalUrl("/products"),
      type: "website",
      images: ["/opengraph-image"],
    },
  };
}

export default async function AllProductsPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const sort =
    typeof searchParams?.sort === "string" ? searchParams.sort : null;
  const query = { sort };

  const [page, collections] = await Promise.all([
    getShopPage(query),
    getShopCollections(),
  ]);

  return (
    <ShopView
      eyebrow="(Shop) — Handmade in Lagos"
      title="All designs"
      page={page}
      query={query}
      collections={collections}
      basePath="/products"
    />
  );
}
