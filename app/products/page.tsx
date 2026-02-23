import Price from "components/price";
import { defaultSort, sorting } from "lib/constants";
import { getProducts } from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ProductsFilterMenu from "./products-filter-menu";

const description = "Browse all products in our store.";

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
    <section className="space-y-6 pb-14 md:space-y-8 md:pb-20">
      <header className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl dark:text-neutral-100">
              Shop
            </h1>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {products.length} products
            </p>
          </div>
          <ProductsFilterMenu
            sorting={sorting}
            activeSortSlug={activeSort.slug ?? null}
          />
        </div>
      </header>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {products.map((product) => {
            const minPrice = parseFloat(
              product.priceRange.minVariantPrice.amount,
            );
            const maxPrice = parseFloat(
              product.priceRange.maxVariantPrice.amount,
            );
            const hasPriceRange = minPrice !== maxPrice;

            return (
              <Link
                key={product.id}
                href={`/product/${product.handle}`}
                prefetch={true}
                className="group block"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
                  {product.featuredImage?.url ? (
                    <Image
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText || product.title}
                      fill
                      sizes="(min-width: 1536px) 16vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>

                <div className="mt-3 space-y-1 px-1">
                  <h2 className="line-clamp-2 text-sm font-medium text-neutral-900 md:text-base dark:text-neutral-100">
                    {product.title}
                  </h2>
                  <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {hasPriceRange ? (
                      <p>
                        <Price
                          amount={product.priceRange.minVariantPrice.amount}
                          currencyCode={
                            product.priceRange.minVariantPrice.currencyCode
                          }
                          currencyCodeClassName="hidden"
                          className="inline"
                        />
                        <span className="mx-1">-</span>
                        <Price
                          amount={product.priceRange.maxVariantPrice.amount}
                          currencyCode={
                            product.priceRange.maxVariantPrice.currencyCode
                          }
                          currencyCodeClassName="hidden"
                          className="inline"
                        />
                      </p>
                    ) : (
                      <Price
                        amount={product.priceRange.maxVariantPrice.amount}
                        currencyCode={
                          product.priceRange.maxVariantPrice.currencyCode
                        }
                        currencyCodeClassName="hidden"
                        className="inline"
                      />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-300 py-14 text-center text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          No products available at the moment.
        </div>
      )}
    </section>
  );
}
