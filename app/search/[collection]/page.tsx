import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { defaultSort, sorting } from "lib/constants";
import {
  getCollection,
  getCollectionProducts,
  getCollections,
} from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import SearchControlsMenu from "../search-controls-menu";

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

  const collection = await getCollection(params.collection);
  if (!collection) return notFound();

  const selectedSort =
    sorting.find((item) => item.slug === sort) || defaultSort;
  const { sortKey, reverse } = selectedSort;

  const [products, collections] = await Promise.all([
    getCollectionProducts({
      collection: params.collection,
      sortKey,
      reverse,
    }),
    getCollections(),
  ]);

  return (
    <section className="space-y-8 md:space-y-10">
      <header className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800 md:pb-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-100 sm:text-4xl">
              {collection.title}
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {products.length} item{products.length === 1 ? "" : "s"} · Sort:{" "}
              {selectedSort.title}
            </p>
          </div>

          <SearchControlsMenu
            collections={collections}
            sorting={sorting}
            pathname={collection.path}
            activeSortSlug={selectedSort.slug ?? null}
            activeCollectionPath={collection.path}
          />
        </div>

        {collection.description ? (
          <p className="max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            {collection.description}
          </p>
        ) : null}
      </header>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 py-14 text-center text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          No products found in this collection.
        </div>
      ) : (
        <Grid className="grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ProductGridItems products={products} />
        </Grid>
      )}
    </section>
  );
}
