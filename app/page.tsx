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

const arrivalCopy = [
  "Handcrafted pairs ready for quick checkout.",
  "Slides and slippers built for daily comfort.",
  "Distinctive details, made by hand.",
  "Limited stock, no two pairs identical.",
  "Finished and inspected before it ships.",
  "The pair our regulars keep coming back for.",
];

const MAISON_VALUES = [
  {
    n: "01",
    title: "Made by hand",
    desc: "Every pair is cut, stitched and finished by a single artisan in our Lagos workshop — not a production line.",
  },
  {
    n: "02",
    title: "Considered materials",
    desc: "We choose leathers and fabrics for how they age, not just how they photograph on day one.",
  },
  {
    n: "03",
    title: "Made to order",
    desc: "Bespoke commissions are welcome. Tell us the brief; we'll shape it into something only you have.",
  },
];

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

  const arrivals = latestProducts
    .filter((product) => product.featuredImage?.url)
    .slice(0, 6);
  const bestSellers = trendingProducts
    .filter((product) => product.featuredImage?.url)
    .slice(0, 4);
  const visibleCollections = collectionsWithProducts
    .filter((item) => item.products.length > 0)
    .slice(0, 6);
  const heroProducts = latestProducts
    .filter((product) => product.featuredImage?.url)
    .slice(0, 5);

  return (
    <>
      {/* ─── TOKENS, TYPE, MOTION ──────────────────────────────────────── */}
      <style>{`

        :root {
          --dp-void:    #06040200;
          --dp-ink:     #0A0704;
          --dp-charcoal:#191209;
          --dp-card:    #1E1510;
          --dp-cream:   #F2E8D5;
          --dp-sand:    #C9B99A;
          --dp-muted:   #6A5A48;
          --dp-ember:   #BF5A28;
          --dp-gold:    #C0892A;
          --dp-border:  rgba(242,232,213,0.09);
        }

        .dp-wordmark   { font-family: var(--font-bebas-neue), serif; font-variant: small-caps; }
        .dp-serif      { font-family: var(--font-cormorant-garamond), serif; }
        .dp-sans       { font-family: var(--font-dm-sans), sans-serif; }

        @keyframes dp-rise {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dp-rise-1 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .dp-rise-2 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.16s both; }
        .dp-rise-3 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.28s both; }

        .dp-lift {
          transition: transform 0.6s cubic-bezier(0.16,1,0.3,1);
        }
        .dp-lift:hover { transform: translateY(-4px); }

        .dp-zoom { overflow: hidden; }
        .dp-zoom img { transition: transform 0.9s cubic-bezier(0.16,1,0.3,1); }
        .dp-zoom:hover img { transform: scale(1.045); }

        .dp-btn-solid {
          display: inline-flex; align-items: center; gap: 0.6rem;
          background: var(--dp-cream); color: var(--dp-ink);
          font-family: var(--font-dm-sans), sans-serif; font-weight: 500;
          font-size: 0.7rem; letter-spacing: 0.16em; text-transform: uppercase;
          padding: 1rem 2.3rem; text-decoration: none;
          transition: background 0.25s, color 0.25s;
        }
        .dp-btn-solid:hover { background: var(--dp-ember); color: var(--dp-cream); }

        .dp-btn-ghost {
          display: inline-flex; align-items: center; gap: 0.6rem;
          border: 1px solid rgba(242,232,213,0.26); color: var(--dp-cream);
          font-family: var(--font-dm-sans), sans-serif; font-weight: 500;
          font-size: 0.7rem; letter-spacing: 0.16em; text-transform: uppercase;
          padding: 1rem 2.3rem; text-decoration: none;
          transition: border-color 0.25s, background 0.25s;
        }
        .dp-btn-ghost:hover { border-color: var(--dp-cream); background: rgba(242,232,213,0.05); }

        .dp-rule  { border: none; border-top: 1px solid var(--dp-border); }
        .dp-label { font-family:var(--font-dm-sans),sans-serif; font-size:0.62rem; font-weight:500; letter-spacing:0.28em; text-transform:uppercase; color:var(--dp-muted); }
        .dp-nav-link { color: var(--dp-muted); text-decoration: none; transition: color 0.2s; font-family: var(--font-dm-sans), sans-serif; }
        .dp-nav-link:hover { color: var(--dp-cream); }
        .dp-h2    { font-family:var(--font-cormorant-garamond),serif; font-weight:500; color:var(--dp-cream); }

        .dp-qv { position:absolute; inset:0; display:flex; align-items:flex-end; padding:1rem; opacity:0; background:rgba(6,4,2,0.4); transition:opacity 0.35s; }
        .dp-zoom:hover .dp-qv { opacity:1; }
        .dp-qv-label { font-family:var(--font-dm-sans),sans-serif; font-size:0.6rem; font-weight:500; letter-spacing:0.18em; text-transform:uppercase; color:var(--dp-cream); border-bottom:1px solid var(--dp-ember); padding-bottom:2px; }

        .dp-tag { font-family:var(--font-dm-sans),sans-serif; font-size:0.56rem; font-weight:500; letter-spacing:0.18em; text-transform:uppercase; color:var(--dp-sand); border-bottom: 1px solid var(--dp-border); padding-bottom: 2px; }

        .dp-grain::after {
          content:''; position:absolute; inset:0; pointer-events:none; z-index:5;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
        }
      `}</style>

      <div
        className="dp-sans"
        style={{ background: "var(--dp-ink)", color: "var(--dp-cream)" }}
      >
        {/* ══════════════════════════════════════════════════════════
            §1  HERO — one statement, one image, no clutter
        ══════════════════════════════════════════════════════════ */}
        <section
          className="dp-grain relative overflow-hidden"
          style={{ background: "var(--dp-ink)" }}
        >
          <div
            className="pointer-events-none absolute"
            style={{
              width: 600,
              height: 600,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(191,90,40,0.13) 0%, transparent 68%)",
              right: -100,
              top: -160,
              filter: "blur(80px)",
            }}
          />

          <div
            className="relative mx-auto px-6 pt-12 pb-0 md:px-10 lg:px-16"
            style={{ maxWidth: 1800, zIndex: 10 }}
          >
            <div className="dp-rise-1 mb-10 flex items-center justify-between">
              <span className="dp-label">
                Est. in Nigeria — Handcrafted Since Day One
              </span>
              <nav className="hidden md:flex items-center gap-8">
                <Link href="/products" className="dp-label dp-nav-link">
                  Shop All
                </Link>
                <Link href="/custom-orders" className="dp-label dp-nav-link">
                  Custom Orders
                </Link>
              </nav>
            </div>

            <div className="dp-rise-2 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
              <div className="flex flex-col justify-between" style={{ minHeight: 480 }}>
                <div>
                  <h1
                    className="dp-wordmark"
                    style={{
                      fontSize: "clamp(3.6rem, 9vw, 7.5rem)",
                      lineHeight: 0.96,
                      letterSpacing: "0.01em",
                      color: "var(--dp-cream)",
                      fontWeight: 600,
                    }}
                  >
                    D&apos;Footprint
                  </h1>
                  <p
                    className="dp-serif mt-7"
                    style={{
                      fontSize: "clamp(1.2rem, 2.2vw, 1.6rem)",
                      fontWeight: 400,
                      fontStyle: "italic",
                      lineHeight: 1.55,
                      color: "var(--dp-sand)",
                      maxWidth: 460,
                    }}
                  >
                    Where every stitch tells a story and every sole carries
                    you further.
                  </p>
                </div>

                <div className="dp-rise-3 mt-10 flex flex-wrap items-center gap-8">
                  <Link href="/products" className="dp-btn-solid">
                    Shop Collection
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8h10M9 4l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                  <Link href="/custom-orders" className="dp-label dp-nav-link">
                    Or commission a pair →
                  </Link>
                </div>
              </div>

              <div
                style={{
                  position: "relative",
                  minHeight: 480,
                  height: "clamp(480px, 56vw, 620px)",
                }}
              >
                <HeroCarousel products={heroProducts} />
              </div>
            </div>

            <div className="dp-rise-3 mt-14 flex items-center gap-6 pb-10">
              <span className="dp-rule flex-1" />
              <span className="dp-label" style={{ whiteSpace: "nowrap" }}>
                Premium Slippers &amp; Slides · Nationwide Delivery
              </span>
              <span className="dp-rule flex-1" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            §2  LATEST ARRIVALS — single editorial grid, no duplicate sections
        ══════════════════════════════════════════════════════════ */}
        {arrivals.length > 0 && (
          <section
            className="mx-auto"
            style={{
              maxWidth: 1800,
              padding: "5rem clamp(1.5rem, 4vw, 4rem) 4rem",
            }}
          >
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="dp-label mb-3">Latest drops</p>
                <h2
                  className="dp-h2 dp-serif"
                  style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}
                >
                  Just Landed
                </h2>
              </div>
              <Link href="/products?sort=latest-desc" className="dp-btn-ghost hidden sm:inline-flex">
                View all
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gap: "1rem",
                gridTemplateColumns: "repeat(2, 1fr)",
              }}
              className="md:grid-cols-3"
            >
              {arrivals.map((product, index) => {
                const isFeature = index === 0;
                const copy = arrivalCopy[index % arrivalCopy.length];
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.handle}`}
                    className="dp-zoom dp-lift group"
                    style={{
                      position: "relative",
                      display: "block",
                      aspectRatio: isFeature ? "3/4" : "3/4",
                      textDecoration: "none",
                      gridRow: isFeature ? "1 / 3" : undefined,
                      gridColumn: isFeature ? "span 2" : undefined,
                      overflow: "hidden",
                      background: "var(--dp-charcoal)",
                    }}
                  >
                    {product.featuredImage?.url && (
                      <Image
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText || product.title}
                        fill
                        sizes={
                          isFeature
                            ? "(min-width: 768px) 65vw, 90vw"
                            : "(min-width: 768px) 32vw, 45vw"
                        }
                        className="object-cover"
                        priority={index < 2}
                      />
                    )}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(6,4,2,0.88) 0%, rgba(6,4,2,0.1) 50%, transparent 75%)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: isFeature
                          ? "clamp(1.5rem, 3vw, 2.5rem)"
                          : "1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                      }}
                    >
                      <p className="dp-label" style={{ marginBottom: "0.5rem" }}>
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3
                        className="dp-serif line-clamp-2"
                        style={{
                          fontSize: isFeature
                            ? "clamp(1.5rem, 2.6vw, 2.1rem)"
                            : "1.05rem",
                          fontWeight: 500,
                          color: "var(--dp-cream)",
                          marginBottom: isFeature ? "0.6rem" : "0.4rem",
                        }}
                      >
                        {product.title}
                      </h3>
                      {isFeature && (
                        <p
                          className="dp-sans"
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--dp-sand)",
                            marginBottom: "0.9rem",
                            lineHeight: 1.6,
                            maxWidth: 360,
                          }}
                        >
                          {copy}
                        </p>
                      )}
                      <Price
                        amount={product.priceRange.maxVariantPrice.amount}
                        currencyCode={
                          product.priceRange.maxVariantPrice.currencyCode
                        }
                        currencyCodeClassName="hidden"
                        className="dp-sans"
                        style={
                          {
                            fontSize: isFeature ? "1.05rem" : "0.85rem",
                            color: "var(--dp-gold)",
                          } as React.CSSProperties
                        }
                      />
                    </div>
                    <div className="dp-qv">
                      <span className="dp-qv-label">View Piece</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <Link
              href="/products?sort=latest-desc"
              className="dp-btn-ghost mt-10 inline-flex sm:hidden"
            >
              View all
            </Link>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            §3  BEST SELLERS — quiet, list-led, no gimmicks
        ══════════════════════════════════════════════════════════ */}
        {bestSellers.length > 0 && (
          <section
            style={{
              background: "var(--dp-charcoal)",
              borderTop: "1px solid var(--dp-border)",
              borderBottom: "1px solid var(--dp-border)",
              padding: "5rem 0",
            }}
          >
            <div
              className="mx-auto"
              style={{ maxWidth: 1800, padding: "0 clamp(1.5rem, 4vw, 4rem)" }}
            >
              <div className="mb-12 flex items-end justify-between">
                <div>
                  <p className="dp-label mb-3">Most loved</p>
                  <h2
                    className="dp-h2 dp-serif"
                    style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}
                  >
                    Best Sellers
                  </h2>
                </div>
                <Link href="/products?sort=best-selling" className="dp-btn-ghost hidden sm:inline-flex">
                  Shop all
                </Link>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "2.5rem 1.5rem",
                }}
                className="lg:grid-cols-4"
              >
                {bestSellers.map((product, i) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.handle}`}
                    className="group block"
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="dp-zoom"
                      style={{
                        position: "relative",
                        aspectRatio: "4/5",
                        background: "var(--dp-ink)",
                      }}
                    >
                      {product.featuredImage?.url && (
                        <Image
                          src={product.featuredImage.url}
                          alt={product.featuredImage.altText || product.title}
                          fill
                          sizes="(min-width: 1024px) 18vw, (min-width: 640px) 40vw, 80vw"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="mt-4 flex items-start justify-between gap-3">
                      <div>
                        <span
                          className="dp-serif"
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--dp-muted)",
                            marginRight: "0.5rem",
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p
                          className="line-clamp-2 dp-sans inline"
                          style={{ fontSize: "0.84rem", color: "var(--dp-sand)" }}
                        >
                          {product.title}
                        </p>
                      </div>
                    </div>
                    <Price
                      amount={product.priceRange.maxVariantPrice.amount}
                      currencyCode={
                        product.priceRange.maxVariantPrice.currencyCode
                      }
                      currencyCodeClassName="hidden"
                      className="dp-sans mt-1"
                      style={
                        {
                          fontSize: "0.9rem",
                          color: "var(--dp-gold)",
                          marginLeft: "1.45rem",
                        } as React.CSSProperties
                      }
                    />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            §4  MAISON VALUES — text-led statement, not an icon grid
        ══════════════════════════════════════════════════════════ */}
        <section
          className="mx-auto"
          style={{ maxWidth: 1800, padding: "6rem clamp(1.5rem, 4vw, 4rem)" }}
        >
          <p className="dp-label mb-4">Why D&apos;Footprint</p>
          <div
            style={{
              display: "grid",
              gap: "3rem",
              gridTemplateColumns: "repeat(1, 1fr)",
            }}
            className="md:grid-cols-3"
          >
            {MAISON_VALUES.map(({ n, title, desc }) => (
              <div
                key={n}
                style={{
                  borderTop: "1px solid var(--dp-border)",
                  paddingTop: "1.75rem",
                }}
              >
                <span
                  className="dp-serif"
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--dp-ember)",
                    display: "block",
                    marginBottom: "1rem",
                  }}
                >
                  {n}
                </span>
                <h3
                  className="dp-serif"
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 500,
                    color: "var(--dp-cream)",
                    marginBottom: "0.75rem",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--dp-muted)",
                    lineHeight: 1.7,
                    maxWidth: 340,
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            §5  COLLECTIONS
        ══════════════════════════════════════════════════════════ */}
        {visibleCollections.length > 0 && (
          <section
            className="mx-auto"
            style={{ maxWidth: 1800, padding: "1rem clamp(1.5rem, 4vw, 4rem) 5rem" }}
          >
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="dp-label mb-3">Explore</p>
                <h2
                  className="dp-h2 dp-serif"
                  style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}
                >
                  Collections
                </h2>
              </div>
              <Link href="/products" className="dp-btn-ghost hidden sm:inline-flex">
                Browse all
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gap: "1rem",
                gridTemplateColumns: "repeat(1, 1fr)",
              }}
              className="md:grid-cols-2 lg:grid-cols-3"
            >
              {visibleCollections.map(
                ({ collection, products: colProducts }, idx) => {
                  const preview = colProducts.find((p) => p.featuredImage?.url);
                  const isFeature = idx === 0;
                  return (
                    <Link
                      key={collection.handle}
                      href={collection.path}
                      className="dp-zoom dp-lift"
                      style={{
                        position: "relative",
                        display: "block",
                        aspectRatio: isFeature ? "16/9" : "4/3",
                        textDecoration: "none",
                        overflow: "hidden",
                        gridColumn: isFeature ? "1 / -1" : undefined,
                      }}
                    >
                      {preview?.featuredImage?.url ? (
                        <Image
                          src={preview.featuredImage.url}
                          alt={collection.title}
                          fill
                          sizes="(min-width: 1024px) 60vw, 90vw"
                          className="object-cover"
                          style={{ filter: "brightness(0.62)" }}
                        />
                      ) : (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "var(--dp-charcoal)",
                          }}
                        />
                      )}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(135deg, rgba(6,4,2,0.78) 0%, rgba(6,4,2,0.1) 65%)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          padding: "clamp(1.5rem, 3vw, 2.5rem)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-end",
                        }}
                      >
                        <p className="dp-label" style={{ marginBottom: "0.6rem" }}>
                          {colProducts.length} pieces
                        </p>
                        <h3
                          className="dp-serif"
                          style={{
                            fontSize: isFeature
                              ? "clamp(1.7rem, 3.5vw, 2.8rem)"
                              : "1.45rem",
                            fontWeight: 500,
                            color: "var(--dp-cream)",
                          }}
                        >
                          {collection.title}
                        </h3>
                        {collection.description && (
                          <p
                            className="line-clamp-2"
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--dp-sand)",
                              marginTop: "0.6rem",
                              maxWidth: 480,
                              lineHeight: 1.6,
                            }}
                          >
                            {collection.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            §6  BESPOKE / CUSTOM ORDERS
        ══════════════════════════════════════════════════════════ */}
        {customOrderRows.length > 0 && (
          <section
            style={{
              background: "var(--dp-charcoal)",
              borderTop: "1px solid var(--dp-border)",
              padding: "5rem 0",
            }}
          >
            <div
              className="mx-auto"
              style={{ maxWidth: 1800, padding: "0 clamp(1.5rem, 4vw, 4rem)" }}
            >
              <div className="mb-12 flex items-end justify-between">
                <div>
                  <p className="dp-label mb-3">Bespoke</p>
                  <h2
                    className="dp-h2 dp-serif"
                    style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}
                  >
                    Custom Work
                  </h2>
                </div>
                <Link href="/custom-orders" className="dp-btn-ghost hidden sm:inline-flex">
                  Request yours
                </Link>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "1.5rem",
                  gridTemplateColumns: "repeat(1, 1fr)",
                }}
                className="md:grid-cols-3"
              >
                {customOrderRows.map((order) => (
                  <Link
                    key={order.id}
                    href={`/custom-orders#order-${order.id}`}
                    className="group block"
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        className="dp-zoom"
                        style={{
                          position: "relative",
                          aspectRatio: "1",
                          background: "var(--dp-ink)",
                        }}
                      >
                        {order.beforeImage && (
                          <Image
                            src={order.beforeImage}
                            alt={`${order.title} inspiration`}
                            fill
                            sizes="20vw"
                            className="object-cover"
                          />
                        )}
                        <span
                          className="dp-tag"
                          style={{
                            position: "absolute",
                            top: "0.6rem",
                            left: "0.6rem",
                          }}
                        >
                          Before
                        </span>
                      </div>
                      <div
                        className="dp-zoom"
                        style={{
                          position: "relative",
                          aspectRatio: "1",
                          background: "var(--dp-ink)",
                        }}
                      >
                        {order.afterImage && (
                          <Image
                            src={order.afterImage}
                            alt={`${order.title} result`}
                            fill
                            sizes="20vw"
                            className="object-cover"
                          />
                        )}
                        <span
                          className="dp-tag"
                          style={{
                            position: "absolute",
                            top: "0.6rem",
                            left: "0.6rem",
                            color: "var(--dp-cream)",
                            borderBottomColor: "var(--dp-ember)",
                          }}
                        >
                          After
                        </span>
                      </div>
                    </div>
                    <p
                      className="dp-sans"
                      style={{
                        marginTop: "1rem",
                        fontSize: "0.85rem",
                        color: "var(--dp-sand)",
                      }}
                    >
                      {order.title}
                    </p>
                    <p
                      className="dp-label"
                      style={{ marginTop: "0.4rem", color: "var(--dp-ember)" }}
                    >
                      View process →
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            §7  CLOSING CTA
        ══════════════════════════════════════════════════════════ */}
        <section
          className="dp-grain relative"
          style={{
            background: "var(--dp-charcoal)",
            borderTop: "1px solid var(--dp-border)",
            padding: "7rem 1.5rem",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          <span
            className="dp-wordmark"
            style={{
              position: "absolute",
              fontSize: "clamp(8rem, 24vw, 20rem)",
              color: "rgba(242,232,213,0.035)",
              lineHeight: 1,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            D&apos;Footprint
          </span>

          <div style={{ position: "relative", zIndex: 10 }}>
            <p className="dp-label" style={{ marginBottom: "1.25rem" }}>
              Start something special
            </p>
            <h2
              className="dp-serif"
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3.6rem)",
                fontWeight: 500,
                fontStyle: "italic",
                color: "var(--dp-cream)",
                maxWidth: 640,
                margin: "0 auto 2.5rem",
                lineHeight: 1.3,
              }}
            >
              Can&apos;t find what you&apos;re looking for? Let us craft it
              for you.
            </h2>
            <Link href="/custom-orders" className="dp-btn-ghost">
              Order a Custom Pair
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
