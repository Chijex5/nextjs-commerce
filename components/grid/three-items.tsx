import { GridTileImage } from "components/grid/tile";
import { getCollectionProducts } from "lib/database";
import type { Product } from "lib/database";
import Link from "next/link";

function ThreeItemGridItem({
  item,
  size,
  priority,
}: {
  item: Product;
  size: "full" | "half";
  priority?: boolean;
}) {
  const minPrice = parseFloat(item.priceRange.minVariantPrice.amount);
  const maxPrice = parseFloat(item.priceRange.maxVariantPrice.amount);
  const hasVariedPricing = minPrice !== maxPrice;

  return (
    <div
      className={
        size === "full"
          ? "md:col-span-4 md:row-span-2"
          : "md:col-span-2 md:row-span-1"
      }
    >
      <Link
        className="group relative block aspect-square h-full w-full"
        href={`/product/${item.handle}`}
        prefetch={true}
      >
        <div className="h-full overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-neutral-200/50 transition-all duration-300 group-hover:shadow-2xl group-hover:ring-neutral-300 dark:bg-neutral-900 dark:ring-neutral-800/50 dark:group-hover:ring-neutral-700">
          <GridTileImage
            src={item.featuredImage.url}
            fill
            sizes={
              size === "full"
                ? "(min-width: 768px) 66vw, 100vw"
                : "(min-width: 768px) 33vw, 100vw"
            }
            priority={priority}
            alt={item.title}
            label={{
              position: size === "full" ? "center" : "bottom",
              title: item.title as string,
              amount: item.priceRange.maxVariantPrice.amount,
              currencyCode: item.priceRange.maxVariantPrice.currencyCode,
              minAmount: hasVariedPricing
                ? item.priceRange.minVariantPrice.amount
                : undefined,
            }}
          />
        </div>
      </Link>
    </div>
  );
}

export async function ThreeItemGrid() {
  // Collections that start with `hidden-*` are hidden from the search page.
  const homepageItems = await getCollectionProducts({
    collection: "hidden-homepage-featured-items",
  });

  if (!homepageItems[0] || !homepageItems[1] || !homepageItems[2]) return null;

  const [firstProduct, secondProduct, thirdProduct] = homepageItems;

  return (
    <section className="mx-auto grid max-w-(--breakpoint-2xl) gap-4 px-4 pb-4 md:grid-cols-6 md:grid-rows-2 lg:max-h-[calc(100vh-200px)]">
      <ThreeItemGridItem size="full" item={firstProduct} priority={true} />
      <ThreeItemGridItem size="half" item={secondProduct} priority={true} />
      <ThreeItemGridItem size="half" item={thirdProduct} />
    </section>
  );
}
