import Footer from "components/layout/footer";
import Price from "components/price";
import { Gallery } from "components/product/gallery";
import { ProductDescription } from "components/product/product-description";
import { ProductReviewsSection } from "components/product/product-reviews-section";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import type { Image as ProductImage } from "lib/database";
import {
  getProduct,
  getProductRecommendations,
  getProductReviewAggregate,
} from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
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
    alternates: { canonical: canonicalUrl(canonicalPath) },
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: { index: indexable, follow: indexable },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl(canonicalPath),
      type: "website",
      images: url ? [{ url, width, height, alt }] : ["/opengraph-image"],
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
  const averageRating = Number(reviewAggregate.averageRating);
  const hasValidAverageRating =
    Number.isFinite(averageRating) && averageRating > 0;

  const productJsonLd: Record<string, unknown> = {
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

  if (reviewAggregate.reviewCount > 0 && hasValidAverageRating) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(averageRating.toFixed(1)),
      reviewCount: reviewAggregate.reviewCount,
    };
  }

  return (
    <>
      <style>{`

        :root {
          --espresso:   #0A0704;
          --charcoal:   #100C06;
          --cream:      #F2E8D5;
          --sand:       #C9B99A;
          --muted:      #6A5A48;
          --terra:      #BF5A28;
          --gold:       #C0892A;
          --border:     rgba(242,232,213,0.09);
          --border-mid: rgba(242,232,213,0.18);
        }

        .pp-root {
          background: var(--espresso);
          min-height: 100vh;
          font-family: var(--font-dm-sans), sans-serif;
          color: var(--cream);
        }

        /* ── BREADCRUMB ── */
        .pp-breadcrumb {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--muted);
          padding: 24px 48px 0;
        }
        .pp-breadcrumb a {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s;
        }
        .pp-breadcrumb a:hover { color: var(--cream); }
        .pp-breadcrumb-sep { color: var(--border-mid); }
        .pp-breadcrumb-current { color: var(--sand); }

        /* ── PRODUCT SHELL ── */
        .pp-shell {
          margin: 20px 48px 0;
          border: 1px solid var(--border);
          background: rgba(16,12,6,0.9);
        }
        .pp-inner {
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          gap: 0;
          align-items: start;
        }
        .pp-gallery-col {
          border-right: 1px solid var(--border);
          padding: 40px;
        }
        .pp-info-col {
          padding: 40px;
          position: sticky;
          top: 24px;
        }

        /* ── REVIEWS SECTION ── */
        .pp-reviews-wrap {
          margin: 2px 48px 0;
          border: 1px solid var(--border);
          border-top: none;
          background: rgba(16,12,6,0.6);
        }

        /* ── RELATED ── */
        .pp-related {
          margin: 2px 48px 0;
          border: 1px solid var(--border);
          border-top: none;
          background: rgba(16,12,6,0.5);
          padding: 40px;
        }
        .pp-related-eyebrow {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--terra);
          margin-bottom: 8px;
        }
        .pp-related-title {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: clamp(26px, 3vw, 36px);
          font-weight: 300;
          color: var(--cream);
          line-height: 1.05;
        }
        .pp-related-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding-bottom: 28px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 28px;
        }
        .pp-related-link {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .pp-related-link::after { content: '→'; }
        .pp-related-link:hover { color: var(--cream); }

        .pp-related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 2px;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .pp-related-card {
          display: flex;
          flex-direction: column;
          background: rgba(242,232,213,0.02);
          border: 1px solid var(--border);
          text-decoration: none;
          transition: background 0.3s, border-color 0.3s;
          overflow: hidden;
        }
        .pp-related-card:hover {
          background: rgba(242,232,213,0.04);
          border-color: var(--border-mid);
        }
        .pp-related-img {
          position: relative;
          aspect-ratio: 3/4;
          overflow: hidden;
          background: rgba(242,232,213,0.03);
        }
        .pp-related-img img {
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .pp-related-card:hover .pp-related-img img { transform: scale(1.04); }
        .pp-related-info {
          padding: 16px;
          border-top: 1px solid var(--border);
        }
        .pp-related-name {
          font-family: var(--font-cormorant-garamond), serif;
          font-size: 18px;
          font-weight: 400;
          color: var(--cream);
          line-height: 1.2;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pp-related-price {
          font-size: 13px;
          font-weight: 500;
          color: var(--gold);
        }

        /* ── ACCENT LINE ── */
        .pp-accent-line {
          height: 1px;
          background: linear-gradient(90deg, var(--terra) 0%, var(--gold) 50%, transparent 100%);
          margin-bottom: 28px;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .pp-breadcrumb { padding: 20px 24px 0; }
          .pp-shell { margin: 16px 24px 0; }
          .pp-inner { grid-template-columns: 1fr; }
          .pp-gallery-col { border-right: none; border-bottom: 1px solid var(--border); padding: 24px; }
          .pp-info-col { padding: 24px; position: static; }
          .pp-reviews-wrap { margin: 2px 24px 0; }
          .pp-related { margin: 2px 24px 0; padding: 24px; }
        }
        @media (max-width: 640px) {
          .pp-breadcrumb { padding: 16px 16px 0; }
          .pp-shell { margin: 12px 16px 0; }
          .pp-gallery-col { padding: 16px; }
          .pp-info-col { padding: 16px; }
          .pp-reviews-wrap { margin: 2px 16px 0; }
          .pp-related { margin: 2px 16px 0; padding: 16px; }
          .pp-related-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="pp-root">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="pp-breadcrumb">
          <Link href="/">Home</Link>
          <span className="pp-breadcrumb-sep" aria-hidden="true">
            /
          </span>
          <Link href="/products">Shop</Link>
          <span className="pp-breadcrumb-sep" aria-hidden="true">
            /
          </span>
          <span className="pp-breadcrumb-current">{product.title}</span>
        </nav>

        {/* Main product shell */}
        <div className="pp-shell">
          <div className="pp-inner">
            {/* Gallery */}
            <div className="pp-gallery-col">
              <Suspense
                fallback={
                  <div
                    style={{
                      aspectRatio: "3/4",
                      background: "rgba(242,232,213,0.02)",
                      border: "1px solid var(--border)",
                    }}
                  />
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

            {/* Info panel */}
            <div className="pp-info-col">
              <Suspense fallback={null}>
                <ProductDescription
                  product={product}
                  reviewAggregate={reviewAggregate}
                />
              </Suspense>
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 20,
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "var(--terra)",
                      marginBottom: 6,
                    }}
                  >
                    Sizing help
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    Use the guide before checkout if you want a second opinion
                    on fit.
                  </p>
                </div>
                <Link
                  href="/sizing-guide"
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--cream)",
                    textDecoration: "none",
                    borderBottom: "1px solid var(--terra)",
                    paddingBottom: 2,
                  }}
                >
                  Open sizing guide
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="pp-reviews-wrap">
          <ProductReviewsSection
            productId={product.id}
            productHandle={product.handle}
          />
        </div>

        {/* Related products */}
        <RelatedProducts id={product.id} />

        <Footer />
      </div>
    </>
  );
}

async function RelatedProducts({ id }: { id: string }) {
  const relatedProducts = await getProductRecommendations(id);
  if (!relatedProducts.length) return null;

  return (
    <section className="pp-related">
      <div className="pp-accent-line" />
      <div className="pp-related-header">
        <div>
          <p className="pp-related-eyebrow">You may also like</p>
          <h2 className="pp-related-title">Related products</h2>
        </div>
        <Link href="/products" className="pp-related-link">
          Shop all
        </Link>
      </div>

      <ul className="pp-related-grid">
        {relatedProducts.map((product, index) => (
          <li key={`${product.handle}-${index}`}>
            <Link
              className="pp-related-card"
              href={`/product/${product.handle}`}
              prefetch={true}
            >
              <div className="pp-related-img">
                {product.featuredImage?.url ? (
                  <Image
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText || product.title}
                    fill
                    sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 35vw, 50vw"
                  />
                ) : null}
              </div>
              <div className="pp-related-info">
                <p className="pp-related-name">{product.title}</p>
                <Price
                  amount={product.priceRange.maxVariantPrice.amount}
                  currencyCode={product.priceRange.maxVariantPrice.currencyCode}
                  currencyCodeClassName="hidden"
                  className="pp-related-price"
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
