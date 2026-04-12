import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { defaultSort, sorting } from "lib/constants";
import { getCollections, getProducts } from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import SearchControlsMenu from "./search-controls-menu";

const description = "Search for products in the store.";

const suggestedSearches = [
  "new arrivals",
  "best sellers",
  "slides",
  "slippers",
  "leather",
  "classic",
];

export const metadata: Metadata = {
  title: "Search",
  description,
  alternates: { canonical: canonicalUrl("/search") },
  robots: { index: false, follow: true },
  openGraph: {
    title: `Search | ${siteName}`,
    description,
    url: canonicalUrl("/search"),
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `Search | ${siteName}`,
    description,
    images: ["/opengraph-image"],
  },
};

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { sort, q: rawSearchValue } = searchParams as { [key: string]: string };
  const searchValue = rawSearchValue?.trim();
  const hasQuery = Boolean(searchValue);

  const selectedSort = sorting.find((item) => item.slug === sort) || defaultSort;
  const { sortKey, reverse, title: selectedSortTitle } = selectedSort;

  const [products, collections] = await Promise.all([
    getProducts({ sortKey, reverse, query: searchValue }),
    getCollections(),
  ]);

  return (
    <>
      <style>{`
        .co-input {
          background: var(--dp-card);
          border: 1px solid var(--dp-border);
          color: var(--dp-cream);
          font-family: 'DM Sans', sans-serif;
          font-size: .88rem;
          padding: .9rem 1.25rem;
          outline: none;
          transition: border-color .22s;
          flex: 1;
        }
        .co-input::placeholder { color: var(--dp-muted); }
        .co-input:focus { border-color: rgba(191,90,40,.6); }

        .dp-btn-solid {
          display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
          background: var(--dp-cream); color: var(--dp-ink);
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          font-size: .72rem; letter-spacing: .12em; text-transform: uppercase;
          padding: .9rem 2rem; border: none; cursor: pointer;
          transition: background .22s, color .22s; flex-shrink: 0;
        }
        .dp-btn-solid:hover { background: var(--dp-ember); color: var(--dp-cream); }

        .suggestion-pill {
          font-family: 'DM Sans', sans-serif;
          font-size: .65rem;
          font-weight: 500;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: var(--dp-muted);
          border: 1px solid var(--dp-border);
          padding: .5rem 1rem;
          text-decoration: none;
          transition: border-color .22s, color .22s;
        }
        .suggestion-pill:hover { border-color: rgba(191,90,40,.4); color: var(--dp-sand); }
      `}</style>

      <section style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>

        {/* ── Header ── */}
        <header style={{ borderBottom: "1px solid var(--dp-border)", paddingBottom: "2rem" }}>

          {/* Title row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "1rem",
              marginBottom: "1.75rem",
            }}
          >
            <div>
              <p className="dp-label" style={{ marginBottom: ".6rem" }}>
                {hasQuery ? "Search results" : "Discover"}
              </p>
              <h1
                className="dp-wordmark"
                style={{
                  fontSize: "clamp(2.8rem,8vw,6rem)",
                  lineHeight: .9,
                  letterSpacing: "-.01em",
                  color: "var(--dp-cream)",
                  marginBottom: ".75rem",
                }}
              >
                {hasQuery ? (
                  <>
                    <span style={{ color: "var(--dp-cream)" }}>&ldquo;{searchValue}&rdquo;</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: "var(--dp-cream)" }}>SEARCH</span>{" "}
                    <span style={{ WebkitTextStroke: "1.5px rgba(242,232,213,0.2)", color: "transparent" }}>PRODUCTS</span>
                  </>
                )}
              </h1>
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".72rem", color: "var(--dp-muted)", letterSpacing: ".06em" }}>
                {products.length} result{products.length === 1 ? "" : "s"}
                {hasQuery ? "" : ` · Sort: ${selectedSortTitle}`}
              </p>
            </div>

            <SearchControlsMenu
              collections={collections}
              sorting={sorting}
              pathname="/search"
              query={searchValue}
              activeSortSlug={selectedSort.slug ?? null}
              activeCollectionPath="/search"
            />
          </div>

          {/* Search form */}
          <form action="/search" style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <label htmlFor="search-query" className="sr-only">Search products</label>
            <input
              id="search-query"
              name="q"
              defaultValue={searchValue}
              placeholder="Search slippers, slides, leather…"
              className="co-input"
            />
            {sort ? <input type="hidden" name="sort" value={sort} /> : null}
            <button type="submit" className="dp-btn-solid">
              Search
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </header>

        {/* ── Results or empty state ── */}
        {products.length > 0 ? (
          <Grid className="grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ProductGridItems products={products} />
          </Grid>
        ) : (
          <div
            style={{
              border: "1px dashed rgba(242,232,213,0.12)",
              padding: "4rem 2rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
            }}
          >
            {/* Ghost wordmark */}
            <p
              className="dp-wordmark"
              style={{
                fontSize: "clamp(3rem,10vw,8rem)",
                color: "rgba(242,232,213,0.04)",
                lineHeight: 1,
                userSelect: "none",
                pointerEvents: "none",
                marginBottom: "-.5rem",
              }}
            >
              NO RESULTS
            </p>

            <p
              className="dp-serif"
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: "var(--dp-cream)",
                lineHeight: 1.2,
              }}
            >
              Nothing found
              {hasQuery ? ` for "${searchValue}"` : ""}
            </p>

            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".78rem", color: "var(--dp-muted)", maxWidth: 380, lineHeight: 1.65 }}>
              Try a different keyword or start from one of these suggestions.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: ".5rem", marginTop: ".5rem" }}>
              {suggestedSearches.map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="suggestion-pill"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}