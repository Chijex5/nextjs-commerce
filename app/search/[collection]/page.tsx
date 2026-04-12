import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { defaultSort, sorting } from "lib/constants";
import {
  getCollection,
  getCollectionProducts,
  getCollections,
} from "lib/database";
import {
  canonicalUrl,
  hasContentAffectingSearchParams,
  siteName,
} from "lib/seo";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import SearchControlsMenu from "../search-controls-menu";

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const collection = await getCollection(params.collection);

  if (!collection) return notFound();

  const hasContentAffectingParams = hasContentAffectingSearchParams(searchParams, ["sort"]);
  const title = collection.seo?.title || collection.title;
  const description = collection.seo?.description || collection.description || `${collection.title} products`;
  const isHiddenCollection = collection.handle.startsWith("hidden-") || collection.handle === "all";
  const ogImagePath = `${collection.path}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl(collection.path) },
    robots: {
      index: !hasContentAffectingParams && !isHiddenCollection,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl(collection.path),
      type: "website",
      images: [ogImagePath],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: [ogImagePath],
    },
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { sort } = searchParams as { [key: string]: string };

  const collection = await getCollection(params.collection);
  if (!collection) return notFound();

  const selectedSort = sorting.find((item) => item.slug === sort) || defaultSort;
  const { sortKey, reverse } = selectedSort;

  const [products, collections] = await Promise.all([
    getCollectionProducts({ collection: params.collection, sortKey, reverse }),
    getCollections(),
  ]);

  return (
    <>
      <style>{`
        .co-empty {
          border: 1px dashed rgba(242,232,213,0.12);
          padding: 5rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
      `}</style>

      <section style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>

        {/* ── Header ── */}
        <header style={{ borderBottom: "1px solid var(--dp-border)", paddingBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "1rem",
              marginBottom: collection.description ? "1.5rem" : 0,
            }}
          >
            <div>
              <p className="dp-label" style={{ marginBottom: ".6rem" }}>Collection</p>
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
                {collection.title.toUpperCase()}
              </h1>
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".72rem", color: "var(--dp-muted)", letterSpacing: ".06em" }}>
                {products.length} item{products.length === 1 ? "" : "s"} · Sort: {selectedSort.title}
              </p>
            </div>

            <SearchControlsMenu
              collections={collections}
              sorting={sorting}
              pathname={collection.path}
              activeSortSlug={selectedSort.slug ?? null}
              activeCollectionPath={collection.path}
            />
          </div>

          {collection.description && (
            <p
              className="dp-serif"
              style={{
                fontSize: "clamp(1rem,1.8vw,1.35rem)",
                fontWeight: 300,
                fontStyle: "italic",
                color: "var(--dp-sand)",
                lineHeight: 1.55,
                maxWidth: 640,
              }}
            >
              {collection.description}
            </p>
          )}
        </header>

        {/* ── Grid or empty state ── */}
        {products.length === 0 ? (
          <div className="co-empty">
            <p
              className="dp-wordmark"
              style={{
                fontSize: "clamp(3rem,10vw,7rem)",
                color: "rgba(242,232,213,0.04)",
                lineHeight: 1,
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              EMPTY
            </p>
            <p
              className="dp-serif"
              style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--dp-cream)" }}
            >
              Nothing here yet
            </p>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".75rem", color: "var(--dp-muted)", maxWidth: 320, lineHeight: 1.65 }}>
              No products found in this collection. Check back soon or browse another.
            </p>
          </div>
        ) : (
          <Grid className="grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ProductGridItems products={products} />
          </Grid>
        )}
      </section>
    </>
  );
}