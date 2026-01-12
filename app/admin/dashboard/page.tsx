import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "../../../lib/prisma";
import AdminNav from "../../../components/admin/AdminNav";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  // Get dashboard stats
  const [
    productsCount,
    collectionsCount,
    ordersCount,
    pendingOrdersCount,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.collection.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        totalAmount: true,
        currencyCode: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="dashboard" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Welcome back, {session.user?.email}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Products Card */}
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <svg
                        className="h-6 w-6 text-blue-600 dark:text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        Products
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {productsCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-3 dark:border-neutral-800 dark:bg-neutral-800">
                <Link
                  href="/admin/products"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View all →
                </Link>
              </div>
            </div>

            {/* Orders Card */}
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                      <svg
                        className="h-6 w-6 text-green-600 dark:text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        Total Orders
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {ordersCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-3 dark:border-neutral-800 dark:bg-neutral-800">
                <Link
                  href="/admin/orders"
                  className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  View all →
                </Link>
              </div>
            </div>

            {/* Pending Orders Card */}
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                      <svg
                        className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        Pending Orders
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {pendingOrdersCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-3 dark:border-neutral-800 dark:bg-neutral-800">
                <Link
                  href="/admin/orders?status=pending"
                  className="text-sm font-medium text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                >
                  View pending →
                </Link>
              </div>
            </div>

            {/* Collections Card */}
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <svg
                        className="h-6 w-6 text-purple-600 dark:text-purple-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        Collections
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {collectionsCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-3 dark:border-neutral-800 dark:bg-neutral-800">
                <Link
                  href="/admin/collections"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  View all →
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Orders & Quick Actions */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Recent Orders
                  </h2>
                </div>
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        className="block px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {order.orderNumber}
                              </p>
                              <span
                                className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  order.status === "completed"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : order.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                              {order.customerName}
                            </p>
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {order.currencyCode}{" "}
                              {Number(order.totalAmount).toLocaleString()}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="px-6 py-8 text-center">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        No orders yet
                      </p>
                    </div>
                  )}
                </div>
                <div className="border-t border-neutral-200 px-6 py-3 dark:border-neutral-800">
                  <Link
                    href="/admin/orders"
                    className="text-sm font-medium text-neutral-900 hover:text-neutral-700 dark:text-neutral-100 dark:hover:text-neutral-300"
                  >
                    View all orders →
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Quick Actions
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <Link
                      href="/admin/products/new"
                      className="flex items-center justify-between rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                      <span>Add Product</span>
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/products/bulk-import"
                      className="flex items-center justify-between rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      <span>Bulk Import</span>
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/orders?status=pending"
                      className="flex items-center justify-between rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      <span>View Pending Orders</span>
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
