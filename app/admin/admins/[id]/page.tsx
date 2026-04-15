import AdminNav from "components/admin/AdminNav";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { adminUsers, orders } from "lib/db/schema";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
    case "pending":
    case "processing":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
    default:
      return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
  }
}

export default async function AdminAdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const [admin] = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
      createdAt: adminUsers.createdAt,
      updatedAt: adminUsers.updatedAt,
      lastLoginAt: adminUsers.lastLoginAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);

  if (!admin) {
    notFound();
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    summaryRows,
    recentAcknowledgedOrders,
    statusBreakdownRows,
    recent30dRows,
  ] = await Promise.all([
    db
      .select({
        totalAcknowledged: sql<number>`count(*)`,
        totalValue: sql<string>`coalesce(sum(${orders.totalAmount}), '0')`,
        firstAcknowledgedAt: sql<Date | null>`min(${orders.acknowledgedAt})`,
        lastAcknowledgedAt: sql<Date | null>`max(${orders.acknowledgedAt})`,
      })
      .from(orders)
      .where(eq(orders.acknowledgedBy, admin.email)),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        deliveryStatus: orders.deliveryStatus,
        customerName: orders.customerName,
        email: orders.email,
        totalAmount: orders.totalAmount,
        acknowledgedAt: orders.acknowledgedAt,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.acknowledgedBy, admin.email))
      .orderBy(desc(orders.acknowledgedAt), desc(orders.createdAt))
      .limit(15),
    db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(eq(orders.acknowledgedBy, admin.email))
      .groupBy(orders.status)
      .orderBy(desc(sql<number>`count(*)`)),
    db
      .select({
        recentCount: sql<number>`count(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.acknowledgedBy, admin.email),
          gte(orders.acknowledgedAt, thirtyDaysAgo),
        ),
      ),
  ]);

  const summary = summaryRows[0] || {
    totalAcknowledged: 0,
    totalValue: "0",
    firstAcknowledgedAt: null,
    lastAcknowledgedAt: null,
  };

  const recent30dCount = Number(recent30dRows[0]?.recentCount ?? 0);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="admins" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href="/admin/admins"
                className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                Back to Admins
              </Link>
              <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                {admin.name || admin.email}
              </h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {admin.email}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                admin.isActive
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
              }`}
            >
              {admin.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Role
              </p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {admin.role}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Handled Orders
              </p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {Number(summary.totalAcknowledged)}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Handled Value
              </p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {formatMoney(Number(summary.totalValue))}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Handled (30d)
              </p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {recent30dCount}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Last Login
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {formatDate(admin.lastLoginAt)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Account Profile
              </h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Admin ID
                  </dt>
                  <dd className="max-w-[60%] truncate text-right">
                    {admin.id}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Email
                  </dt>
                  <dd>{admin.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Name
                  </dt>
                  <dd>{admin.name || "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Role
                  </dt>
                  <dd>{admin.role}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Created
                  </dt>
                  <dd>{formatDate(admin.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Updated
                  </dt>
                  <dd>{formatDate(admin.updatedAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    First Acknowledgement
                  </dt>
                  <dd>{formatDate(summary.firstAcknowledgedAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Last Acknowledgement
                  </dt>
                  <dd>{formatDate(summary.lastAcknowledgedAt)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Acknowledged Order Status Mix
              </h2>
              {statusBreakdownRows.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                  No acknowledged orders found for this admin.
                </p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm">
                  {statusBreakdownRows.map((row) => (
                    <li
                      key={row.status}
                      className="flex items-center justify-between"
                    >
                      <span className="capitalize text-neutral-700 dark:text-neutral-300">
                        {row.status}
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {Number(row.count)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Recent Acknowledged Orders
            </h2>
            {recentAcknowledgedOrders.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                This admin has not acknowledged any orders yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Order
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Customer
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Delivery
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Total
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Acknowledged
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {recentAcknowledgedOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-3 py-2 text-sm">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                          <div>{order.customerName}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {order.email}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                          {order.deliveryStatus}
                        </td>
                        <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                          {formatMoney(Number(order.totalAmount))}
                        </td>
                        <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                          {formatDate(order.acknowledgedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
