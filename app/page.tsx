import { Carousel } from "components/carousel";
import { ThreeItemGrid } from "components/grid/three-items";
import HeroCarousel from "components/home/hero-carousel";
import Footer from "components/layout/footer";
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

const offerCopy = [
  {
    label: "Featured drop",
    description: "Handcrafted pairs ready for quick checkout.",
  },
  {
    label: "Everyday staples",
    description: "Slides and slippers built for daily comfort.",
  },
  {
    label: "Signature style",
    description: "Distinctive details, made by hand.",
  },
];

const USP_ITEMS = [
  {
    icon: "✺",
    label: "Handcrafted",
    desc: "Every pair made by skilled artisans",
  },
  {
    icon: "◈",
    label: "Premium Materials",
    desc: "Only the finest leathers & fabrics",
  },
  { icon: "⟡", label: "Custom Orders", desc: "Bespoke designs just for you" },
  { icon: "⊛", label: "Nationwide Delivery", desc: "Across all of Nigeria" },
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

  const featuredProducts = latestProducts.slice(0, 10);
  const bestSellers = trendingProducts.slice(0, 4);
  const visibleCollections = collectionsWithProducts
    .filter((item) => item.products.length > 0)
    .slice(0, 6);
  const heroProducts = latestProducts
    .filter((product) => product.featuredImage?.url)
    .slice(0, 5);
  const heroPicks = featuredProducts
    .filter((product) => product.featuredImage?.url)
    .slice(0, 2);
  const offerProducts = trendingProducts
    .filter((product) => product.featuredImage?.url)
    .slice(0, 3);

  return (
    <>
      {/* ─── FONTS + GLOBAL TOKENS ─────────────────────────────────────── */}
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

        .dp-wordmark   { font-family: var(--font-bebas-neue), sans-serif; }
        .dp-serif      { font-family: var(--font-cormorant-garamond), serif; }
        .dp-sans       { font-family: var(--font-dm-sans), sans-serif; }

        /* ── Marquee ── */
        @keyframes dp-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .dp-marquee { animation: dp-marquee 32s linear infinite; }

        /* ── Hero fade-up ── */
        @keyframes dp-rise {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dp-rise-1 { animation: dp-rise 1s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .dp-rise-2 { animation: dp-rise 1s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .dp-rise-3 { animation: dp-rise 1s cubic-bezier(0.16,1,0.3,1) 0.32s both; }
        .dp-rise-4 { animation: dp-rise 1s cubic-bezier(0.16,1,0.3,1) 0.46s both; }

        /* ── Card lift ── */
        .dp-lift {
          transition: transform 0.55s cubic-bezier(0.16,1,0.3,1),
                      box-shadow 0.55s cubic-bezier(0.16,1,0.3,1);
        }
        .dp-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.45);
        }

        /* ── Image zoom ── */
        .dp-zoom { overflow: hidden; }
        .dp-zoom img { transition: transform 0.7s cubic-bezier(0.16,1,0.3,1); }
        .dp-zoom:hover img { transform: scale(1.07); }

        /* ── Buttons ── */
        .dp-btn-solid {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: var(--dp-cream); color: var(--dp-ink);
          font-family: var(--font-dm-sans), sans-serif; font-weight: 500;
          font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 0.9rem 2.1rem; text-decoration: none;
          transition: background 0.22s, color 0.22s;
        }
        .dp-btn-solid:hover { background: var(--dp-ember); color: var(--dp-cream); }

        .dp-btn-ghost {
          display: inline-flex; align-items: center; gap: 0.5rem;
          border: 1px solid rgba(242,232,213,0.28); color: var(--dp-cream);
          font-family: var(--font-dm-sans), sans-serif; font-weight: 500;
          font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 0.9rem 2.1rem; text-decoration: none;
          transition: border-color 0.22s, background 0.22s;
        }
        .dp-btn-ghost:hover { border-color: var(--dp-cream); background: rgba(242,232,213,0.06); }

        .dp-btn-ember {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: var(--dp-ember); color: var(--dp-cream);
          font-family: var(--font-dm-sans), sans-serif; font-weight: 500;
          font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 0.9rem 2.1rem; text-decoration: none;
          transition: opacity 0.22s;
        }
        .dp-btn-ember:hover { opacity: 0.88; }

        /* ── Misc ── */
        .dp-rule  { border: none; border-top: 1px solid var(--dp-border); }
        .dp-label { font-family:var(--font-dm-sans),sans-serif; font-size:0.62rem; font-weight:500; letter-spacing:0.26em; text-transform:uppercase; color:var(--dp-ember); }
        .dp-nav-link { color: var(--dp-muted); text-decoration: none; transition: color 0.2s; }
        .dp-nav-link:hover { color: var(--dp-cream); }
        .dp-h2    { font-family:var(--font-cormorant-garamond),serif; font-weight:600; color:var(--dp-cream); }
        .dp-num   { font-family:var(--font-bebas-neue),sans-serif; font-size:5.5rem; line-height:1; color:rgba(242,232,213,0.05); position:absolute; top:0.25rem; left:0.75rem; pointer-events:none; user-select:none; }

        /* Quick-view hover chip */
        .dp-qv { position:absolute; inset:0; display:flex; align-items:flex-end; padding:0.9rem; opacity:0; background:rgba(6,4,2,0.45); transition:opacity 0.3s; }
        .dp-zoom:hover .dp-qv { opacity:1; }
        .dp-qv-label { font-family:var(--font-dm-sans),sans-serif; font-size:0.6rem; font-weight:500; letter-spacing:0.15em; text-transform:uppercase; color:var(--dp-cream); border-bottom:1px solid var(--dp-ember); padding-bottom:2px; }

        /* Before/After pill */
        .dp-pill { position:absolute; top:0.5rem; left:0.5rem; font-family:var(--font-dm-sans),sans-serif; font-size:0.5rem; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; padding:2px 7px; }

        /* Noise grain */
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
            §1  HERO
        ══════════════════════════════════════════════════════════ */}
        <section
          className="dp-grain relative overflow-hidden"
          style={{ background: "var(--dp-ink)" }}
        >
          {/* Atmospheric glow */}
          <div
            className="pointer-events-none absolute"
            style={{
              width: 700,
              height: 700,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(191,90,40,0.16) 0%, transparent 68%)",
              right: -120,
              top: -180,
              filter: "blur(80px)",
            }}
          />
          <div
            className="pointer-events-none absolute"
            style={{
              width: 400,
              height: 400,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(192,137,42,0.1) 0%, transparent 70%)",
              left: "10%",
              bottom: -60,
              filter: "blur(60px)",
            }}
          />

          <div
            className="relative mx-auto px-6 pt-14 pb-0 md:px-10 lg:px-16"
            style={{ maxWidth: 1800, zIndex: 10 }}
          >
            {/* Sub-header bar */}
            <div className="dp-rise-1 mb-8 flex items-center justify-between">
              <span className="dp-label" style={{ color: "var(--dp-muted)" }}>
                Est. in Nigeria · Handcrafted Since Day One
              </span>
              <nav className="hidden md:flex items-center gap-8">
                {["Shop All", "Collections", "Custom Orders"].map((item) => (
                  <Link
                    key={item}
                    href={
                      item === "Shop All"
                        ? "/products"
                        : item === "Collections"
                          ? "/products"
                          : "/custom-orders"
                    }
                    className="dp-label dp-nav-link"
                  >
                    {item}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Giant wordmark */}
            <div
              className="dp-wordmark dp-rise-2"
              style={{
                fontSize: "clamp(4.5rem, 13vw, 12rem)",
                lineHeight: 0.88,
                letterSpacing: "-0.01em",
                display: "flex",
                flexWrap: "wrap",
                gap: "0 0.4em",
              }}
            >
              <span style={{ color: "var(--dp-cream)" }}>D&apos;FOOT</span>
              <span
                style={{
                  WebkitTextStroke: "1.5px rgba(242,232,213,0.25)",
                  color: "transparent",
                }}
              >
                PRINT
              </span>
            </div>

            {/* Hero body grid */}
            <div className="dp-rise-3 mt-10 grid gap-8 lg:grid-cols-2 lg:gap-0 lg:items-end">
              {/* Left column: tagline + CTAs + quick picks */}
              <div className="space-y-8 pb-14">
                <p
                  className="dp-serif"
                  style={{
                    fontSize: "clamp(1.35rem, 2.8vw, 2.1rem)",
                    fontWeight: 300,
                    fontStyle: "italic",
                    lineHeight: 1.4,
                    color: "var(--dp-sand)",
                    maxWidth: 500,
                  }}
                >
                  Where every stitch tells a story and every sole carries you
                  further.
                </p>

                <div className="flex flex-wrap gap-3">
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
                  <Link href="/custom-orders" className="dp-btn-ghost">
                    Custom Orders
                  </Link>
                </div>

                {heroPicks.length > 0 && (
                  <div style={{ paddingTop: "0.75rem" }}>
                    <p className="dp-label mb-4">Quick picks</p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      {heroPicks.map((product) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.handle}`}
                          className="dp-lift group"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.875rem",
                            background: "var(--dp-card)",
                            border: "1px solid var(--dp-border)",
                            padding: "0.75rem",
                            textDecoration: "none",
                          }}
                        >
                          <div
                            className="dp-zoom"
                            style={{
                              position: "relative",
                              width: 60,
                              height: 60,
                              flexShrink: 0,
                              background: "var(--dp-charcoal)",
                            }}
                          >
                            {product.featuredImage?.url && (
                              <Image
                                src={product.featuredImage.url}
                                alt={product.title}
                                fill
                                sizes="60px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p
                              className="line-clamp-1"
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--dp-sand)",
                                fontFamily: "var(--font-dm-sans), sans-serif",
                              }}
                            >
                              {product.title}
                            </p>
                            <Price
                              amount={product.priceRange.maxVariantPrice.amount}
                              currencyCode={
                                product.priceRange.maxVariantPrice.currencyCode
                              }
                              currencyCodeClassName="hidden"
                              className="dp-wordmark"
                              style={
                                {
                                  fontSize: "0.9rem",
                                  color: "var(--dp-gold)",
                                } as React.CSSProperties
                              }
                            />
                          </div>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="none"
                            style={{ flexShrink: 0, color: "var(--dp-muted)" }}
                          >
                            <path
                              d="M3 8h10M9 4l4 4-4 4"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: hero carousel, bleeds to bottom */}
              <div style={{ position: "relative", minHeight: 500 }}>
                <HeroCarousel products={heroProducts} />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            §2  MARQUEE STRIP
        ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: "var(--dp-ember)",
            padding: "0.8rem 0",
            overflow: "hidden",
          }}
        >
          <div
            className="dp-marquee"
            style={{
              display: "flex",
              whiteSpace: "nowrap",
              alignItems: "center",
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={i}
                className="dp-wordmark"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1.5rem",
                  paddingRight: "1.5rem",
                  fontSize: "1rem",
                  letterSpacing: "0.14em",
                  color: "var(--dp-cream)",
                }}
              >
                <span>HANDCRAFTED IN NIGERIA</span>
                <span
                  style={{
                    color: "rgba(242,232,213,0.45)",
                    fontSize: "0.7rem",
                  }}
                >
                  ✦
                </span>
                <span>PREMIUM SLIPPERS &amp; SLIDES</span>
                <span
                  style={{
                    color: "rgba(242,232,213,0.45)",
                    fontSize: "0.7rem",
                  }}
                >
                  ✦
                </span>
                <span>CUSTOM ORDERS WELCOME</span>
                <span
                  style={{
                    color: "rgba(242,232,213,0.45)",
                    fontSize: "0.7rem",
                  }}
                >
                  ✦
                </span>
                <span>NATIONWIDE DELIVERY</span>
                <span
                  style={{
                    color: "rgba(242,232,213,0.45)",
                    fontSize: "0.7rem",
                  }}
                >
                  ✦
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            §3  EDITORIAL OFFER CARDS
        ══════════════════════════════════════════════════════════ */}
        {offerProducts.length > 0 && (
          <section
            className="mx-auto"
            style={{
              maxWidth: 1800,
              padding: "4rem 1.5rem 3rem",
              paddingLeft: "clamp(1.5rem, 4vw, 4rem)",
              paddingRight: "clamp(1.5rem, 4vw, 4rem)",
            }}
          >
            <div
              style={{
                marginBottom: "1.75rem",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p className="dp-label" style={{ marginBottom: "0.5rem" }}>
                  Latest drops
                </p>
                <h2
                  className="dp-h2 dp-serif"
                  style={{
                    fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                    fontWeight: 600,
                  }}
                >
                  Just Landed
                </h2>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: "0.75rem",
                gridTemplateColumns: "repeat(3, 1fr)",
              }}
            >
              {offerProducts.map((product, index) => {
                const offer = offerCopy[index % offerCopy.length];
                const isBig = index === 0;
                return offer ? (
                  <Link
                    key={product.id}
                    href={`/product/${product.handle}`}
                    className="dp-zoom dp-lift"
                    style={{
                      position: "relative",
                      display: "block",
                      aspectRatio: isBig ? "2/3" : "3/4",
                      textDecoration: "none",
                      gridRow: isBig ? "1 / 3" : undefined,
                      overflow: "hidden",
                    }}
                  >
                    {product.featuredImage?.url && (
                      <Image
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText || product.title}
                        fill
                        sizes="(min-width: 1280px) 35vw, 80vw"
                        className="object-cover"
                        style={{ filter: "brightness(0.72)" }}
                      />
                    )}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(6,4,2,0.92) 0%, rgba(6,4,2,0.25) 55%, transparent 100%)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "1.5rem",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                      }}
                    >
                      <p
                        className="dp-label"
                        style={{ marginBottom: "0.5rem" }}
                      >
                        {offer.label}
                      </p>
                      <h3
                        className="dp-serif"
                        style={{
                          fontSize: isBig
                            ? "clamp(1.4rem, 2.5vw, 2rem)"
                            : "1.1rem",
                          fontWeight: 600,
                          color: "var(--dp-cream)",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {product.title}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--dp-sand)",
                          marginBottom: "0.875rem",
                          fontFamily: "var(--font-dm-sans), sans-serif",
                          lineHeight: 1.55,
                        }}
                      >
                        {offer.description}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Price
                          amount={product.priceRange.maxVariantPrice.amount}
                          currencyCode={
                            product.priceRange.maxVariantPrice.currencyCode
                          }
                          currencyCodeClassName="hidden"
                          className="dp-wordmark"
                          style={
                            {
                              fontSize: "1.15rem",
                              color: "var(--dp-gold)",
                            } as React.CSSProperties
                          }
                        />
                        <span
                          style={{
                            fontSize: "0.62rem",
                            fontFamily: "var(--font-dm-sans), sans-serif",
                            fontWeight: 500,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "var(--dp-cream)",
                            borderBottom: "1px solid var(--dp-ember)",
                            paddingBottom: 2,
                          }}
                        >
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : null;
              })}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            §4  THREE ITEM GRID + CAROUSEL (existing components, wrapped)
        ══════════════════════════════════════════════════════════ */}
        <hr className="dp-rule mx-6 md:mx-10 lg:mx-16" />
        <div className="mt-8">
          <ThreeItemGrid />
        </div>
        <Carousel />

        {/* ══════════════════════════════════════════════════════════
            §5  NEW ARRIVALS
        ══════════════════════════════════════════════════════════ */}
        <section
          className="mx-auto"
          style={{
            maxWidth: 1800,
            padding: "4rem clamp(1.5rem, 4vw, 4rem)",
          }}
        >
          <div
            style={{
              marginBottom: "2.5rem",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p className="dp-label" style={{ marginBottom: "0.5rem" }}>
                Just dropped
              </p>
              <h2
                className="dp-h2 dp-serif"
                style={{
                  fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                  fontWeight: 600,
                }}
              >
                New Arrivals
              </h2>
            </div>
            <Link href="/products?sort=latest-desc" className="dp-btn-ghost">
              View all
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.75rem",
            }}
            className="sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.handle}`}
                className="dp-lift group"
                style={{ display: "block", textDecoration: "none" }}
              >
                <div
                  className="dp-zoom"
                  style={{
                    position: "relative",
                    aspectRatio: "3/4",
                    background: "var(--dp-charcoal)",
                  }}
                >
                  {product.featuredImage?.url && (
                    <Image
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText || product.title}
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 640px) 30vw, 50vw"
                      className="object-cover"
                    />
                  )}
                  <div className="dp-qv">
                    <span className="dp-qv-label">Quick View</span>
                  </div>
                </div>
                <div style={{ marginTop: "0.75rem", padding: "0 0.25rem" }}>
                  <p
                    className="line-clamp-2"
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--dp-sand)",
                      fontFamily: "var(--font-dm-sans), sans-serif",
                      lineHeight: 1.4,
                      marginBottom: "0.25rem",
                    }}
                  >
                    {product.title}
                  </p>
                  <Price
                    amount={product.priceRange.maxVariantPrice.amount}
                    currencyCode={
                      product.priceRange.maxVariantPrice.currencyCode
                    }
                    currencyCodeClassName="hidden"
                    className="dp-wordmark"
                    style={
                      {
                        fontSize: "0.95rem",
                        color: "var(--dp-cream)",
                      } as React.CSSProperties
                    }
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            §6  BEST SELLERS
        ══════════════════════════════════════════════════════════ */}
        {bestSellers.length > 0 && (
          <section
            style={{ background: "var(--dp-charcoal)", padding: "4rem 0" }}
          >
            <div
              className="mx-auto"
              style={{ maxWidth: 1800, padding: "0 clamp(1.5rem, 4vw, 4rem)" }}
            >
              <div
                style={{
                  marginBottom: "2.5rem",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p className="dp-label" style={{ marginBottom: "0.5rem" }}>
                    Most loved
                  </p>
                  <h2
                    className="dp-h2 dp-serif"
                    style={{
                      fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                      fontWeight: 600,
                    }}
                  >
                    Best Sellers
                  </h2>
                </div>
                <Link
                  href="/products?sort=best-selling"
                  className="dp-btn-ghost"
                >
                  Shop all
                </Link>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "0.75rem",
                }}
                className="lg:grid-cols-4"
              >
                {bestSellers.map((product, i) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.handle}`}
                    className="dp-lift group"
                    style={{
                      position: "relative",
                      display: "block",
                      background: "var(--dp-ink)",
                      padding: "1rem",
                      textDecoration: "none",
                    }}
                  >
                    <span className="dp-num">0{i + 1}</span>
                    <div
                      className="dp-zoom"
                      style={{
                        position: "relative",
                        aspectRatio: "4/5",
                        background: "var(--dp-charcoal)",
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
                    <div style={{ marginTop: "1rem" }}>
                      <p
                        className="line-clamp-2"
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--dp-sand)",
                          fontFamily: "var(--font-dm-sans), sans-serif",
                          marginBottom: "0.4rem",
                        }}
                      >
                        {product.title}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Price
                          amount={product.priceRange.maxVariantPrice.amount}
                          currencyCode={
                            product.priceRange.maxVariantPrice.currencyCode
                          }
                          currencyCodeClassName="hidden"
                          className="dp-wordmark"
                          style={
                            {
                              fontSize: "1rem",
                              color: "var(--dp-gold)",
                            } as React.CSSProperties
                          }
                        />
                        <span
                          style={{
                            fontSize: "0.6rem",
                            fontFamily: "var(--font-dm-sans), sans-serif",
                            fontWeight: 500,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "var(--dp-ember)",
                          }}
                        >
                          Shop →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            §7  USP STRIP
        ══════════════════════════════════════════════════════════ */}
        <section
          className="mx-auto"
          style={{ maxWidth: 1800, padding: "3.5rem clamp(1.5rem, 4vw, 4rem)" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "1.5rem 3rem",
            }}
            className="md:grid-cols-4"
          >
            {USP_ITEMS.map(({ icon, label, desc }) => (
              <div
                key={label}
                style={{
                  borderTop: "1px solid var(--dp-border)",
                  paddingTop: "1.25rem",
                }}
              >
                <span
                  style={{
                    fontSize: "1.3rem",
                    color: "var(--dp-ember)",
                    display: "block",
                    marginBottom: "0.6rem",
                  }}
                >
                  {icon}
                </span>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontWeight: 500,
                    fontSize: "0.82rem",
                    color: "var(--dp-cream)",
                    letterSpacing: "0.06em",
                    marginBottom: "0.35rem",
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: "0.72rem",
                    color: "var(--dp-muted)",
                    lineHeight: 1.55,
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <hr className="dp-rule mx-6 md:mx-10 lg:mx-16" />

        {/* ══════════════════════════════════════════════════════════
            §8  COLLECTIONS
        ══════════════════════════════════════════════════════════ */}
        <section
          className="mx-auto"
          style={{ maxWidth: 1800, padding: "4rem clamp(1.5rem, 4vw, 4rem)" }}
        >
          <div
            style={{
              marginBottom: "2.5rem",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p className="dp-label" style={{ marginBottom: "0.5rem" }}>
                Explore
              </p>
              <h2
                className="dp-h2 dp-serif"
                style={{
                  fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                  fontWeight: 600,
                }}
              >
                Collections
              </h2>
            </div>
            <Link href="/products" className="dp-btn-ghost">
              Browse all
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gap: "0.75rem",
              gridTemplateColumns: "repeat(3, 1fr)",
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
                      aspectRatio: isFeature ? "16/10" : "4/3",
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
                        style={{ filter: "brightness(0.65)" }}
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
                          "linear-gradient(135deg, rgba(6,4,2,0.82) 0%, rgba(6,4,2,0.15) 65%)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "clamp(1.25rem, 3vw, 2.25rem)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                      }}
                    >
                      <p
                        className="dp-label"
                        style={{ marginBottom: "0.5rem" }}
                      >
                        {colProducts.length} items
                      </p>
                      <h3
                        className="dp-serif"
                        style={{
                          fontSize: isFeature
                            ? "clamp(1.6rem, 3.5vw, 2.6rem)"
                            : "1.4rem",
                          fontWeight: 600,
                          color: "var(--dp-cream)",
                        }}
                      >
                        {collection.title}
                      </h3>
                      {collection.description && (
                        <p
                          className="line-clamp-2"
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--dp-sand)",
                            marginTop: "0.5rem",
                            maxWidth: 480,
                            fontFamily: "var(--font-dm-sans), sans-serif",
                            lineHeight: 1.55,
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

        {/* ══════════════════════════════════════════════════════════
            §9  CUSTOM ORDERS
        ══════════════════════════════════════════════════════════ */}
        {customOrderRows.length > 0 && (
          <section style={{ background: "var(--dp-void)", padding: "4rem 0" }}>
            <div
              className="mx-auto"
              style={{ maxWidth: 1800, padding: "0 clamp(1.5rem, 4vw, 4rem)" }}
            >
              <div
                style={{
                  marginBottom: "2.5rem",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p className="dp-label" style={{ marginBottom: "0.5rem" }}>
                    Bespoke
                  </p>
                  <h2
                    className="dp-h2 dp-serif"
                    style={{
                      fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                      fontWeight: 600,
                    }}
                  >
                    Custom Work
                  </h2>
                </div>
                <Link href="/custom-orders" className="dp-btn-ember">
                  Request yours
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

              <div
                style={{
                  display: "grid",
                  gap: "0.75rem",
                  gridTemplateColumns: "repeat(1, 1fr)",
                }}
                className="md:grid-cols-3"
              >
                {customOrderRows.map((order) => (
                  <Link
                    key={order.id}
                    href={`/custom-orders#order-${order.id}`}
                    className="dp-lift group"
                    style={{
                      display: "block",
                      background: "var(--dp-card)",
                      padding: "1rem",
                      textDecoration: "none",
                      border: "1px solid var(--dp-border)",
                    }}
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
                          background: "var(--dp-charcoal)",
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
                          className="dp-pill dp-label"
                          style={{
                            background: "rgba(6,4,2,0.72)",
                            color: "var(--dp-sand)",
                            fontSize: "0.5rem",
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
                          background: "var(--dp-charcoal)",
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
                          className="dp-pill dp-label"
                          style={{
                            background: "rgba(191,90,40,0.85)",
                            color: "var(--dp-cream)",
                            fontSize: "0.5rem",
                          }}
                        >
                          After
                        </span>
                      </div>
                    </div>
                    <p
                      style={{
                        marginTop: "0.875rem",
                        fontSize: "0.8rem",
                        fontFamily: "var(--font-dm-sans), sans-serif",
                        color: "var(--dp-sand)",
                      }}
                    >
                      {order.title}
                    </p>
                    <p
                      className="dp-label"
                      style={{ marginTop: "0.3rem", color: "var(--dp-ember)" }}
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
            §10  FULL-WIDTH CTA BANNER
        ══════════════════════════════════════════════════════════ */}
        <section
          style={{
            background: "var(--dp-ember)",
            padding: "5rem 1.5rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative wordmark behind */}
          <span
            className="dp-wordmark"
            style={{
              position: "absolute",
              fontSize: "clamp(8rem, 25vw, 22rem)",
              color: "rgba(0,0,0,0.12)",
              lineHeight: 1,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            D&apos;FOOTPRINT
          </span>

          <div style={{ position: "relative", zIndex: 10 }}>
            <p
              className="dp-label"
              style={{ color: "rgba(242,232,213,0.55)", marginBottom: "1rem" }}
            >
              Start something special
            </p>
            <h2
              className="dp-serif"
              style={{
                fontSize: "clamp(1.8rem, 4vw, 3.5rem)",
                fontWeight: 600,
                color: "var(--dp-cream)",
                maxWidth: 640,
                margin: "0 auto 2rem",
                lineHeight: 1.25,
              }}
            >
              Can&apos;t find what you&apos;re looking for? Let us craft it for
              you.
            </h2>
            <Link
              href="/custom-orders"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                background: "var(--dp-cream)",
                color: "var(--dp-ember)",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontWeight: 500,
                fontSize: "0.72rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "1rem 2.5rem",
                textDecoration: "none",
                transition: "background 0.22s",
              }}
            >
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