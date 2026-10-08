import Footer from "components/layout/footer";
import { ProductCard } from "components/product/product-card";
import { ProductGallery } from "components/product/product-gallery";
import { ProductPurchase } from "components/product/product-purchase";
import { ProductReviewsSection } from "components/product/product-reviews-section";
import Prose from "components/prose";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import {
  getProductReviews,
  getProductView,
  getRelatedProducts,
} from "lib/data/product";
import { isMockData } from "lib/data/source";
import type { Product } from "lib/shopify/types";
import { canonicalUrl, siteName } from "lib/seo";
import { ArrowUpRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const product = await getProductView(params.handle);
  if (!product) return notFound();

  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);
  const title = product.seo.title || product.title;
  const description = product.seo.description || product.description;
  const path = `/product/${product.handle}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl(path) },
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: { index: indexable, follow: indexable },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl(path),
      type: "website",
      images: [`${canonicalUrl(path)}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: [`${canonicalUrl(path)}/opengraph-image`],
    },
  };
}

export default async function ProductPage(props: Props) {
  const params = await props.params;
  const product = await getProductView(params.handle);
  if (!product) return notFound();

  const [reviews, related] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product),
  ]);
  const rating = Number(reviews.averageRating);
  const hasRating =
    reviews.reviewCount > 0 && Number.isFinite(rating) && rating > 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productJsonLd(
              product,
              hasRating ? rating : null,
              reviews.reviewCount,
            ),
          ),
        }}
      />

      <div className="bg-canvas text-fg">
        <nav
          aria-label="Breadcrumb"
          className="label hidden gap-2 px-12 pb-6 pt-6 text-fg-3 md:flex"
        >
          <Link href="/" className="hover:text-fg">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-fg">
            Shop
          </Link>
          <span>/</span>
          <span className="text-fg">{product.title}</span>
        </nav>

        <div className="md:grid md:grid-cols-12 md:gap-10 md:px-12">
          <div className="md:col-span-7">
            <ProductGallery
              images={product.images.slice(0, 6).map((img) => ({
                src: img.url,
                alt: img.altText || product.title,
              }))}
            />
          </div>

          <div className="px-4 pb-12 pt-6 sm:px-8 md:col-span-5 md:px-0 md:pt-0">
            <div className="md:sticky md:top-24">
              <p className="label text-fg-3">(Handmade in Lagos)</p>
              <h1 className="display mt-3 text-[clamp(2.8rem,6vw,5.5rem)]">
                {product.title}
              </h1>
              {hasRating ? (
                <a
                  href="#reviews"
                  className="label mt-3 inline-block text-fg-2"
                >
                  ★ {rating.toFixed(1)} · {reviews.reviewCount}{" "}
                  {reviews.reviewCount === 1 ? "review" : "reviews"}
                </a>
              ) : null}

              <ProductPurchase product={product} />

              <p className="mt-5 text-sm text-fg-2">
                Delivered anywhere in Nigeria — the fee for your state is shown
                before you pay.
              </p>

              <div className="mt-8 border-t border-line">
                {product.descriptionHtml ? (
                  <Disclosure title="Details" open>
                    <Prose
                      html={product.descriptionHtml}
                      className="!mx-0 !max-w-none !text-[15px] !leading-relaxed !text-fg-2"
                    />
                  </Disclosure>
                ) : null}
                <Disclosure title="Size & fit">
                  <p>
                    Not sure of your size? Check the{" "}
                    <Link href="/sizing-guide" className="underline">
                      sizing guide
                    </Link>
                    , or message us on WhatsApp and we&apos;ll help.
                  </p>
                </Disclosure>
                <Disclosure title="Delivery">
                  <p>
                    We deliver across Nigeria. The delivery fee for your state
                    is calculated at checkout before payment. Questions about
                    timing?{" "}
                    <Link href="/contact" className="underline">
                      Contact us
                    </Link>
                    .
                  </p>
                </Disclosure>
                <Disclosure title="Care">
                  <p>
                    How to keep your pair looking its best:{" "}
                    <Link href="/care-instructions" className="underline">
                      care instructions
                    </Link>
                    .
                  </p>
                </Disclosure>
              </div>

              <Link
                href="/custom-orders"
                className="group mt-8 flex items-center justify-between gap-4 bg-fg p-5 text-canvas"
              >
                <span>
                  <span className="label opacity-60">Want it different?</span>
                  <span className="mt-1 block font-medium">
                    Change the strap, colour or size — order it custom.
                  </span>
                </span>
                <ArrowUpRight className="size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>

        {!isMockData ? (
          <section
            id="reviews"
            className="mt-16 border-t border-line px-4 py-16 sm:px-8 md:px-12"
          >
            <h2 className="display mb-10 text-[clamp(2.6rem,7vw,6rem)]">
              Reviews
            </h2>
            <ProductReviewsSection
              productId={product.id}
              productHandle={product.handle}
            />
          </section>
        ) : null}

        {related.length ? (
          <section className="border-t border-line py-16 sm:py-20">
            <div className="label mb-8 flex items-baseline justify-between px-4 sm:px-8 md:px-12">
              <span className="text-fg-3">You may also like</span>
              <Link href="/products" className="link-underline">
                Shop all
              </Link>
            </div>
            <ul className="rail flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:scroll-px-8 sm:gap-4 sm:px-8 md:scroll-px-12 md:px-12">
              {related.map((p, i) => (
                <li
                  key={p.id}
                  className="w-[62vw] shrink-0 snap-start sm:w-[38vw] md:w-[24vw] lg:w-[19vw]"
                >
                  <ProductCard
                    product={p}
                    index={i}
                    sizes="(min-width:1024px) 19vw, (min-width:768px) 24vw, 62vw"
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <Footer />
    </>
  );
}

function Disclosure({
  title,
  open,
  children,
}: {
  title: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="label flex h-14 cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
        {title}
        <Plus className="size-4 transition-transform duration-300 group-open:rotate-45" />
      </summary>
      <div className="pb-6 text-[15px] leading-relaxed text-fg-2">
        {children}
      </div>
    </details>
  );
}

function productJsonLd(
  product: Product,
  rating: number | null,
  reviewCount: number,
) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.seo.description || product.description,
    image: product.images.map((image) => image.url).filter(Boolean),
    url: canonicalUrl(`/product/${product.handle}`),
    brand: { "@type": "Brand", name: siteName },
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
  if (rating !== null) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(rating.toFixed(1)),
      reviewCount,
    };
  }
  return data;
}
