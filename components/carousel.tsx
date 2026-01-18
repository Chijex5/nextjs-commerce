import { getCollectionProducts } from "lib/database";
import Link from "next/link";
import { GridTileImage } from "./grid/tile";

export async function Carousel() {
  // Collections that start with `hidden-*` are hidden from the search page.
  const products = await getCollectionProducts({
    collection: "hidden-homepage-carousel",
  });

  if (!products?.length) return null;

  // Purposefully duplicating products to make the carousel loop and not run out of products on wide screens.
  const carouselProducts = [...products, ...products, ...products];

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-white to-neutral-50/50 py-12 dark:from-black dark:to-neutral-900/50">
      {/* Section Header */}
      <div className="mb-8 text-center">
        <div className="mb-2 inline-block">
          <span className="rounded-full bg-neutral-900/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-700 dark:bg-neutral-100/10 dark:text-neutral-300">
            Featured Products
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
          Trending Now
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full overflow-x-auto pb-6 pt-1">
        {/* Gradient Overlays for smooth edges */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent dark:from-black" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent dark:from-black" />

        <ul className="flex animate-carousel gap-4 px-4">
          {carouselProducts.map((product, i) => {
            const minPrice = parseFloat(
              product.priceRange.minVariantPrice.amount,
            );
            const maxPrice = parseFloat(
              product.priceRange.maxVariantPrice.amount,
            );
            const hasVariedPricing = minPrice !== maxPrice;

            return (
              <li
                key={`${product.handle}${i}`}
                className="group relative aspect-[3/4] w-2/3 max-w-[475px] flex-none md:w-1/3"
              >
                <Link
                  href={`/product/${product.handle}`}
                  className="relative block h-full w-full"
                >
                  <div className="h-full overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-neutral-200/50 transition-all duration-300 group-hover:shadow-xl group-hover:ring-neutral-300 dark:bg-neutral-900 dark:ring-neutral-800/50 dark:group-hover:ring-neutral-700">
                    <GridTileImage
                      alt={product.title}
                      label={{
                        title: product.title,
                        amount: product.priceRange.maxVariantPrice.amount,
                        currencyCode:
                          product.priceRange.maxVariantPrice.currencyCode,
                        minAmount: hasVariedPricing
                          ? product.priceRange.minVariantPrice.amount
                          : undefined,
                      }}
                      src={product.featuredImage?.url}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
