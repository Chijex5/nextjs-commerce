import Footer from "components/layout/footer";
import HeroCarousel from "components/home/hero-carousel";
import Price from "components/price";
import {
  getCollectionsWithProducts,
  getProducts,
  getPublishedCustomOrders,
} from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const description =
  "D'FOOTPRINT - Handcrafted footwear including slippers and slides. Premium handmade designs with custom order options. Nationwide delivery across Nigeria.";

export const metadata: Metadata = {
  description,
  alternates: { canonical: canonicalUrl("/") },
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
    getPublishedCustomOrders(3),
  ]);

  const withImage = (list: typeof latestProducts) =>
    list.filter((product) => product.featuredImage?.url);

  const heroProducts = withImage(latestProducts).slice(0, 4);
  const icons = withImage(latestProducts).slice(0, 3);
  const spotlight = withImage(trendingProducts)[0];
  const visibleCollections = collectionsWithProducts
    .filter((item) => item.products.length > 0)
    .slice(0, 4);
  const featuredOrder = customOrderRows[0];

  return (
    <>
      {/* ─── TOKENS ─────────────────────────────────────────────────────
          Same hex values used by navbar/footer/cart-modal so the homepage
          and shared chrome read as one brand — only structure & type
          discipline changed here, not the palette. */}
      <style>{`
        :root {
          --dp-ink:     #0A0704;
          --dp-charcoal:#191209;
          --dp-cream:   #F2E8D5;
          --dp-sand:    #C9B99A;
          --dp-muted:   #6A5A48;
          --dp-ember:   #BF5A28;
          --dp-gold:    #C0892A;
          --dp-border:  rgba(242,232,213,0.1);
        }

        .dp-serif    { font-family: var(--font-cormorant-garamond), Georgia, serif; }
        .dp-sans     { font-family: var(--font-dm-sans), -apple-system, sans-serif; }

        @keyframes dp-rise { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: translateY(0); } }
        .dp-rise   { animation: dp-rise 1s cubic-bezier(0.16,1,0.3,1) both; }

        .dp-zoom { overflow: hidden; }
        .dp-zoom img { transition: transform 1.1s cubic-bezier(0.16,1,0.3,1); }
        .dp-zoom:hover img { transform: scale(1.035); }

        .dp-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.66rem; font-weight: 500;
          letter-spacing: 0.32em; text-transform: uppercase;
          color: var(--dp-muted);
        }

        .dp-link {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--dp-cream); text-decoration: none;
          display: inline-flex; align-items: center; gap: 0.6rem;
          padding-bottom: 0.3rem;
          border-bottom: 1px solid rgba(242,232,213,0.3);
          transition: border-color 0.3s, color 0.3s, gap 0.3s;
        }
        .dp-link:hover { border-color: var(--dp-cream); gap: 0.85rem; }

        .dp-link-ember { color: var(--dp-ember); border-bottom-color: rgba(191,90,40,0.4); }
        .dp-link-ember:hover { border-color: var(--dp-ember); }

        .dp-price-reveal { opacity: 0; transform: translateY(4px); transition: opacity 0.4s, transform 0.4s; }
        .dp-price-trigger:hover .dp-price-reveal { opacity: 1; transform: translateY(0); }

        .dp-nav-link { color: rgba(242,232,213,0.7); text-decoration: none; transition: color 0.2s; font-family: var(--font-dm-sans), sans-serif; font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; }
        .dp-nav-link:hover { color: var(--dp-cream); }

        .dp-grain::after {
          content:''; position:absolute; inset:0; pointer-events:none; z-index:5;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
        }
      `}</style>

      <div
        className="dp-sans"
        style={{ background: "var(--dp-ink)", color: "var(--dp-cream)" }}
      >
        {/* ══════════════════════════════════════════════════════════
            §1  HERO — full-bleed, brand only, no product, no price
        ══════════════════════════════════════════════════════════ */}
        <section
          className="dp-grain relative"
          style={{ height: "min(94vh, 920px)", overflow: "hidden" }}
        >
          <HeroCarousel products={heroProducts} />

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(6,4,2,0.5) 0%, rgba(6,4,2,0.12) 30%, rgba(6,4,2,0.2) 70%, rgba(6,4,2,0.85) 100%)",
            }}
          />

          <div
            className="relative flex h-full flex-col justify-between px-6 py-8 md:px-10 md:py-10 lg:px-16"
            style={{ zIndex: 10 }}
          >
            <div className="flex items-center justify-between">
              <span
                className="dp-serif"
                style={{
                  fontSize: "1.15rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                D&apos;Footprint
              </span>
              <nav className="hidden items-center gap-9 md:flex">
                <Link href="/products" className="dp-nav-link">
                  Shop All
                </Link>
                <Link href="/custom-orders" className="dp-nav-link">
                  Bespoke
                </Link>
              </nav>
            </div>

            <div className="dp-rise max-w-3xl pb-4">
              <h1
                className="dp-serif"
                style={{
                  fontSize: "clamp(2.6rem, 7vw, 5.6rem)",
                  lineHeight: 1.04,
                  fontWeight: 500,
                  color: "var(--dp-cream)",
                }}
              >
                The shape of a step,
                <br />
                considered.
              </h1>
              <p
                className="mt-6 max-w-md"
                style={{
                  fontSize: "0.95rem",
                  color: "rgba(242,232,213,0.78)",
                  lineHeight: 1.7,
                }}
              >
                Handcrafted in Lagos. Every pair shaped by one artisan, end
                to end — not a production line.
              </p>
              <div className="mt-9">
                <Link href="/products" className="dp-link">
                  Discover the Collection
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            §2  MANIFESTO — pure typography, no image, no product
        ══════════════════════════════════════════════════════════ */}
        <section
          className="mx-auto flex items-center justify-center text-center"
          style={{
            maxWidth: 980,
            minHeight: "46vh",
            padding: "6rem 1.75rem",
          }}
        >
          <p
            className="dp-serif"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.3rem)",
              fontWeight: 400,
              fontStyle: "italic",
              lineHeight: 1.55,
              color: "var(--dp-sand)",
            }}
          >
            We don&apos;t make shoes to be looked at. We make them to be
            worn until they belong to you — reshaped by your walk, your
            streets, your wear. That is the only finish that matters.
          </p>
        </section>

        {/* ══════════════════════════════════════════════════════════
            §3  ICONS — three large pieces, price revealed on hover only
        ══════════════════════════════════════════════════════════ */}
        {icons.length > 0 && (
          <section
            className="mx-auto"
            style={{ maxWidth: 1800, padding: "0 clamp(1.5rem, 4vw, 4rem) 7rem" }}
          >
            <div className="mb-14 flex items-end justify-between">
              <span className="dp-eyebrow">New This Season</span>
              <Link href="/products?sort=latest-desc" className="dp-link hidden sm:inline-flex">
                View all
              </Link>
            </div>

            <div
              style={{ display: "grid", gap: "1.25rem" }}
              className="grid-cols-1 md:grid-cols-3"
            >
              {icons.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.handle}`}
                  className="dp-zoom dp-price-trigger group block"
                  style={{
                    position: "relative",
                    aspectRatio: "4/5.2",
                    overflow: "hidden",
                    background: "var(--dp-charcoal)",
                    textDecoration: "none",
                  }}
                >
                  {product.featuredImage?.url && (
                    <Image
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText || product.title}
                      fill
                      sizes="(min-width: 768px) 32vw, 90vw"
                      className="object-cover"
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(6,4,2,0.78) 0%, transparent 45%)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      insetInline: 0,
                      bottom: 0,
                      padding: "1.5rem",
                    }}
                  >
                    <p
                      className="dp-serif"
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 500,
                        color: "var(--dp-cream)",
                      }}
                    >
                      {product.title}
                    </p>
                    <div className="dp-price-reveal mt-2">
                      <Price
                        amount={product.priceRange.maxVariantPrice.amount}
                        currencyCode={
                          product.priceRange.maxVariantPrice.currencyCode
                        }
                        currencyCodeClassName="hidden"
                        className="dp-sans"
                        style={
                          {
                            fontSize: "0.85rem",
                            color: "var(--dp-gold)",
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href="/products?sort=latest-desc"
              className="dp-link mt-10 inline-flex sm:hidden"
            >
              View all
            </Link>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            §4  EDITORIAL SPLIT — one spotlighted best-seller, told as
                a story, not catalogued as a grid
        ══════════════════════════════════════════════════════════ */}
        {spotlight && (
          <section
            className="grid"
            style={{
              borderTop: "1px solid var(--dp-border)",
              borderBottom: "1px solid var(--dp-border)",
            }}
          >
            <div
              className="grid lg:grid-cols-2"
              style={{ minHeight: "min(80vh, 760px)" }}
            >
              <div
                className="dp-zoom relative order-2 lg:order-1"
                style={{ minHeight: 360, background: "var(--dp-charcoal)" }}
              >
                {spotlight.featuredImage?.url && (
                  <Image
                    src={spotlight.featuredImage.url}
                    alt={spotlight.featuredImage.altText || spotlight.title}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                )}
              </div>

              <div
                className="order-1 flex flex-col justify-center px-6 py-16 md:px-12 lg:order-2 lg:px-16"
                style={{ background: "var(--dp-charcoal)" }}
              >
                <span className="dp-eyebrow mb-6">The Best Seller</span>
                <h2
                  className="dp-serif"
                  style={{
                    fontSize: "clamp(2rem, 4vw, 3.2rem)",
                    fontWeight: 500,
                    color: "var(--dp-cream)",
                    lineHeight: 1.15,
                    maxWidth: 480,
                  }}
                >
                  {spotlight.title}
                </h2>
                <p
                  className="mt-6"
                  style={{
                    fontSize: "0.92rem",
                    color: "var(--dp-muted)",
                    lineHeight: 1.75,
                    maxWidth: 420,
                  }}
                >
                  The pair our regulars keep returning for. No marketing
                  push — just made well enough that people tell each other
                  about it.
                </p>
                <div className="mt-8 flex items-center gap-6">
                  <Price
                    amount={spotlight.priceRange.maxVariantPrice.amount}
                    currencyCode={
                      spotlight.priceRange.maxVariantPrice.currencyCode
                    }
                    currencyCodeClassName="hidden"
                    className="dp-sans"
                    style={
                      {
                        fontSize: "1.1rem",
                        color: "var(--dp-gold)",
                      } as React.CSSProperties
                    }
                  />
                  <Link
                    href="/products?sort=best-selling"
                    className="dp-link"
                  >
                    Shop Best Sellers
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            §5  COLLECTIONS — fewer, larger, no item-count chips
        ══════════════════════════════════════════════════════════ */}
        {visibleCollections.length > 0 && (
          <section
            className="mx-auto"
            style={{ maxWidth: 1800, padding: "7rem clamp(1.5rem, 4vw, 4rem)" }}
          >
            <div className="mb-14 flex items-end justify-between">
              <span className="dp-eyebrow">Collections</span>
              <Link href="/products" className="dp-link hidden sm:inline-flex">
                Browse all
              </Link>
            </div>

            <div
              style={{ display: "grid", gap: "1.25rem" }}
              className="grid-cols-1 md:grid-cols-2"
            >
              {visibleCollections.map(({ collection, products: colProducts }) => {
                const preview = colProducts.find((p) => p.featuredImage?.url);
                return (
                  <Link
                    key={collection.handle}
                    href={collection.path}
                    className="dp-zoom group block"
                    style={{
                      position: "relative",
                      aspectRatio: "5/4",
                      overflow: "hidden",
                      textDecoration: "none",
                      background: "var(--dp-charcoal)",
                    }}
                  >
                    {preview?.featuredImage?.url ? (
                      <Image
                        src={preview.featuredImage.url}
                        alt={collection.title}
                        fill
                        sizes="(min-width: 768px) 48vw, 92vw"
                        className="object-cover"
                        style={{ filter: "brightness(0.7)" }}
                      />
                    ) : null}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(6,4,2,0.7) 0%, transparent 50%)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        insetInline: 0,
                        bottom: 0,
                        padding: "clamp(1.5rem, 3vw, 2.5rem)",
                      }}
                    >
                      <h3
                        className="dp-serif"
                        style={{
                          fontSize: "clamp(1.6rem, 2.8vw, 2.3rem)",
                          fontWeight: 500,
                          color: "var(--dp-cream)",
                        }}
                      >
                        {collection.title}
                      </h3>
                      <span
                        className="dp-link mt-4"
                        style={{ borderBottomColor: "rgba(242,232,213,0.4)" }}
                      >
                        Discover
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            §6  BESPOKE — one large diptych, not a thumbnail grid
        ══════════════════════════════════════════════════════════ */}
        {featuredOrder && (
          <section
            style={{
              background: "var(--dp-charcoal)",
              borderTop: "1px solid var(--dp-border)",
              borderBottom: "1px solid var(--dp-border)",
              padding: "7rem 0",
            }}
          >
            <div
              className="mx-auto grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              style={{ maxWidth: 1800, padding: "0 clamp(1.5rem, 4vw, 4rem)" }}
            >
              <div>
                <span className="dp-eyebrow mb-6 block">Bespoke</span>
                <h2
                  className="dp-serif"
                  style={{
                    fontSize: "clamp(2rem, 4vw, 3rem)",
                    fontWeight: 500,
                    color: "var(--dp-cream)",
                    lineHeight: 1.2,
                    maxWidth: 460,
                  }}
                >
                  Bring us the idea. We&apos;ll shape it by hand.
                </h2>
                <p
                  className="mt-6"
                  style={{
                    fontSize: "0.92rem",
                    color: "var(--dp-muted)",
                    lineHeight: 1.75,
                    maxWidth: 420,
                  }}
                >
                  Every commission starts as a conversation, not a form. We
                  talk through the brief, the materials, the fit — then we
                  build it once, properly.
                </p>
                <div className="mt-9">
                  <Link href="/custom-orders" className="dp-link dp-link-ember">
                    Begin a Commission
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <div
                  className="dp-zoom relative"
                  style={{ aspectRatio: "3/4", background: "var(--dp-ink)" }}
                >
                  {featuredOrder.beforeImage && (
                    <Image
                      src={featuredOrder.beforeImage}
                      alt={`${featuredOrder.title} inspiration`}
                      fill
                      sizes="25vw"
                      className="object-cover"
                    />
                  )}
                  <span
                    className="dp-eyebrow"
                    style={{
                      position: "absolute",
                      bottom: "0.85rem",
                      left: "0.85rem",
                      fontSize: "0.58rem",
                      color: "var(--dp-sand)",
                    }}
                  >
                    Before
                  </span>
                </div>
                <div
                  className="dp-zoom relative"
                  style={{ aspectRatio: "3/4", background: "var(--dp-ink)" }}
                >
                  {featuredOrder.afterImage && (
                    <Image
                      src={featuredOrder.afterImage}
                      alt={`${featuredOrder.title} result`}
                      fill
                      sizes="25vw"
                      className="object-cover"
                    />
                  )}
                  <span
                    className="dp-eyebrow"
                    style={{
                      position: "absolute",
                      bottom: "0.85rem",
                      left: "0.85rem",
                      fontSize: "0.58rem",
                      color: "var(--dp-cream)",
                    }}
                  >
                    After
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            §7  CLOSING — quiet, no giant decorative wordmark
        ══════════════════════════════════════════════════════════ */}
        <section
          className="mx-auto flex flex-col items-center text-center"
          style={{ maxWidth: 760, padding: "8rem 1.75rem 7rem" }}
        >
          <span className="dp-eyebrow mb-7">Stay Close</span>
          <h2
            className="dp-serif"
            style={{
              fontSize: "clamp(1.9rem, 3.6vw, 2.8rem)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--dp-cream)",
              lineHeight: 1.4,
              marginBottom: "2.5rem",
            }}
          >
            New work, made slowly. We&apos;ll let you know when it&apos;s
            ready.
          </h2>
          <Link href="/custom-orders" className="dp-link">
            Order a Custom Pair
            <span aria-hidden>→</span>
          </Link>
        </section>
      </div>

      <Footer />
    </>
  );
}
