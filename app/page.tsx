import Footer from "components/layout/footer";
import Media from "components/home/media";
import Price from "components/price";
import {
  getCollectionsWithProducts,
  getProducts,
  getPublishedCustomOrders,
} from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
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

/* ────────────────────────────────────────────────────────────────
   EDITORIAL CONTENT
   Everything below is image-first. Each slot has an `imageUrl` that
   is intentionally left blank so a branded MOCK placeholder shows
   while you design. Drop in your own URL to go live — nothing else
   needs to change.
   ──────────────────────────────────────────────────────────────── */

// Full-bleed cinematic hero — a single photograph, no carousel.
const HERO = {
  // Demo photo (Unsplash, free for commercial use) — swap for your own.
  imageUrl:
    "https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=1600&q=80&auto=format&fit=crop", // ← portrait / hero pair photograph (shot tall, 4:5 or taller)
  caption: "Hero photograph — a model or signature pair, shot full-bleed.",
  kicker: "Handcrafted in Nigeria · Est. Day One",
  tagline:
    "Where every stitch tells a story and every sole carries you further.",
};

// Brand-story split — atelier / hands-at-work imagery.
const STORY = {
  // Demo photo (Unsplash, free for commercial use) — swap for your own.
  imageUrl:
    "https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=1600&q=80&auto=format&fit=crop", // ← atelier, leather, or hands-crafting photograph (portrait)
  caption: "The craft — hands, leather, and the making of a pair.",
  kicker: "The Craft",
  title: "Made by hand, meant to last.",
  body: "Every D'FOOTPRINT pair is cut, stitched, and finished by skilled artisans — no factory line, no shortcuts. Premium leathers and fabrics, chosen for how they wear over years, not seasons.",
};

// Wide statement image that opens the custom-order section.
const CUSTOM_HERO = {
  // Demo photo (Unsplash, free for commercial use) — swap for your own.
  imageUrl:
    "https://images.unsplash.com/photo-1595065666634-4725aa7e8379?w=1600&q=80&auto=format&fit=crop", // ← wide, cinematic bespoke shot (landscape 21:9-ish)
  caption: "Bespoke statement image — a finished custom pair, up close.",
};

// Closing full-bleed call-to-action banner.
const CTA = {
  // Demo photo (Unsplash, free for commercial use) — swap for your own.
  imageUrl:
    "https://images.unsplash.com/photo-1536303158031-c868b371399f?w=1600&q=80&auto=format&fit=crop", // ← closing lifestyle / product banner (landscape)
  caption: "Closing banner — an aspirational lifestyle or product shot.",
};

const LOOKBOOK_COPY = [
  { label: "Featured drop", description: "Handcrafted pairs, ready to ship." },
  { label: "Everyday staples", description: "Built for daily comfort." },
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
  { icon: "⟡", label: "Custom Orders", desc: "Bespoke designs, just for you" },
  { icon: "⊛", label: "Nationwide Delivery", desc: "Across all of Nigeria" },
];

const ARROW = (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M3 8h10M9 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

  const lookbook = latestProducts.slice(0, 3);
  const newArrivals = latestProducts.slice(0, 10);
  const bestSellers = trendingProducts.slice(0, 4);
  const trending = trendingProducts.slice(0, 8);
  const visibleCollections = collectionsWithProducts
    .filter((item) => item.products.length > 0)
    .slice(0, 5);

  return (
    <>
      {/* ─── GLOBAL TOKENS + UTILITIES ─────────────────────────────── */}
      <style>{`
        :root {
          --dp-void:    #060402;
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

        .dp-wordmark { font-family: var(--font-bebas-neue), sans-serif; }
        .dp-serif    { font-family: var(--font-cormorant-garamond), serif; }
        .dp-sans     { font-family: var(--font-dm-sans), sans-serif; }

        .dp-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem; font-weight: 500;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: var(--dp-ember);
        }
        .dp-h2 {
          font-family: var(--font-cormorant-garamond), serif;
          font-weight: 600; color: var(--dp-cream);
          font-size: clamp(1.9rem, 3.6vw, 3.1rem); line-height: 1.05;
        }
        .dp-rule { border: none; border-top: 1px solid var(--dp-border); }
        .dp-nav-link { color: rgba(242,232,213,0.7); text-decoration: none; transition: color 0.2s; }
        .dp-nav-link:hover { color: var(--dp-cream); }

        /* Buttons */
        .dp-btn-solid, .dp-btn-ghost, .dp-btn-ember {
          display: inline-flex; align-items: center; gap: 0.55rem;
          font-family: var(--font-dm-sans), sans-serif; font-weight: 500;
          font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 0.95rem 2.15rem; text-decoration: none;
          transition: background 0.22s, color 0.22s, border-color 0.22s, opacity 0.22s;
        }
        .dp-btn-solid { background: var(--dp-cream); color: var(--dp-ink); }
        .dp-btn-solid:hover { background: var(--dp-ember); color: var(--dp-cream); }
        .dp-btn-ghost { border: 1px solid rgba(242,232,213,0.28); color: var(--dp-cream); }
        .dp-btn-ghost:hover { border-color: var(--dp-cream); background: rgba(242,232,213,0.06); }
        .dp-btn-ember { background: var(--dp-ember); color: var(--dp-cream); }
        .dp-btn-ember:hover { opacity: 0.88; }

        /* Image-first primitives */
        .dp-frame { position: relative; overflow: hidden; background: var(--dp-charcoal); }
        .dp-zoom img, .dp-zoom > div[role="img"] { transition: transform 0.8s cubic-bezier(0.16,1,0.3,1); }
        .dp-zoom:hover img, .dp-zoom:hover > div[role="img"] { transform: scale(1.06); }
        .dp-lift { transition: transform 0.5s cubic-bezier(0.16,1,0.3,1); }
        .dp-lift:hover { transform: translateY(-4px); }
        .dp-scrim-b { position:absolute; inset:0; background: linear-gradient(to top, rgba(6,4,2,0.94) 0%, rgba(6,4,2,0.30) 48%, transparent 82%); }
        .dp-num { font-family: var(--font-bebas-neue), sans-serif; font-size: 4.5rem; line-height: 1; color: rgba(242,232,213,0.10); }

        .dp-qv { position:absolute; inset:0; display:flex; align-items:flex-end; padding:0.9rem; opacity:0; background:rgba(6,4,2,0.35); transition:opacity 0.3s; }
        .dp-zoom:hover .dp-qv { opacity:1; }
        .dp-qv-label { font-family:var(--font-dm-sans),sans-serif; font-size:0.6rem; font-weight:500; letter-spacing:0.15em; text-transform:uppercase; color:var(--dp-cream); border-bottom:1px solid var(--dp-ember); padding-bottom:2px; }

        .dp-pill { position:absolute; top:0.6rem; left:0.6rem; font-family:var(--font-dm-sans),sans-serif; font-size:0.5rem; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; padding:3px 8px; }

        /* Horizontal snap row */
        .dp-scroller { display:flex; gap:0.75rem; overflow-x:auto; scroll-snap-type:x mandatory; scrollbar-width:none; -ms-overflow-style:none; padding-bottom:0.5rem; }
        .dp-scroller::-webkit-scrollbar { display:none; }
        .dp-scroller > * { scroll-snap-align:start; flex:0 0 auto; }

        /* Marquee ribbon */
        @keyframes dp-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .dp-marquee { animation: dp-marquee 40s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .dp-marquee { animation: none; } }

        @keyframes dp-rise { from { opacity:0; transform:translateY(26px);} to { opacity:1; transform:translateY(0);} }
        .dp-rise-1 { animation: dp-rise 1s cubic-bezier(0.16,1,0.3,1) 0.10s both; }
        .dp-rise-2 { animation: dp-rise 1s cubic-bezier(0.16,1,0.3,1) 0.24s both; }
        .dp-rise-3 { animation: dp-rise 1s cubic-bezier(0.16,1,0.3,1) 0.40s both; }
        @media (prefers-reduced-motion: reduce) { .dp-rise-1,.dp-rise-2,.dp-rise-3 { animation:none; } }
      `}</style>

      <div
        className="dp-sans"
        style={{ background: "var(--dp-ink)", color: "var(--dp-cream)" }}
      >
        {/* ══════════════════════════════════════════════════════════
            §1  HERO — full-bleed photograph, no carousel
        ══════════════════════════════════════════════════════════ */}
        <section
          className="dp-frame dp-zoom"
          style={{
            minHeight: "clamp(600px, 92vh, 1040px)",
            display: "flex",
          }}
        >
          <Media
            src={HERO.imageUrl}
            alt="D'FOOTPRINT handcrafted footwear"
            caption={HERO.caption}
            sizes="100vw"
            priority
            tone={0}
            brightness={0.78}
          />

          {/* top nav bar over the image */}
          <div
            className="dp-rise-1"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1.6rem clamp(1.5rem, 4vw, 4rem)",
            }}
          >
            <span
              className="dp-label"
              style={{ color: "rgba(242,232,213,0.7)" }}
            >
              {HERO.kicker}
            </span>
            <nav className="hidden items-center gap-8 md:flex">
              <Link href="/products" className="dp-label dp-nav-link">
                Shop All
              </Link>
              <Link href="/products" className="dp-label dp-nav-link">
                Collections
              </Link>
              <Link href="/custom-orders" className="dp-label dp-nav-link">
                Custom Orders
              </Link>
            </nav>
          </div>

          <div className="dp-scrim-b" style={{ zIndex: 10 }} />

          {/* hero copy, bottom-left */}
          <div
            style={{
              position: "relative",
              zIndex: 15,
              marginTop: "auto",
              width: "100%",
              padding: "clamp(2rem, 5vw, 4.5rem) clamp(1.5rem, 4vw, 4rem)",
            }}
          >
            <div style={{ maxWidth: 1800, marginInline: "auto" }}>
              <h1
                className="dp-wordmark dp-rise-2"
                style={{
                  fontSize: "clamp(3.6rem, 12vw, 11rem)",
                  lineHeight: 0.86,
                  letterSpacing: "-0.01em",
                  display: "flex",
                  flexWrap: "wrap",
                  columnGap: "0.4em",
                  margin: 0,
                }}
              >
                <span style={{ color: "var(--dp-cream)" }}>D&apos;FOOT</span>
                <span
                  style={{
                    WebkitTextStroke: "1.5px rgba(242,232,213,0.55)",
                    color: "transparent",
                  }}
                >
                  PRINT
                </span>
              </h1>

              <div
                className="dp-rise-3"
                style={{
                  marginTop: "1.75rem",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: "2rem",
                }}
              >
                <p
                  className="dp-serif"
                  style={{
                    fontSize: "clamp(1.25rem, 2.6vw, 2rem)",
                    fontWeight: 300,
                    fontStyle: "italic",
                    lineHeight: 1.4,
                    color: "var(--dp-cream)",
                    maxWidth: 520,
                    margin: 0,
                  }}
                >
                  {HERO.tagline}
                </p>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}
                >
                  <Link href="/products" className="dp-btn-solid">
                    Shop Collection {ARROW}
                  </Link>
                  <Link href="/custom-orders" className="dp-btn-ghost">
                    Custom Orders
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            §2  MARQUEE RIBBON
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
            style={{ display: "flex", whiteSpace: "nowrap" }}
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
            §3  LOOKBOOK — asymmetric editorial image tiles
        ══════════════════════════════════════════════════════════ */}
        {lookbook.length > 0 && (
          <section
            className="mx-auto"
            style={{
              maxWidth: 1800,
              padding: "clamp(3.5rem,7vw,6rem) clamp(1.5rem,4vw,4rem) 3rem",
            }}
          >
            <SectionHead kicker="The Lookbook" title="Just Landed" />
            <div
              style={{ display: "grid", gap: "0.75rem" }}
              className="grid-cols-2 lg:grid-cols-3"
            >
              {lookbook.map((product, index) => {
                const copy = LOOKBOOK_COPY[index % LOOKBOOK_COPY.length]!;
                const isBig = index === 0;
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.handle}`}
                    className={`dp-frame dp-zoom dp-lift ${isBig ? "col-span-2 lg:col-span-1" : ""}`}
                    style={{
                      display: "block",
                      aspectRatio: isBig ? "16/13" : "4/5",
                      textDecoration: "none",
                    }}
                  >
                    <Media
                      src={product.featuredImage?.url}
                      alt={product.featuredImage?.altText || product.title}
                      caption={`${copy.label} — editorial product shot.`}
                      sizes="(min-width: 1024px) 33vw, 50vw"
                      brightness={0.82}
                      tone={index}
                    />
                    <div className="dp-scrim-b" />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "clamp(1.1rem,2.2vw,1.75rem)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                      }}
                    >
                      <p
                        className="dp-label"
                        style={{ marginBottom: "0.5rem" }}
                      >
                        {copy.label}
                      </p>
                      <h3
                        className="dp-serif"
                        style={{
                          fontSize: isBig
                            ? "clamp(1.4rem,2.4vw,2.1rem)"
                            : "1.15rem",
                          fontWeight: 600,
                          color: "var(--dp-cream)",
                          margin: 0,
                        }}
                      >
                        {product.title}
                      </h3>
                      <div
                        style={{
                          marginTop: "0.75rem",
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
                              fontSize: "1.2rem",
                              color: "var(--dp-gold)",
                            } as React.CSSProperties
                          }
                        />
                        <span
                          className="dp-label"
                          style={{ color: "var(--dp-cream)" }}
                        >
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            §4  BRAND STORY — full-height image + text split
        ══════════════════════════════════════════════════════════ */}
        <section
          className="mx-auto grid items-stretch gap-0 lg:grid-cols-2"
          style={{ maxWidth: 1800, padding: "0 clamp(1.5rem,4vw,4rem)" }}
        >
          <div
            className="dp-frame dp-zoom"
            style={{
              minHeight: "clamp(360px, 62vh, 720px)",
              aspectRatio: "auto",
            }}
          >
            <Media
              src={STORY.imageUrl}
              alt="D'FOOTPRINT atelier"
              caption={STORY.caption}
              sizes="(min-width: 1024px) 50vw, 100vw"
              tone={4}
              brightness={0.85}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "clamp(2.5rem,5vw,4.5rem)",
              background: "var(--dp-charcoal)",
            }}
          >
            <p className="dp-label" style={{ marginBottom: "1rem" }}>
              {STORY.kicker}
            </p>
            <h2 className="dp-h2 dp-serif" style={{ marginBottom: "1.25rem" }}>
              {STORY.title}
            </h2>
            <p
              style={{
                fontSize: "0.95rem",
                lineHeight: 1.75,
                color: "var(--dp-sand)",
                maxWidth: 460,
                marginBottom: "2rem",
              }}
            >
              {STORY.body}
            </p>
            <div>
              <Link href="/custom-orders" className="dp-btn-ghost">
                Discover the process {ARROW}
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            §5  NEW ARRIVALS — image-dominant product grid
        ══════════════════════════════════════════════════════════ */}
        {newArrivals.length > 0 && (
          <section
            className="mx-auto"
            style={{
              maxWidth: 1800,
              padding: "clamp(3.5rem,7vw,6rem) clamp(1.5rem,4vw,4rem) 3rem",
            }}
          >
            <SectionHead
              kicker="Just dropped"
              title="New Arrivals"
              action={{ href: "/products?sort=latest-desc", label: "View all" }}
            />
            <div
              style={{ display: "grid", gap: "0.75rem" }}
              className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
              {newArrivals.map((product, i) => (
                <ProductCard key={product.id} product={product} tone={i} />
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            §6  BEST SELLERS — ranked, image-first
        ══════════════════════════════════════════════════════════ */}
        {bestSellers.length > 0 && (
          <section
            style={{
              background: "var(--dp-charcoal)",
              padding: "clamp(3.5rem,7vw,6rem) 0",
            }}
          >
            <div
              className="mx-auto"
              style={{ maxWidth: 1800, padding: "0 clamp(1.5rem,4vw,4rem)" }}
            >
              <SectionHead
                kicker="Most loved"
                title="Best Sellers"
                action={{
                  href: "/products?sort=best-selling",
                  label: "Shop all",
                }}
              />
              <div
                style={{ display: "grid", gap: "0.75rem" }}
                className="grid-cols-2 lg:grid-cols-4"
              >
                {bestSellers.map((product, i) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.handle}`}
                    className="dp-lift group"
                    style={{ display: "block", textDecoration: "none" }}
                  >
                    <div
                      className="dp-frame dp-zoom"
                      style={{ aspectRatio: "4/5" }}
                    >
                      <Media
                        src={product.featuredImage?.url}
                        alt={product.featuredImage?.altText || product.title}
                        caption="Best-seller product shot."
                        sizes="(min-width: 1024px) 22vw, 50vw"
                        tone={i + 1}
                      />
                      <span
                        className="dp-num"
                        style={{
                          position: "absolute",
                          top: "0.5rem",
                          left: "0.85rem",
                        }}
                      >
                        0{i + 1}
                      </span>
                      <div className="dp-qv">
                        <span className="dp-qv-label">Quick View</span>
                      </div>
                    </div>
                    <div style={{ marginTop: "0.9rem", padding: "0 0.15rem" }}>
                      <p
                        className="line-clamp-1"
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--dp-sand)",
                          marginBottom: "0.3rem",
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
                            fontSize: "1rem",
                            color: "var(--dp-gold)",
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            §7  COLLECTIONS — large editorial image tiles
        ══════════════════════════════════════════════════════════ */}
        {visibleCollections.length > 0 && (
          <section
            className="mx-auto"
            style={{
              maxWidth: 1800,
              padding: "clamp(3.5rem,7vw,6rem) clamp(1.5rem,4vw,4rem) 3rem",
            }}
          >
            <SectionHead
              kicker="Explore"
              title="Collections"
              action={{ href: "/products", label: "Browse all" }}
            />
            <div
              style={{ display: "grid", gap: "0.75rem" }}
              className="grid-cols-2 lg:grid-cols-3"
            >
              {visibleCollections.map(
                ({ collection, products: colProducts }, idx) => {
                  const preview = colProducts.find((p) => p.featuredImage?.url);
                  const isFeature = idx === 0;
                  return (
                    <Link
                      key={collection.handle}
                      href={collection.path}
                      className={`dp-frame dp-zoom dp-lift ${isFeature ? "col-span-2" : ""}`}
                      style={{
                        display: "block",
                        aspectRatio: isFeature ? "16/10" : "4/5",
                        textDecoration: "none",
                      }}
                    >
                      <Media
                        src={preview?.featuredImage?.url}
                        alt={collection.title}
                        caption={`${collection.title} — collection cover.`}
                        sizes={
                          isFeature
                            ? "(min-width: 1024px) 66vw, 100vw"
                            : "(min-width: 1024px) 33vw, 50vw"
                        }
                        brightness={0.72}
                        tone={idx + 2}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(135deg, rgba(6,4,2,0.85) 0%, rgba(6,4,2,0.15) 62%)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          padding: "clamp(1.25rem,3vw,2.4rem)",
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
                              ? "clamp(1.7rem,3.5vw,2.8rem)"
                              : "1.35rem",
                            fontWeight: 600,
                            color: "var(--dp-cream)",
                            margin: 0,
                          }}
                        >
                          {collection.title}
                        </h3>
                        {isFeature && collection.description && (
                          <p
                            className="line-clamp-2"
                            style={{
                              fontSize: "0.82rem",
                              color: "var(--dp-sand)",
                              marginTop: "0.65rem",
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
            §8  TRENDING — CSS scroll-snap image row (no JS)
        ══════════════════════════════════════════════════════════ */}
        {trending.length > 0 && (
          <section style={{ padding: "clamp(3.5rem,7vw,6rem) 0 3rem" }}>
            <div
              className="mx-auto"
              style={{ maxWidth: 1800, padding: "0 clamp(1.5rem,4vw,4rem)" }}
            >
              <SectionHead kicker="Trending now" title="More to Explore" />
            </div>
            <div
              className="dp-scroller"
              style={{
                paddingInline: "clamp(1.5rem,4vw,4rem)",
                scrollPaddingInline: "clamp(1.5rem,4vw,4rem)",
              }}
            >
              {trending.map((product, i) => (
                <Link
                  key={product.id}
                  href={`/product/${product.handle}`}
                  className="dp-lift group"
                  style={{
                    display: "block",
                    textDecoration: "none",
                    width: "clamp(230px, 26vw, 340px)",
                  }}
                >
                  <div
                    className="dp-frame dp-zoom"
                    style={{ aspectRatio: "3/4" }}
                  >
                    <Media
                      src={product.featuredImage?.url}
                      alt={product.featuredImage?.altText || product.title}
                      caption="Trending product shot."
                      sizes="340px"
                      tone={i}
                    />
                    <div className="dp-qv">
                      <span className="dp-qv-label">Quick View</span>
                    </div>
                  </div>
                  <div style={{ marginTop: "0.85rem", padding: "0 0.15rem" }}>
                    <p
                      className="line-clamp-1"
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--dp-sand)",
                        marginBottom: "0.3rem",
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
                          fontSize: "1rem",
                          color: "var(--dp-gold)",
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            §9  USP STRIP
        ══════════════════════════════════════════════════════════ */}
        <section
          className="mx-auto"
          style={{
            maxWidth: 1800,
            padding: "1rem clamp(1.5rem,4vw,4rem) clamp(3rem,6vw,5rem)",
          }}
        >
          <div
            style={{ display: "grid", gap: "1.5rem 3rem" }}
            className="grid-cols-2 md:grid-cols-4"
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

        {/* ══════════════════════════════════════════════════════════
            §10  CUSTOM ORDERS — cinematic, image-first
        ══════════════════════════════════════════════════════════ */}
        <section style={{ background: "var(--dp-void)" }}>
          {/* wide statement image */}
          <div
            className="dp-frame dp-zoom"
            style={{ minHeight: "clamp(340px, 56vh, 640px)", display: "flex" }}
          >
            <Media
              src={CUSTOM_HERO.imageUrl}
              alt="Bespoke custom footwear"
              caption={CUSTOM_HERO.caption}
              sizes="100vw"
              tone={4}
              brightness={0.62}
            />
            <div
              style={{
                position: "relative",
                zIndex: 5,
                marginTop: "auto",
                width: "100%",
                padding: "clamp(2rem,5vw,4rem) clamp(1.5rem,4vw,4rem)",
              }}
            >
              <div
                style={{
                  maxWidth: 1800,
                  marginInline: "auto",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: "1.5rem",
                }}
              >
                <div>
                  <p className="dp-label" style={{ marginBottom: "0.75rem" }}>
                    Bespoke
                  </p>
                  <h2
                    className="dp-serif"
                    style={{
                      fontSize: "clamp(2rem,5vw,4rem)",
                      fontWeight: 600,
                      color: "var(--dp-cream)",
                      margin: 0,
                      maxWidth: 640,
                      lineHeight: 1.05,
                    }}
                  >
                    Dreamt up by you, made by hand.
                  </h2>
                </div>
                <Link href="/custom-orders" className="dp-btn-ember">
                  Request yours {ARROW}
                </Link>
              </div>
            </div>
          </div>

          {/* before / after showcase */}
          {customOrderRows.length > 0 && (
            <div
              className="mx-auto"
              style={{
                maxWidth: 1800,
                padding:
                  "clamp(2.5rem,5vw,4rem) clamp(1.5rem,4vw,4rem) clamp(3.5rem,7vw,6rem)",
              }}
            >
              <div
                style={{ display: "grid", gap: "0.75rem" }}
                className="grid-cols-1 md:grid-cols-3"
              >
                {customOrderRows.map((order) => (
                  <Link
                    key={order.id}
                    href={`/custom-orders#order-${order.id}`}
                    className="dp-lift group"
                    style={{
                      display: "block",
                      background: "var(--dp-card)",
                      padding: "0.75rem",
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
                        className="dp-frame dp-zoom"
                        style={{ aspectRatio: "1" }}
                      >
                        <Media
                          src={order.beforeImage}
                          alt={`${order.title} inspiration`}
                          caption="Before"
                          sizes="20vw"
                          tone={2}
                        />
                        <span
                          className="dp-pill dp-label"
                          style={{
                            background: "rgba(6,4,2,0.72)",
                            color: "var(--dp-sand)",
                          }}
                        >
                          Before
                        </span>
                      </div>
                      <div
                        className="dp-frame dp-zoom"
                        style={{ aspectRatio: "1" }}
                      >
                        <Media
                          src={order.afterImage}
                          alt={`${order.title} result`}
                          caption="After"
                          sizes="20vw"
                          tone={4}
                        />
                        <span
                          className="dp-pill dp-label"
                          style={{
                            background: "rgba(191,90,40,0.85)",
                            color: "var(--dp-cream)",
                          }}
                        >
                          After
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "0.9rem",
                      }}
                    >
                      <p
                        style={{ fontSize: "0.82rem", color: "var(--dp-sand)" }}
                      >
                        {order.title}
                      </p>
                      <span
                        className="dp-label"
                        style={{ color: "var(--dp-ember)" }}
                      >
                        Process →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════
            §11  CLOSING CTA — full-bleed image banner
        ══════════════════════════════════════════════════════════ */}
        <section
          className="dp-frame dp-zoom"
          style={{ minHeight: "clamp(420px, 64vh, 720px)", display: "flex" }}
        >
          <Media
            src={CTA.imageUrl}
            alt="Craft your own pair"
            caption={CTA.caption}
            sizes="100vw"
            tone={0}
            brightness={0.55}
          />
          <div
            style={{
              position: "relative",
              zIndex: 5,
              margin: "auto",
              padding: "clamp(2rem,5vw,4rem)",
              textAlign: "center",
            }}
          >
            <p
              className="dp-label"
              style={{ color: "var(--dp-sand)", marginBottom: "1rem" }}
            >
              Start something special
            </p>
            <h2
              className="dp-serif"
              style={{
                fontSize: "clamp(2rem,5vw,4rem)",
                fontWeight: 600,
                color: "var(--dp-cream)",
                maxWidth: 720,
                margin: "0 auto 2rem",
                lineHeight: 1.12,
              }}
            >
              Can&apos;t find the pair you&apos;re imagining? Let us craft it.
            </h2>
            <Link href="/custom-orders" className="dp-btn-solid">
              Order a Custom Pair {ARROW}
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

/* ────────────────────────────────────────────────────────────────
   Local presentational helpers (server components)
   ──────────────────────────────────────────────────────────────── */

function SectionHead({
  kicker,
  title,
  action,
}: {
  kicker: string;
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div
      style={{
        marginBottom: "2.25rem",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "1.5rem",
      }}
    >
      <div>
        <p className="dp-label" style={{ marginBottom: "0.6rem" }}>
          {kicker}
        </p>
        <h2 className="dp-h2 dp-serif" style={{ margin: 0 }}>
          {title}
        </h2>
      </div>
      {action && (
        <Link href={action.href} className="dp-btn-ghost hidden sm:inline-flex">
          {action.label}
        </Link>
      )}
    </div>
  );
}

function ProductCard({
  product,
  tone,
}: {
  product: Awaited<ReturnType<typeof getProducts>>[number];
  tone: number;
}) {
  return (
    <Link
      href={`/product/${product.handle}`}
      className="dp-lift group"
      style={{ display: "block", textDecoration: "none" }}
    >
      <div className="dp-frame dp-zoom" style={{ aspectRatio: "3/4" }}>
        <Media
          src={product.featuredImage?.url}
          alt={product.featuredImage?.altText || product.title}
          caption="Product shot — portrait, on a clean ground."
          sizes="(min-width: 1280px) 20vw, (min-width: 640px) 30vw, 50vw"
          tone={tone}
        />
        <div className="dp-qv">
          <span className="dp-qv-label">Quick View</span>
        </div>
      </div>
      <div style={{ marginTop: "0.85rem", padding: "0 0.15rem" }}>
        <p
          className="line-clamp-1"
          style={{
            fontSize: "0.8rem",
            color: "var(--dp-sand)",
            marginBottom: "0.3rem",
          }}
        >
          {product.title}
        </p>
        <Price
          amount={product.priceRange.maxVariantPrice.amount}
          currencyCode={product.priceRange.maxVariantPrice.currencyCode}
          currencyCodeClassName="hidden"
          className="dp-wordmark"
          style={
            {
              fontSize: "0.98rem",
              color: "var(--dp-cream)",
            } as React.CSSProperties
          }
        />
      </div>
    </Link>
  );
}
