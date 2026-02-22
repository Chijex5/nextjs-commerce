import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { defaultSort, sorting } from "lib/constants";
import { getProducts } from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

const description = "Search for products in the store.";

const suggestedSearches = [
  "new arrivals",
  "best sellers",
  "shirts",
  "jackets",
  "accessories",
  "summer",
];

export const metadata: Metadata = {
  title: "Search",
  description,
  alternates: {
    canonical: canonicalUrl("/search"),
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: `Search | ${siteName}`,
    description,
    url: canonicalUrl("/search"),
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `Search | ${siteName}`,
    description,
    images: ["/opengraph-image"],
  },
};

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { sort, q: rawSearchValue } = searchParams as {
    [key: string]: string;
  };
  const searchValue = rawSearchValue?.trim();
  const hasQuery = Boolean(searchValue);
  const {
    sortKey,
    reverse,
    title: selectedSortTitle,
  } = sorting.find((item) => item.slug === sort) || defaultSort;

  const products = await getProducts({ sortKey, reverse, query: searchValue });
  const resultsText = products.length === 1 ? "result" : "results";

  return (
    <section className="space-y-6 pb-10">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 shadow-sm dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
        <div className="border-b border-neutral-200 px-6 py-6 dark:border-neutral-800 sm:px-8">
          <p className="text-xs font-semibold tracking-[0.18em] text-neutral-500 uppercase dark:text-neutral-400">
            Search Experience
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
            {hasQuery
              ? `Results for “${searchValue}”`
              : "Find your next favorite"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400 sm:text-base">
            {hasQuery
              ? "A cleaner view of your query with better context and quick actions to keep exploring."
              : "Start with a keyword and we’ll instantly surface matching products with smart sorting."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-3 sm:px-8">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              Total
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {products.length}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              matching {resultsText}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              Active sort
            </p>
            <p className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {selectedSortTitle}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              update from the right sidebar
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              Suggested searches
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestedSearches.slice(0, 3).map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {products.length > 0 ? (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900/40">
          <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            No products found
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-600 dark:text-neutral-400">
            Try another keyword or browse one of these curated suggestions.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {suggestedSearches.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
