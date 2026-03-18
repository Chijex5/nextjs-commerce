import Footer from "components/layout/footer";
import Price from "components/price";
import { Gallery } from "components/product/gallery";
import { ProductDescription } from "components/product/product-description";
import { ProductReviewsSection } from "components/product/product-reviews-section";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import {
  getProduct,
  getProductRecommendations,
  getProductReviewAggregate,
} from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import type { Image as ProductImage } from "lib/database";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const { url, width, height, altText: alt } = product.featuredImage || {};
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);
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
      <div className="mx-auto w-full max-w-[1800px] px-4 pb-16 pt-6 md:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400"
        >
          <Link
            href="/"
            className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href="/products"
            className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Shop
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-neutral-700 dark:text-neutral-200">
            {product.title}
          </span>
        </nav>

        <section className="mt-6 rounded-[32px] border border-neutral-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/90 md:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="h-full w-full">
              <Suspense
                fallback={
                  <div className="relative aspect-[3/4] h-full max-h-[700px] w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900" />
                }
              >
                <Gallery
                  images={product.images
                    .slice(0, 5)
                    .map((image: ProductImage) => ({
                    src: image.url,
                    altText: image.altText,
                    width: image.width,
                    height: image.height,
                  }))}
                />
              </Suspense>
            </div>

            <div className="lg:sticky lg:top-24">
              <Suspense fallback={null}>
                <ProductDescription
                  product={product}
                  reviewAggregate={reviewAggregate}
                />
              </Suspense>
            </div>
          </div>
        </section>

        <ProductReviewsSection
          productId={product.id}
          productHandle={product.handle}
        />
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
    <section className="mt-12 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
            You may also like
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Related products
          </h2>
        </div>
        <Link
          href="/products"
          className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
        >
          Shop all products
        </Link>
      </div>
      <ul className="no-scrollbar mt-6 flex w-full gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {relatedProducts.map((product, index) => (
          <li
            key={`${product.handle}-${index}`}
            className="w-[70%] flex-none sm:w-auto"
          >
            <Link
              className="group flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-3 transition-all hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700"
              href={`/product/${product.handle}`}
              prefetch={true}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
                {product.featuredImage?.url ? (
                  <Image
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText || product.title}
                    fill
                    sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 35vw, 70vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : null}
              </div>
              <div className="mt-4 space-y-1 px-1 pb-2">
                <p className="line-clamp-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {product.title}
                </p>
                <Price
                  amount={product.priceRange.maxVariantPrice.amount}
                  currencyCode={
                    product.priceRange.maxVariantPrice.currencyCode
                  }
                  currencyCodeClassName="hidden"
                  className="text-sm text-neutral-600 dark:text-neutral-300"
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
