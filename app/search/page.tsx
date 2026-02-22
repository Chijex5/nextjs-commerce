import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { defaultSort, sorting } from "lib/constants";
import { getProducts, getProductsCount } from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

const description = "Search for products in the store.";
const PRODUCTS_PER_PAGE = 12;

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

function buildSearchUrl({
  q,
  sort,
  page,
}: {
  q?: string;
  sort?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();

  return query ? `/search?${query}` : "/search";
}

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const {
    sort,
    q: rawSearchValue,
    page: rawPage,
  } = searchParams as {
    [key: string]: string;
  };
  const searchValue = rawSearchValue?.trim();
  const hasQuery = Boolean(searchValue);
  const page = Math.max(1, Number.parseInt(rawPage || "1", 10) || 1);
  const {
    sortKey,
    reverse,
    title: selectedSortTitle,
  } = sorting.find((item) => item.slug === sort) || defaultSort;

  const totalResults = await getProductsCount(searchValue);
  const totalPages = Math.max(1, Math.ceil(totalResults / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const products = await getProducts({
    sortKey,
    reverse,
    query: searchValue,
    limit: PRODUCTS_PER_PAGE,
    offset,
  });

  return (
    <section className="space-y-10">
      <header className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-100 sm:text-4xl">
            {hasQuery ? `“${searchValue}”` : "Search"}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {totalResults} result{totalResults === 1 ? "" : "s"} · Sorted by{" "}
            {selectedSortTitle}
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
        <>
          <Grid className="grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            <ProductGridItems products={products} />
          </Grid>

          {totalPages > 1 ? (
            <nav className="flex items-center justify-between border-t border-neutral-200 pt-6 dark:border-neutral-800">
              <Link
                href={buildSearchUrl({
                  q: searchValue,
                  sort,
                  page: currentPage > 1 ? currentPage - 1 : 1,
                })}
                className={`rounded-xl border px-4 py-2 text-sm transition ${
                  currentPage === 1
                    ? "pointer-events-none border-neutral-200 text-neutral-400 dark:border-neutral-800 dark:text-neutral-600"
                    : "border-neutral-300 text-neutral-700 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-300"
                }`}
              >
                Previous
              </Link>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Page {currentPage} of {totalPages}
              </p>
              <Link
                href={buildSearchUrl({
                  q: searchValue,
                  sort,
                  page: currentPage < totalPages ? currentPage + 1 : totalPages,
                })}
                className={`rounded-xl border px-4 py-2 text-sm transition ${
                  currentPage === totalPages
                    ? "pointer-events-none border-neutral-200 text-neutral-400 dark:border-neutral-800 dark:text-neutral-600"
                    : "border-neutral-300 text-neutral-700 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-300"
                }`}
              >
                Next
              </Link>
            </nav>
          ) : null}
        </>
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
