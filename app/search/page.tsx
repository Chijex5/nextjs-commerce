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

  return (
    <section className="space-y-10">
      <header className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-100 sm:text-4xl">
            {hasQuery ? `“${searchValue}”` : "Search"}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {products.length} result{products.length === 1 ? "" : "s"} · Sorted
            by {selectedSortTitle}
          </p>
        </div>

        <form action="/search" className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="search-query" className="sr-only">
            Search products
          </label>
          <input
            id="search-query"
            name="q"
            defaultValue={searchValue}
            placeholder="Search products"
            className="w-full rounded-2xl border border-neutral-300 bg-transparent px-5 py-3 text-base text-neutral-950 outline-none transition focus:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100"
          />
          {sort ? <input type="hidden" name="sort" value={sort} /> : null}
          <button
            type="submit"
            className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Search
          </button>
        </form>
      </header>

      {products.length > 0 ? (
        <Grid className="grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      ) : (
        <div className="space-y-5 rounded-3xl border border-neutral-200 p-10 text-center dark:border-neutral-800">
          <p className="text-xl font-medium text-neutral-950 dark:text-neutral-100">
            No products found
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Try a different term or start with one of these suggestions.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestedSearches.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-700 transition hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600"
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
