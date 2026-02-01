import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "lib/db";
import {
  collections,
  productCollections,
  productImages,
  productVariants,
  products,
} from "lib/db/schema";
import AdminNav from "../../../components/admin/AdminNav";
import ProductsListWithSelection from "../../../components/admin/ProductsListWithSelection";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; perPage?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1");
  const perPage = parseInt(params.perPage || "20");

  const whereClause = search
    ? or(
        ilike(products.title, `%${search}%`),
        ilike(products.handle, `%${search}%`),
        sql`${products.tags} @> ${JSON.stringify([search])}::text[]`,
      )
    : undefined;

  const [productRows, totalResult] = await Promise.all([
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

  const variantsByProduct = new Map<string, { price: any; currencyCode: string }[]>();
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
      if (!acc[row.productId]) {
        acc[row.productId] = [] as { collection: { id: string; title: string } }[];
      }
      acc[row.productId].push({
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
  const totalPages = Math.ceil(total / perPage);

  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (perPage !== 20) params.set("perPage", perPage.toString());
    params.set("page", pageNum.toString());
    return `/admin/products?${params.toString()}`;
  };

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

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                Products
              </h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Manage your product catalog ({total} total)
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/products/bulk-import"
                className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Bulk Import
              </Link>
              <Link
                href="/admin/products/new"
                className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Add Product
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <form action="/admin/products" method="get" className="relative">
              <input
                type="search"
                name="search"
                placeholder="Search products by title, handle, or tag..."
                defaultValue={search}
                className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 pl-10 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </form>
          </div>

          {/* Products Table/Cards */}
          <ProductsListWithSelection products={mappedProducts} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col gap-4 border-t border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800 sm:px-6">
              {/* Mobile View */}
              <div className="flex flex-1 justify-between sm:hidden">
                <Link
                  href={buildPageUrl(page - 1)}
                  className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                    page <= 1
                      ? "pointer-events-none text-neutral-400"
                      : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  Previous
                </Link>
                <Link
                  href={buildPageUrl(page + 1)}
                  className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                    page >= totalPages
                      ? "pointer-events-none text-neutral-400"
                      : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  Next
                </Link>
              </div>

              {/* Desktop View */}
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    Showing{" "}
                    <span className="font-medium">
                      {(page - 1) * perPage + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(page * perPage, total)}
                    </span>{" "}
                    of <span className="font-medium">{total}</span> results
                  </p>

                  {/* Per Page Selector */}
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="perPage"
                      className="text-sm text-neutral-600 dark:text-neutral-400"
                    >
                      Show:
                    </label>
                    <select
                      id="perPage"
                      value={perPage}
                      onChange={(e) => {
                        const newPerPage = e.target.value;
                        const params = new URLSearchParams();
                        if (search) params.set("search", search);
                        params.set("page", "1");
                        params.set("perPage", newPerPage);
                        window.location.href = `/admin/products?${params.toString()}`;
                      }}
                      className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    >
                      <option value="20">20 per page</option>
                      <option value="40">40 per page</option>
                      <option value="60">60 per page</option>
                      <option value="100">100 per page</option>
                    </select>
                  </div>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                    <Link
                      href={buildPageUrl(page - 1)}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-neutral-400 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 focus:z-20 focus:outline-offset-0 dark:ring-neutral-700 dark:hover:bg-neutral-700 ${
                        page <= 1 ? "pointer-events-none" : ""
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Link>
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum;
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
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            page === pageNum
                              ? "z-10 bg-neutral-900 text-white"
                              : "text-neutral-900 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 dark:text-neutral-100 dark:ring-neutral-700 dark:hover:bg-neutral-700"
                          }`}
                        >
                          {pageNum}
                        </Link>
                      );
                    })}
                    <Link
                      href={buildPageUrl(page + 1)}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-neutral-400 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 focus:z-20 focus:outline-offset-0 dark:ring-neutral-700 dark:hover:bg-neutral-700 ${
                        page >= totalPages ? "pointer-events-none" : ""
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Link>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
