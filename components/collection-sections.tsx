import { getCollectionsWithProducts } from "lib/database";
import Link from "next/link";
import { GridTileImage } from "./grid/tile";

export async function CollectionSections() {
  const collectionsWithProducts = await getCollectionsWithProducts();

  if (!collectionsWithProducts.length) return null;

  return (
    <div className="w-full">
      {collectionsWithProducts.map((item, collectionIndex) => {
        const { collection, products } = item;

        // Skip collections with no products
        if (!products.length) return null;

        // Alternate background colors for visual interest
        const bgColors = [
          "bg-gradient-to-br from-blue-50/40 via-white to-purple-50/40 dark:from-blue-950/30 dark:via-black dark:to-purple-950/30",
          "bg-gradient-to-br from-amber-50/40 via-white to-orange-50/40 dark:from-amber-950/30 dark:via-black dark:to-orange-950/30",
          "bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/40 dark:from-emerald-950/30 dark:via-black dark:to-teal-950/30",
          "bg-gradient-to-br from-pink-50/40 via-white to-rose-50/40 dark:from-pink-950/30 dark:via-black dark:to-rose-950/30",
        ];
        const bgColor = bgColors[collectionIndex % bgColors.length];

        return (
          <section
            key={collection.handle}
            className={`relative overflow-hidden border-t border-neutral-200 py-16 dark:border-neutral-700 ${bgColor}`}
          >
            {/* Decorative background elements */}
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <div className="absolute -left-4 top-10 h-72 w-72 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl" />
              <div className="absolute -right-4 bottom-10 h-72 w-72 rounded-full bg-gradient-to-br from-orange-400/20 to-pink-400/20 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Collection Header with enhanced styling */}
              <div className="mb-12 text-center">
                <div className="mb-2 inline-block">
                  <span className="rounded-full bg-neutral-900/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-700 dark:bg-neutral-100/10 dark:text-neutral-300">
                    Collection
                  </span>
                </div>
                <h2 className="mb-4 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-100 sm:text-5xl">
                  {collection.title}
                </h2>
                {collection.description && (
                  <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {collection.description}
                  </p>
                )}
                <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
              </div>

              {/* Products Grid with enhanced cards */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product, productIndex) => {
                  const minPrice = parseFloat(
                    product.priceRange.minVariantPrice.amount,
                  );
                  const maxPrice = parseFloat(
                    product.priceRange.maxVariantPrice.amount,
                  );
                  const hasVariedPricing = minPrice !== maxPrice;

                  return (
                    <div
                      key={product.handle}
                      className="group relative opacity-0 transition-all duration-500 hover:z-10"
                      style={{
                        animation: `fadeIn 500ms ease-out ${productIndex * 75}ms forwards`,
                      }}
                    >
                      <Link
                        href={`/product/${product.handle}`}
                        className="block"
                      >
                        {/* Product card with shadow and hover effects */}
                        <div className="relative overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-neutral-200/50 transition-all duration-300 group-hover:shadow-2xl group-hover:ring-neutral-300 dark:bg-neutral-900 dark:ring-neutral-800/50 dark:group-hover:ring-neutral-700">
                          <div className="relative aspect-square overflow-hidden">
                            <GridTileImage
                              alt={product.title}
                              label={{
                                title: product.title,
                                amount:
                                  product.priceRange.maxVariantPrice.amount,
                                currencyCode:
                                  product.priceRange.maxVariantPrice
                                    .currencyCode,
                                minAmount: hasVariedPricing
                                  ? product.priceRange.minVariantPrice.amount
                                  : undefined,
                              }}
                              src={product.featuredImage?.url}
                              fill
                              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                            />
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* View All Link with enhanced button */}
              <div className="mt-12 text-center">
                <Link
                  href={collection.path}
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-neutral-900 to-neutral-800 px-8 py-4 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl dark:from-neutral-100 dark:to-neutral-200 dark:text-black"
                >
                  <span>Explore All {collection.title}</span>
                  <svg
                    className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        );
      })}
      
      {/* Add the fadeIn animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
