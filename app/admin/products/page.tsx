import type { SQL } from "drizzle-orm";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "lib/db";
import {
  collections,
  productCollections,
  productImages,
  productVariants,
  products,
} from "lib/db/schema";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminNav from "../../../components/admin/AdminNav";
import GoogleMerchantSyncButton from "../../../components/admin/GoogleMerchantSyncButton";
import ProductsListWithSelection from "../../../components/admin/ProductsListWithSelection";
import ProductsPerPageSelect from "../../../components/admin/ProductsPerPageSelect";
import { authOptions } from "../../../lib/auth";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    perPage?: string;
    status?: string;
    collection?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1");
  const perPage = parseInt(params.perPage || "20");
  const status =
    params.status === "active" || params.status === "inactive"
      ? params.status
      : "all";
  const collection = params.collection || "all";

  const allCollections = await db
    .select({ id: collections.id, title: collections.title })
    .from(collections)
    .orderBy(asc(collections.title));

  let filteredCollectionProductIds: string[] = [];
  if (collection !== "all") {
    const collectionProductRows = await db
      .select({ productId: productCollections.productId })
      .from(productCollections)
      .where(eq(productCollections.collectionId, collection));
    filteredCollectionProductIds = collectionProductRows.map(
      (row) => row.productId,
    );
  }

  const whereConditions: SQL[] = [];

  if (search) {
    const searchCondition = or(
      ilike(products.title, `%${search}%`),
      ilike(products.handle, `%${search}%`),
      sql`${products.tags} @> ${JSON.stringify([search])}::text[]`,
    );

    if (searchCondition) {
      whereConditions.push(searchCondition);
    }
  }

  if (status === "active") {
    whereConditions.push(eq(products.availableForSale, true) as SQL);
  }

  if (status === "inactive") {
    whereConditions.push(eq(products.availableForSale, false) as SQL);
  }

  if (collection !== "all") {
    if (filteredCollectionProductIds.length === 0) {
      whereConditions.push(sql`1=0` as SQL);
    } else {
      whereConditions.push(
        inArray(products.id, filteredCollectionProductIds) as SQL,
      );
    }
  }

  const whereClause: SQL | undefined =
    whereConditions.length === 0
      ? undefined
      : whereConditions.length === 1
        ? whereConditions[0]
        : (and(...whereConditions) as SQL);

  const [productRows, totalResult, activeCountResult, inactiveCountResult] =
    await Promise.all([
      db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(desc(products.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.availableForSale, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.availableForSale, false)),
    ]);

  const productIds = productRows.map((product) => product.id);

  const [featuredImages, variantRows, collectionRows, variantCounts] =
    await Promise.all([
      productIds.length
        ? db
            .select({
              productId: productImages.productId,
              url: productImages.url,
              altText: productImages.altText,
            })
            .from(productImages)
            .where(
              and(
                inArray(productImages.productId, productIds),
                eq(productImages.isFeatured, true),
              ),
            )
        : [],
      productIds.length
        ? db
            .select({
              productId: productVariants.productId,
              price: productVariants.price,
              currencyCode: productVariants.currencyCode,
            })
            .from(productVariants)
            .where(inArray(productVariants.productId, productIds))
            .orderBy(productVariants.price)
        : [],
      productIds.length
        ? db
            .select({
              productId: productCollections.productId,
              collection: collections,
            })
            .from(productCollections)
            .innerJoin(
              collections,
              eq(productCollections.collectionId, collections.id),
            )
            .where(inArray(productCollections.productId, productIds))
        : [],
      productIds.length
        ? db
            .select({
              productId: productVariants.productId,
              count: sql<number>`count(*)`,
            })
            .from(productVariants)
            .where(inArray(productVariants.productId, productIds))
            .groupBy(productVariants.productId)
        : [],
    ]);

  const imagesByProduct = new Map(
    featuredImages.map((image) => [image.productId, image]),
  );

  const variantsByProduct = new Map<
    string,
    { price: any; currencyCode: string }[]
  >();
  for (const variant of variantRows) {
    if (!variantsByProduct.has(variant.productId)) {
      variantsByProduct.set(variant.productId, []);
    }
    variantsByProduct.get(variant.productId)!.push({
      price: variant.price,
      currencyCode: variant.currencyCode,
    });
  }

  const collectionsByProduct = collectionRows.reduce(
    (acc, row) => {
      const collectionsForProduct =
        acc[row.productId] ??
        (acc[row.productId] = [] as {
          collection: { id: string; title: string };
        }[]);
      collectionsForProduct.push({
        collection: { id: row.collection.id, title: row.collection.title },
      });
      return acc;
    },
    {} as Record<string, { collection: { id: string; title: string } }[]>,
  );

  const countsByProduct = new Map(
    variantCounts.map((row) => [row.productId, Number(row.count)]),
  );

  const total = Number(totalResult[0]?.count ?? 0);
  const activeCount = Number(activeCountResult[0]?.count ?? 0);
  const inactiveCount = Number(inactiveCountResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / perPage);

  const buildPageUrl = (pageNum: number) => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (status !== "all") p.set("status", status);
    if (collection !== "all") p.set("collection", collection);
    if (perPage !== 20) p.set("perPage", perPage.toString());
    p.set("page", pageNum.toString());
    return `/admin/products?${p.toString()}`;
  };

  const hasActiveFilters =
    Boolean(search) || status !== "all" || collection !== "all";

  const mappedProducts = productRows.map((product) => {
    const image = imagesByProduct.get(product.id);
    const variants = variantsByProduct.get(product.id) || [];
    return {
      ...product,
      images: image ? [{ url: image.url, altText: image.altText }] : [],
      variants: variants.slice(0, 1),
      productCollections: collectionsByProduct[product.id] || [],
      _count: { variants: countsByProduct.get(product.id) || 0 },
    };
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="products" userEmail={session.user?.email} />

      <div className="py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* ── Header ── */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                Catalog
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                Products
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <GoogleMerchantSyncButton />
              <Link
                href="/admin/products/bulk-import"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Bulk Import
              </Link>
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Add Product
              </Link>
            </div>
          </div>

          {/* ── Stats Strip ── */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                Total
              </p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {total}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                Active
              </p>
              <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                {activeCount}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                Inactive
              </p>
              <p className="mt-1 text-2xl font-semibold text-red-500 dark:text-red-400">
                {inactiveCount}
              </p>
            </div>
          </div>

          {/* ── Search & Filters ── */}
          <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <form
              action="/admin/products"
              method="get"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_220px_auto]"
            >
              <div className="relative sm:col-span-2 lg:col-span-1">
                <input
                  type="search"
                  name="search"
                  placeholder="Search by title, handle, or tag…"
                  defaultValue={search}
                  className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-700"
                />
                <svg
                  className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <select
                name="status"
                defaultValue={status}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:focus:border-neutral-600 dark:focus:ring-neutral-700"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                name="collection"
                defaultValue={collection}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:focus:border-neutral-600 dark:focus:ring-neutral-700"
              >
                <option value="all">All collections</option>
                {allCollections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Apply
                </button>
                {hasActiveFilters && (
                  <Link
                    href="/admin/products"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-3 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                  >
                    Reset
                  </Link>
                )}
              </div>
            </form>
          </div>

          {/* Search result context */}
          {hasActiveFilters && (
            <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
              {total === 0
                ? "No products match the current filters"
                : `${total} product${total !== 1 ? "s" : ""} match the current filters`}
            </p>
          )}

          {/* ── Product List ── */}
          <ProductsListWithSelection products={mappedProducts} />

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row">
              <div className="flex items-center gap-4">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {total}
                  </span>
                </p>

                <ProductsPerPageSelect perPage={perPage} />
              </div>

              <nav className="flex items-center gap-1">
                <Link
                  href={buildPageUrl(page - 1)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors ${
                    page <= 1
                      ? "pointer-events-none border-neutral-100 text-neutral-300 dark:border-neutral-800 dark:text-neutral-600"
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
                </Link>

                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <Link
                      key={pageNum}
                      href={buildPageUrl(pageNum)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                          : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}

                <Link
                  href={buildPageUrl(page + 1)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors ${
                    page >= totalPages
                      ? "pointer-events-none border-neutral-100 text-neutral-300 dark:border-neutral-800 dark:text-neutral-600"
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </Link>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
