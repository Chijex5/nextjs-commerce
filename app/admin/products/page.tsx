import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "../../../lib/prisma";
import AdminNav from "../../../components/admin/AdminNav";
import ProductsTable from "../../../components/admin/ProductsTable";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1");
  const perPage = 20;

  // Build where clause for search
  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { handle: { contains: search, mode: "insensitive" as const } },
          { tags: { has: search } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: {
          where: { isFeatured: true },
          take: 1,
        },
        variants: {
          take: 1,
          orderBy: { price: "asc" },
        },
        productCollections: {
          include: {
            collection: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        _count: {
          select: { variants: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

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
                href="/admin/products/bulk-edit"
                className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Bulk Edit
              </Link>
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
          <ProductsTable products={products} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <Link
                  href={`/admin/products?page=${page - 1}${search ? `&search=${search}` : ""}`}
                  className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                    page <= 1
                      ? "pointer-events-none text-neutral-400"
                      : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  Previous
                </Link>
                <Link
                  href={`/admin/products?page=${page + 1}${search ? `&search=${search}` : ""}`}
                  className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                    page >= totalPages
                      ? "pointer-events-none text-neutral-400"
                      : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  Next
                </Link>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
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
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                    <Link
                      href={`/admin/products?page=${page - 1}${search ? `&search=${search}` : ""}`}
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
                          href={`/admin/products?page=${pageNum}${search ? `&search=${search}` : ""}`}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            page === pageNum
                              ? "z-10 bg-neutral-900 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-neutral-100 dark:text-neutral-900"
                              : "text-neutral-900 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 focus:z-20 focus:outline-offset-0 dark:text-neutral-100 dark:ring-neutral-700 dark:hover:bg-neutral-700"
                          }`}
                        >
                          {pageNum}
                        </Link>
                      );
                    })}
                    <Link
                      href={`/admin/products?page=${page + 1}${search ? `&search=${search}` : ""}`}
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
