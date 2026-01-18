import { GridTileImage } from "components/grid/tile";
import Footer from "components/layout/footer";
import { Gallery } from "components/product/gallery";
import { ProductDescription } from "components/product/product-description";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import {
  getProduct,
  getProductRecommendations,
  getProductReviewAggregate,
} from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import type { Image } from "lib/database";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const product = await getProduct(params.handle);

  if (!product) return notFound();
  console.log(product);

  const { url, width, height, altText: alt } = product.featuredImage || {};
  const hasSearchParams =
    searchParams && Object.keys(searchParams).length > 0;
  const indexable =
    !product.tags.includes(HIDDEN_PRODUCT_TAG) && !hasSearchParams;
  const title = product.seo.title || product.title;
  const description = product.seo.description || product.description;
  const canonicalPath = `/product/${product.handle}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(canonicalPath),
    },
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl(canonicalPath),
      type: "website",
      images: url
        ? [
            {
              url,
              width,
              height,
              alt,
            },
          ]
        : ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: url ? [url] : ["/opengraph-image"],
    },
  };
}

export default async function ProductPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const reviewAggregate = await getProductReviewAggregate(product.id);
  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.seo.description || product.description,
    image: product.images.map((image) => image.url).filter(Boolean),
    url: canonicalUrl(`/product/${product.handle}`),
    brand: {
      "@type": "Brand",
      name: siteName,
    },
    offers: {
      "@type": "AggregateOffer",
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      highPrice: product.priceRange.maxVariantPrice.amount,
      lowPrice: product.priceRange.minVariantPrice.amount,
      offerCount: product.variants.length,
    },
  };

  if (reviewAggregate.reviewCount > 0 && reviewAggregate.averageRating) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(reviewAggregate.averageRating.toFixed(1)),
      reviewCount: reviewAggregate.reviewCount,
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4">
        <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 lg:flex-row lg:gap-8 dark:border-neutral-800 dark:bg-black">
          <div className="h-full w-full basis-full lg:basis-4/6">
            <Suspense
              fallback={
                <div className="relative aspect-[3/4] h-full max-h-[700px] w-full overflow-hidden" />
              }
            >
              <Gallery
                images={product.images.slice(0, 5).map((image: Image) => ({
                  src: image.url,
                  altText: image.altText,
                }))}
              />
            </Suspense>
          </div>

          <div className="basis-full lg:basis-2/6">
            <Suspense fallback={null}>
              <ProductDescription product={product} />
            </Suspense>
          </div>
        </div>
        <RelatedProducts id={product.id} />
      </div>
      <Footer />
    </>
  );
}

async function RelatedProducts({ id }: { id: string }) {
  const relatedProducts = await getProductRecommendations(id);

  if (!relatedProducts.length) return null;

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">Related Products</h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {relatedProducts.map((product, index) => {
          const minPrice = parseFloat(
            product.priceRange.minVariantPrice.amount,
          );
          const maxPrice = parseFloat(
            product.priceRange.maxVariantPrice.amount,
          );
          const hasVariedPricing = minPrice !== maxPrice;

          return (
            <li
              key={`${product.handle}-${index}`}
              className="aspect-[3/4] w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
            >
              <Link
                className="relative h-full w-full"
                href={`/product/${product.handle}`}
                prefetch={true}
              >
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
                  sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
