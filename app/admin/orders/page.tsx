import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "components/admin/AdminNav";
import OrdersTable from "components/admin/OrdersTable";
import { db } from "lib/db";
import { customOrderRequests, orderItems, orders } from "lib/db/schema";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    perPage?: string;
    status?: string;
    deliveryStatus?: string;
    orderType?: string;
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
  const statusFilter = params.status || "all";
  const deliveryStatusFilter = params.deliveryStatus || "all";
  const orderTypeFilter = params.orderType || "all";

  const filters = [];

  if (statusFilter !== "all") {
    filters.push(eq(orders.status, statusFilter));
  }

  if (deliveryStatusFilter !== "all") {
    filters.push(eq(orders.deliveryStatus, deliveryStatusFilter));
  }

  if (orderTypeFilter !== "all") {
    filters.push(eq(orders.orderType, orderTypeFilter));
  }

  if (search) {
    const searchValue = `%${search}%`;
    filters.push(
      or(
        ilike(orders.orderNumber, searchValue),
        ilike(orders.customerName, searchValue),
        ilike(orders.email, searchValue),
      ),
    );
  }

  const whereClause = filters.length ? and(...filters) : undefined;

  const [orderRows, totalResult, stats] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause),
    db
      .select({ deliveryStatus: orders.deliveryStatus, count: sql<number>`count(*)` })
      .from(orders)
      .groupBy(orders.deliveryStatus),
  ]);

  const orderIds = orderRows.map((order) => order.id);
  const orderItemRows = orderIds.length
    ? await db
        .select({ orderId: orderItems.orderId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds))
    : [];

  const customRequestIds = orderRows
    .map((order) => order.customOrderRequestId)
    .filter((value): value is string => Boolean(value));
  const customRequestRows = customRequestIds.length
    ? await db
        .select({
          id: customOrderRequests.id,
          requestNumber: customOrderRequests.requestNumber,
        })
        .from(customOrderRequests)
        .where(inArray(customOrderRequests.id, customRequestIds))
    : [];
  const customRequestMap = new Map(
    customRequestRows.map((row) => [row.id, row.requestNumber]),
  );

  const itemsByOrder = orderItemRows.reduce<Record<string, { quantity: number }[]>>(
    (acc, item) => {
      const items = (acc[item.orderId] ??= []);
      items.push({ quantity: item.quantity });
      return acc;
    },
    {},
  );

  const deliveryStats = stats.reduce(
    (acc, item) => {
      acc[item.deliveryStatus] = Number(item.count);
      return acc;
    },
    {} as Record<string, number>,
  );

  const total = Number(totalResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="orders" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              Orders
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Manage customer orders and delivery status ({total} total)
            </p>
          </div>

          {/* Stats Overview */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Production
              </div>
              <div className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">
                {deliveryStats.production || 0}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Sorting
              </div>
              <div className="mt-1 text-2xl font-semibold text-purple-600 dark:text-purple-400">
                {deliveryStats.sorting || 0}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Dispatch
              </div>
              <div className="mt-1 text-2xl font-semibold text-orange-600 dark:text-orange-400">
                {deliveryStats.dispatch || 0}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Paused
              </div>
              <div className="mt-1 text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                {deliveryStats.paused || 0}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Completed
              </div>
              <div className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                {deliveryStats.completed || 0}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Cancelled
              </div>
              <div className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
                {deliveryStats.cancelled || 0}
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-6 space-y-4">
            <form
              action="/admin/orders"
              method="get"
              className="flex flex-col gap-4 sm:flex-row"
            >
              <div className="flex-1">
                <input
                  type="search"
                  name="search"
                  placeholder="Search by order number, customer name, or email..."
                  defaultValue={search}
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <select
                name="deliveryStatus"
                defaultValue={deliveryStatusFilter}
                className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="all">All Delivery Status</option>
                <option value="production">Production</option>
                <option value="sorting">Sorting</option>
                <option value="dispatch">Dispatch</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                name="status"
                defaultValue={statusFilter}
                className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="all">All Order Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                name="orderType"
                defaultValue={orderTypeFilter}
                className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="all">All Order Types</option>
                <option value="catalog">Catalog</option>
                <option value="custom">Custom</option>
              </select>
              <button
                type="submit"
                className="rounded-md bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Filter
              </button>
            </form>
          </div>

          {/* Orders Table */}
          <OrdersTable
            orders={orderRows.map((order) => ({
              ...order,
              customRequestNumber: order.customOrderRequestId
                ? customRequestMap.get(order.customOrderRequestId) || null
                : null,
              items: itemsByOrder[order.id] || [],
            }))}
            currentPage={page}
            totalPages={totalPages}
            total={total}
            perPage={perPage}
            searchParams={params}
          />
        </div>
      </div>
    </div>
  );
}
