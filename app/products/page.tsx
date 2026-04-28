import { defaultSort, sorting } from "lib/constants";
import { getProducts } from "lib/database";
import {
    canonicalUrl,
    hasContentAffectingSearchParams,
    siteName,
} from "lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import InfiniteProductsGrid from "./infinite-products-grid";
import ProductsFilterMenu from "./products-filter-menu";

const description = "Browse all products in our store.";
const PRODUCTS_PAGE_SIZE = 24;

export async function generateMetadata(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const hasContentAffectingParams = hasContentAffectingSearchParams(
    searchParams,
    ["sort"],
  );

  return {
    title: "All Products",
    description,
    alternates: {
      canonical: canonicalUrl("/products"),
    },
    robots: {
      index: !hasContentAffectingParams,
      follow: true,
    },
    openGraph: {
      title: `All Products | ${siteName}`,
      description,
      url: canonicalUrl("/products"),
      type: "website",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: `All Products | ${siteName}`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function AllProductsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { sort } = searchParams as { [key: string]: string };
  const activeSort = sorting.find((item) => item.slug === sort) || defaultSort;
  const { sortKey, reverse } = activeSort;

  const products = await getProducts({
    sortKey,
    reverse,
    limit: PRODUCTS_PAGE_SIZE,
    offset: 0,
  });

  return (
    <section className="shop-root">
      {/* ── Google Fonts + Global Styles ── */}
      <style>{`

        :root {
          --espresso: #0A0704;
          --cream: #F2E8D5;
          --cream-dim: rgba(242,232,213,0.55);
          --cream-faint: rgba(242,232,213,0.06);
          --terra: #BF5A28;
          --terra-dim: rgba(191,90,40,0.16);
          --gold: #C0892A;
          --muted: #6A5A48;
          --border: rgba(242,232,213,0.1);
          --border-mid: rgba(242,232,213,0.2);
        }

        .shop-root {
          background: var(--espresso);
          min-height: 100vh;
          color: var(--cream);
          font-family: 'DM Sans', sans-serif;
          padding-bottom: 100px;
        }

        /* ── HERO ── */
        .shop-hero {
          position: relative;
          padding: 72px 48px 56px;
          border-bottom: 1px solid var(--border);
          overflow: visible;
        }
        .shop-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 80% at 75% 50%, rgba(191,90,40,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--terra);
          margin-bottom: 20px;
        }
        .hero-eyebrow::before {
          content: '';
          display: block;
          width: 32px;
          height: 1px;
          background: var(--terra);
          flex-shrink: 0;
        }
        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(52px, 8vw, 92px);
          font-weight: 300;
          line-height: 0.95;
          letter-spacing: -0.01em;
          color: var(--cream);
          margin-bottom: 28px;
        }
        .hero-title-italic {
          font-style: italic;
          color: var(--terra);
        }
        .hero-bottom {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 20px;
        }
        .hero-count {
          font-size: 12px;
          color: var(--muted);
          letter-spacing: 0.08em;
        }

        /* ── MARQUEE ── */
        .marquee-wrap {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          overflow: hidden;
          padding: 13px 0;
        }
        .marquee-track {
          display: flex;
          gap: 56px;
          animation: marquee-scroll 24s linear infinite;
          white-space: nowrap;
          width: max-content;
        }
        .marquee-item {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 10px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .marquee-dot {
          display: inline-block;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--terra);
          flex-shrink: 0;
        }
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* ── SHOP BODY ── */
        .shop-body {
          padding: 0 48px;
          max-width: 1600px;
          margin: 0 auto;
        }

        /* ── SECTION HEAD ── */
        .section-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin: 56px 0 24px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border);
        }
        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          font-weight: 300;
          color: var(--cream);
        }

        /* ── PRODUCT GRID ── */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2px;
        }

        /* ── PRODUCT CARD ── */
        .product-card {
          background: var(--cream-faint);
          transition: background 0.3s ease;
          display: block;
          color: inherit;
          text-decoration: none;
        }
        .product-card:hover { background: rgba(242,232,213,0.05); }

        .card-image-wrap {
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: rgba(242,232,213,0.03);
        }
        .card-image-wrap img {
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .product-card:hover .card-image-wrap img {
          transform: scale(1.04);
        }
        .card-image-empty {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-image-empty-icon {
          opacity: 0.08;
        }

        .card-quick-add {
          position: absolute;
          bottom: 16px;
          right: 16px;
          background: var(--espresso);
          border: 1px solid var(--border-mid);
          color: var(--cream);
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 9px 16px;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.25s ease, transform 0.25s ease;
          cursor: pointer;
          z-index: 2;
        }
        .product-card:hover .card-quick-add {
          opacity: 1;
          transform: translateY(0);
        }

        .card-info {
          padding: 18px 20px 24px;
          border-top: 1px solid var(--border);
        }
        .card-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 400;
          line-height: 1.2;
          color: var(--cream);
          margin-bottom: 10px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card-price-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Override Price component colors */
        .card-price-row .text-black,
        .card-price-row [class*="price"],
        .card-price-row span,
        .card-price-row p {
          color: var(--gold) !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          letter-spacing: 0.03em;
        }
        .card-price-separator {
          color: var(--muted);
          font-size: 12px;
        }

        /* ── EMPTY STATE ── */
        .empty-state {
          border: 1px dashed var(--border-mid);
          padding: 80px 40px;
          text-align: center;
          color: var(--muted);
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 300;
          font-style: italic;
          margin-top: 40px;
        }
        .empty-state-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          margin-top: 12px;
          font-style: normal;
        }

        /* ── PROMO STRIP ── */
        .promo-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          border: 1px solid var(--border-mid);
          padding: 36px 44px;
          margin-top: 72px;
          position: relative;
          overflow: hidden;
        }
        .promo-strip::before {
          content: '';
          position: absolute;
          right: -24px;
          top: -24px;
          width: 180px;
          height: 180px;
          border: 1px solid var(--border);
          border-radius: 50%;
          pointer-events: none;
        }
        .promo-strip::after {
          content: '';
          position: absolute;
          right: 28px;
          top: 28px;
          width: 88px;
          height: 88px;
          border: 1px solid var(--border);
          border-radius: 50%;
          pointer-events: none;
        }
        .promo-label {
          font-size: 10px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--terra);
          margin-bottom: 8px;
        }
        .promo-headline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px;
          font-weight: 300;
          line-height: 1.1;
          color: var(--cream);
        }
        .promo-headline em {
          font-style: italic;
          color: var(--terra);
        }
        .promo-cta {
          background: var(--terra);
          border: none;
          color: var(--cream);
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 15px 32px;
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
          text-decoration: none;
        }
        .promo-cta:hover { background: #a34d22; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .shop-hero { padding: 48px 24px 40px; }
          .shop-body { padding: 0 24px; }
          .products-grid { grid-template-columns: repeat(2, 1fr); gap: 1px; }
          .promo-strip { padding: 28px 24px; }
          .promo-headline { font-size: 26px; }
        }
        @media (max-width: 480px) {
          .products-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── HERO ── */}
      <header className="shop-hero">
        <div className="hero-eyebrow">New Season 2026</div>
        <h1 className="hero-title">
          The <span className="hero-title-italic">Collection</span>
        </h1>
        <div className="hero-bottom">
          <span className="hero-count">{products.length} products</span>
          <ProductsFilterMenu
            sorting={sorting}
            activeSortSlug={activeSort.slug ?? null}
          />
        </div>
      </header>

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap" aria-hidden="true">
        <div className="marquee-track">
          {[
            "Handcrafted Leather",
            "Free Shipping Over $200",
            "Ethically Sourced",
            "30-Day Returns",
            "Complimentary Shoe Care Kit",
            "Bespoke Orders Welcome",
            "Handcrafted Leather",
            "Free Shipping Over $200",
            "Ethically Sourced",
            "30-Day Returns",
            "Complimentary Shoe Care Kit",
            "Bespoke Orders Welcome",
          ].map((text, i) => (
            <span key={i} className="marquee-item">
              <span className="marquee-dot" />
              {text}
            </span>
          ))}
        </div>
      </div>

      <div className="shop-body">
        {products.length > 0 ? (
          <>
            <div className="section-head">
              <span className="section-title">All Products</span>
            </div>

            <InfiniteProductsGrid
              initialProducts={products}
              pageSize={PRODUCTS_PAGE_SIZE}
              sortSlug={activeSort.slug ?? null}
            />

            {/* Promo strip */}
            <div className="promo-strip">
              <div>
                <div className="promo-label">Limited Time</div>
                <div className="promo-headline">
                  End of Season <em>Sale</em>
                  <br />
                  Up to 40% off select styles
                </div>
              </div>
              <Link href="/products?sort=price-asc" className="promo-cta">
                Shop the Sale
              </Link>
            </div>
          </>
        ) : (
          <div className="empty-state">
            Nothing here yet.
            <div className="empty-state-sub">Check back soon</div>
          </div>
        )}
      </div>
    </section>
  );
}
