import Footer from "components/layout/footer";
import Price from "components/price";
import { db } from "lib/db";
import { customOrders } from "lib/db/schema";
import { getCollectionsWithProducts, getProducts } from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import { asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const description =
  "D'FOOTPRINT - Handcrafted footwear including slippers and slides. Premium handmade designs with custom order options. Nationwide delivery across Nigeria.";

export const metadata: Metadata = {
  description,
  alternates: {
    canonical: canonicalUrl("/"),
  },
  openGraph: {
    title: siteName,
    description,
    url: canonicalUrl("/"),
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    images: ["/opengraph-image"],
  },
};

export default async function HomePage() {
  const [
    latestProducts,
    trendingProducts,
    collectionsWithProducts,
    customOrderRows,
  ] = await Promise.all([
    getProducts({ sortKey: "CREATED_AT", reverse: true }),
    getProducts({ sortKey: "BEST_SELLING", reverse: false }),
    getCollectionsWithProducts(),
    db
      .select()
      .from(customOrders)
      .where(eq(customOrders.isPublished, true))
      .orderBy(asc(customOrders.position), desc(customOrders.updatedAt))
      .limit(3),
  ]);

  const featuredProducts = latestProducts.slice(0, 10);
  const bestSellers = trendingProducts.slice(0, 4);
  const visibleCollections = collectionsWithProducts
    .filter((item) => item.products.length > 0)
    .slice(0, 6);

  return (
    <>
      <div className="mx-auto w-full max-w-[1800px] space-y-14 px-4 pb-16 pt-8 md:space-y-20 md:px-6 md:pt-12 lg:px-8">
        <section className="space-y-8 border-b border-neutral-200 pb-10 dark:border-neutral-800 md:pb-12">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                D&apos;FOOTPRINT
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-neutral-900 md:text-5xl lg:text-6xl dark:text-neutral-100">
                Handcrafted footwear made for everyday wear.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-neutral-600 md:text-base dark:text-neutral-300">
                Explore new arrivals, best sellers, and custom creations in one
                clean storefront built for easy browsing.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/products"
                  className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                >
                  Shop all products
                </Link>
                <Link
                  href="/custom-orders"
                  className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
                >
                  Custom orders
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
                  Products
                </p>
                <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {latestProducts.length}
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
                  Collections
                </p>
                <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {visibleCollections.length}
                </p>
              </div>
              <div className="col-span-2 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
                  Fresh this week
                </p>
                <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                  New products are added regularly with nationwide delivery.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold text-neutral-900 md:text-3xl dark:text-neutral-100">
              New arrivals
            </h2>
            <Link
              href="/products?sort=latest-desc"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4 xl:grid-cols-5">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.handle}`}
                className="group block"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
                  {product.featuredImage?.url ? (
                    <Image
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText || product.title}
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <div className="mt-3 space-y-1 px-1">
                  <h3 className="line-clamp-2 text-sm font-medium text-neutral-900 md:text-base dark:text-neutral-100">
                    {product.title}
                  </h3>
                  <Price
                    amount={product.priceRange.maxVariantPrice.amount}
                    currencyCode={
                      product.priceRange.maxVariantPrice.currencyCode
                    }
                    currencyCodeClassName="hidden"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold text-neutral-900 md:text-3xl dark:text-neutral-100">
              Shop by collection
            </h2>
            <Link
              href="/products"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              Browse all products
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleCollections.map(({ collection, products }) => (
              <Link
                key={collection.handle}
                href={collection.path}
                className="rounded-2xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
              >
                <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
                  {products.length} items
                </p>
                <h3 className="mt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {collection.title}
                </h3>
                {collection.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-300">
                    {collection.description}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>

        {bestSellers.length > 0 ? (
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-neutral-900 md:text-3xl dark:text-neutral-100">
              Best sellers
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {bestSellers.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.handle}`}
                  className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
                >
                  <div className="relative h-20 w-20 flex-none overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
                    {product.featuredImage?.url ? (
                      <Image
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText || product.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {product.title}
                    </p>
                    <Price
                      amount={product.priceRange.maxVariantPrice.amount}
                      currencyCode={
                        product.priceRange.maxVariantPrice.currencyCode
                      }
                      currencyCodeClassName="hidden"
                      className="mt-1 text-sm text-neutral-600 dark:text-neutral-300"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {customOrderRows.length > 0 ? (
          <section className="space-y-6 border-t border-neutral-200 pt-10 dark:border-neutral-800 md:pt-12">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-2xl font-semibold text-neutral-900 md:text-3xl dark:text-neutral-100">
                Custom work
              </h2>
              <Link
                href="/custom-orders"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
              >
                See all custom orders
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {customOrderRows.map((order) => (
                <Link
                  key={order.id}
                  href={`/custom-orders#order-${order.id}`}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
                      {order.beforeImage ? (
                        <Image
                          src={order.beforeImage}
                          alt={`${order.title} inspiration`}
                          fill
                          sizes="(min-width: 768px) 20vw, 40vw"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
                      {order.afterImage ? (
                        <Image
                          src={order.afterImage}
                          alt={`${order.title} final creation`}
                          fill
                          sizes="(min-width: 768px) 20vw, 40vw"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {order.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <Footer />
    </>
  );
}
