import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { defaultSort, sorting } from "lib/constants";
import { getProducts } from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";

const description =
  "Discover our full catalog of carefully selected products, curated for modern everyday living.";

export async function generateMetadata(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const hasSearchParams = searchParams && Object.keys(searchParams).length > 0;

  return {
    title: "All Products",
    description,
    alternates: {
      canonical: canonicalUrl("/products"),
    },
    robots: {
      index: !hasSearchParams,
      follow: true,
    },
    openGraph: {
      title: `All Products | ${siteName}`,
      description,
      url: canonicalUrl("/products"),
      type: "website",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: `All Products | ${siteName}`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function AllProductsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { sort } = searchParams as { [key: string]: string };
  const activeSort = sorting.find((item) => item.slug === sort) || defaultSort;
  const { sortKey, reverse } = activeSort;

  const products = await getProducts({ sortKey, reverse });

  return (
    <section className="space-y-10 pb-14 md:space-y-12 md:pb-20">
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-white via-neutral-50 to-neutral-100 px-6 py-10 shadow-sm md:px-10 md:py-14 dark:border-neutral-800 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
          Shop all
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-neutral-900 md:text-5xl dark:text-neutral-100">
          Designed to feel like a modern storefront, built to browse with ease.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600 md:text-base dark:text-neutral-300">
          Explore every product in one clean, curated grid with effortless
          sorting and generous spacing.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white/90 p-4 md:flex-row md:items-center md:justify-between md:p-5 dark:border-neutral-800 dark:bg-black/40">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {products.length}
            </span>{" "}
            products available
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {sorting.map((option) => {
              const href = option.slug
                ? `/products?sort=${option.slug}`
                : "/products";
              const isActive = option.slug === activeSort.slug;

              return (
                <Link
                  key={option.title}
                  href={href}
                  className={clsx(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-neutral-100",
                  )}
                >
                  {option.title}
                </Link>
              );
            })}
          </div>
        </div>

        {products.length > 0 ? (
          <Grid className="grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ProductGridItems products={products} />
          </Grid>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 py-14 text-center text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            No products available at the moment.
          </div>
        )}
      </div>
    </section>
  );
}
