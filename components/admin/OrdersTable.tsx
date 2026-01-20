"use client";

import Link from "next/link";
import { useState } from "react";
import Price from "components/price";
import {
  getDeliveryStatusColor,
  type DeliveryStatus,
} from "lib/order-utils/delivery-tracking";

interface OrderItem {
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string | null;
  status: string;
  deliveryStatus: string;
  estimatedArrival: Date | null;
  totalAmount: any;
  currencyCode: string;
  shippingAddress: any;
  createdAt: Date;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  items: OrderItem[];
}

interface OrdersTableProps {
  orders: Order[];
  currentPage: number;
  totalPages: number;
  total: number;
  perPage: number;
  searchParams: {
    search?: string;
    status?: string;
    deliveryStatus?: string;
    perPage?: string;
  };
}

export default function OrdersTable({
  orders,
  currentPage,
  totalPages,
  total,
  perPage,
  searchParams,
}: OrdersTableProps) {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleOrder = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-900/20 dark:text-neutral-400";
    }
  };

  const buildQueryString = (page: number) => {
    const params = new URLSearchParams();
    if (searchParams.search) params.set("search", searchParams.search);
    if (searchParams.status && searchParams.status !== "all")
      params.set("status", searchParams.status);
    if (searchParams.deliveryStatus && searchParams.deliveryStatus !== "all")
      params.set("deliveryStatus", searchParams.deliveryStatus);
    if (searchParams.perPage && searchParams.perPage !== "20")
      params.set("perPage", searchParams.perPage);
    params.set("page", page.toString());
    return params.toString();
  };

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <svg
          className="mx-auto h-12 w-12 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          No orders found
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Try adjusting your search or filter to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:block">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
          <thead className="bg-neutral-50 dark:bg-neutral-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Delivery
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
            {orders.map((order) => {
              const isAcknowledged = Boolean(order.acknowledgedAt);
              return (
                <tr
                  key={order.id}
                  className={`hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                    isAcknowledged ? "" : "bg-amber-50/60 dark:bg-amber-950/20"
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {order.orderNumber}
                      </div>
                      {!isAcknowledged && (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          New
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-900 dark:text-neutral-100">
                      {order.customerName}
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      {order.email}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getDeliveryStatusColor(order.deliveryStatus as DeliveryStatus)}`}
                    >
                      {order.deliveryStatus}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    <Price
                      amount={order.totalAmount.toString()}
                      currencyCode={order.currencyCode}
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-neutral-900 hover:text-neutral-700 dark:text-neutral-100 dark:hover:text-neutral-300"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 lg:hidden">
        {orders.map((order) => {
          const isExpanded = expandedOrders.has(order.id);
          const isAcknowledged = Boolean(order.acknowledgedAt);
          return (
            <div
              key={order.id}
              className={`rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 ${
                isAcknowledged ? "" : "bg-amber-50/60 dark:bg-amber-950/20"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {order.orderNumber}
                    </div>
                    {!isAcknowledged && (
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        New
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Price
                  amount={order.totalAmount.toString()}
                  currencyCode={order.currencyCode}
                  className="text-lg font-semibold"
                />
              </div>

              <div className="mb-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Customer:
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {order.customerName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Items:
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
              </div>

              <div className="mb-3 flex gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}
                >
                  {order.status}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getDeliveryStatusColor(order.deliveryStatus as DeliveryStatus)}`}
                >
                  {order.deliveryStatus}
                </span>
              </div>

              {isExpanded && (
                <div className="mb-3 space-y-2 border-t border-neutral-200 pt-3 text-sm dark:border-neutral-700">
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      Email:
                    </span>{" "}
                    {order.email}
                  </div>
                  {order.phone && (
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">
                        Phone:
                      </span>{" "}
                      {order.phone}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => toggleOrder(order.id)}
                  className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  {isExpanded ? "Show Less" : "Show More"}
                </button>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex-1 rounded-md bg-neutral-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  View Details
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col gap-4 border-t border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800 sm:px-6">
          {/* Mobile View */}
          <div className="flex flex-1 justify-between sm:hidden">
            <Link
              href={`/admin/orders?${buildQueryString(currentPage - 1)}`}
              className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                currentPage <= 1
                  ? "pointer-events-none text-neutral-400"
                  : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              Previous
            </Link>
            <Link
              href={`/admin/orders?${buildQueryString(currentPage + 1)}`}
              className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                currentPage >= totalPages
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
                  {(currentPage - 1) * perPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * perPage, total)}
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
                    if (searchParams.search)
                      params.set("search", searchParams.search);
                    if (searchParams.status && searchParams.status !== "all")
                      params.set("status", searchParams.status);
                    if (
                      searchParams.deliveryStatus &&
                      searchParams.deliveryStatus !== "all"
                    )
                      params.set("deliveryStatus", searchParams.deliveryStatus);
                    params.set("page", "1");
                    params.set("perPage", newPerPage);
                    window.location.href = `/admin/orders?${params.toString()}`;
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
                  href={`/admin/orders?${buildQueryString(currentPage - 1)}`}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-neutral-400 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 focus:z-20 focus:outline-offset-0 dark:ring-neutral-700 dark:hover:bg-neutral-700 ${
                    currentPage <= 1 ? "pointer-events-none" : ""
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
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  return (
                    <Link
                      key={pageNum}
                      href={`/admin/orders?${buildQueryString(pageNum)}`}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === pageNum
                          ? "z-10 bg-neutral-900 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-neutral-100 dark:text-neutral-900"
                          : "text-neutral-900 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 focus:z-20 focus:outline-offset-0 dark:text-neutral-100 dark:ring-neutral-700 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
                <Link
                  href={`/admin/orders?${buildQueryString(currentPage + 1)}`}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-neutral-400 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 focus:z-20 focus:outline-offset-0 dark:ring-neutral-700 dark:hover:bg-neutral-700 ${
                    currentPage >= totalPages ? "pointer-events-none" : ""
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
  );
}
