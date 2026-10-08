import { ShopView } from "components/shop/shop-view";
import {
  getShopCollection,
  getShopCollections,
  getShopPage,
} from "lib/data/shop";
import {
  canonicalUrl,
  hasContentAffectingSearchParams,
  siteName,
} from "lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const collection = await getShopCollection(params.collection);
  if (!collection) return notFound();

  const title = collection.seo?.title || collection.title;
  const description =
    collection.seo?.description ||
    collection.description ||
    `${collection.title} — handmade by D'FOOTPRINT in Lagos.`;
  const hidden =
    collection.handle.startsWith("hidden-") || collection.handle === "all";

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl(collection.path) },
    robots: {
      index:
        !hasContentAffectingSearchParams(searchParams, ["sort"]) && !hidden,
      follow: true,
    },
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: canonicalUrl(collection.path),
      type: "website",
      images: [`${collection.path}/opengraph-image`],
    },
  };
}

export default async function CollectionPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const sort =
    typeof searchParams?.sort === "string" ? searchParams.sort : null;

  const collection = await getShopCollection(params.collection);
  if (!collection) return notFound();

  const query = { sort, collection: collection.handle };
  const [page, collections] = await Promise.all([
    getShopPage(query),
    getShopCollections(),
  ]);

  return (
    <ShopView
      eyebrow="(Collection)"
      title={collection.title}
      intro={collection.description || undefined}
      page={page}
      query={query}
      collections={collections}
      basePath={collection.path}
    />
  );
}
