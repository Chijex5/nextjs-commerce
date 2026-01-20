import { getCollection, getCollectionProducts } from "lib/database";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { defaultSort, sorting } from "lib/constants";
import { canonicalUrl, siteName } from "lib/seo";

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const collection = await getCollection(params.collection);

  if (!collection) return notFound();

  const hasSearchParams = searchParams && Object.keys(searchParams).length > 0;
  const title = collection.seo?.title || collection.title;
  const description =
    collection.seo?.description ||
    collection.description ||
    `${collection.title} products`;
  const isHiddenCollection =
    collection.handle.startsWith("hidden-") || collection.handle === "all";

  const ogImagePath = `${collection.path}/opengraph-image`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(collection.path),
    },
    robots: {
      index: !hasSearchParams && !isHiddenCollection,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl(collection.path),
      type: "website",
      images: [ogImagePath],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: [ogImagePath],
    },
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { sort } = searchParams as { [key: string]: string };
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;
  const products = await getCollectionProducts({
    collection: params.collection,
    sortKey,
    reverse,
  });

  return (
    <section>
      {products.length === 0 ? (
        <p className="py-3 text-lg">{`No products found in this collection`}</p>
      ) : (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      )}
    </section>
  );
}
