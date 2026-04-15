import AdminNav from "components/admin/AdminNav";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { orders, paymentTransactions, users } from "lib/db/schema";
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

function badgeClass(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
    case "success":
    case "verified":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
    case "pending":
    case "processing":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
    case "cancelled":
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
    default:
      return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
  }
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      hasPassword: users.hasPassword,
      shippingAddress: users.shippingAddress,
      billingAddress: users.billingAddress,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    notFound();
  }

  const [
    summaryRows,
    statusBreakdown,
    recentOrders,
    couponUsage,
    paymentSummaryRows,
    recentPayments,
  ] = await Promise.all([
    db
      .select({
        orderCount: sql<number>`count(*)`,
        totalSpent: sql<string>`coalesce(sum(${orders.totalAmount}), '0')`,
        totalDiscount: sql<string>`coalesce(sum(${orders.discountAmount}), '0')`,
        firstOrderAt: sql<Date | null>`min(${orders.createdAt})`,
        lastOrderAt: sql<Date | null>`max(${orders.createdAt})`,
      })
      .from(orders)
      .where(eq(orders.userId, id)),
    db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(eq(orders.userId, id))
      .groupBy(orders.status)
      .orderBy(desc(sql<number>`count(*)`)),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        deliveryStatus: orders.deliveryStatus,
        totalAmount: orders.totalAmount,
        discountAmount: orders.discountAmount,
        couponCode: orders.couponCode,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, id))
      .orderBy(desc(orders.createdAt))
      .limit(12),
    db
      .select({
        couponCode: orders.couponCode,
        usageCount: sql<number>`count(*)`,
        discountTotal: sql<string>`coalesce(sum(${orders.discountAmount}), '0')`,
      })
      .from(orders)
      .where(and(eq(orders.userId, id), isNotNull(orders.couponCode)))
      .groupBy(orders.couponCode)
      .orderBy(desc(sql<number>`count(*)`)),
    db
      .select({
        transactionCount: sql<number>`count(*)`,
        totalAmountKobo: sql<number>`coalesce(sum(${paymentTransactions.amount}), 0)`,
        successfulCount: sql<number>`count(*) filter (where ${paymentTransactions.status} in ('success', 'verified'))`,
      })
      .from(paymentTransactions)
      .innerJoin(orders, eq(paymentTransactions.orderId, orders.id))
      .where(eq(orders.userId, id)),
    db
      .select({
        id: paymentTransactions.id,
        reference: paymentTransactions.reference,
        status: paymentTransactions.status,
        amountKobo: paymentTransactions.amount,
        provider: paymentTransactions.provider,
        source: paymentTransactions.source,
        createdAt: paymentTransactions.createdAt,
        orderId: orders.id,
        orderNumber: orders.orderNumber,
      })
      .from(paymentTransactions)
      .innerJoin(orders, eq(paymentTransactions.orderId, orders.id))
      .where(eq(orders.userId, id))
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(12),
  ]);

  const summary = summaryRows[0] || {
    orderCount: 0,
    totalSpent: "0",
    totalDiscount: "0",
    firstOrderAt: null,
    lastOrderAt: null,
  };

  const paymentSummary = paymentSummaryRows[0] || {
    transactionCount: 0,
    totalAmountKobo: 0,
    successfulCount: 0,
  };

  const averageOrderValue =
    Number(summary.orderCount) > 0
      ? Number(summary.totalSpent) / Number(summary.orderCount)
      : 0;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="users" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href="/admin/users"
                className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                Back to Users
              </Link>
              <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                {user.name || "Unnamed User"}
              </h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {user.email}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                user.isActive
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
              }`}
            >
              {user.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Orders
              </p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {Number(summary.orderCount)}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Lifetime Spend
              </p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {formatMoney(Number(summary.totalSpent))}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Avg Order Value
              </p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {formatMoney(averageOrderValue)}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Total Discount
              </p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {formatMoney(Number(summary.totalDiscount))}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Payments
              </p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {Number(paymentSummary.transactionCount)}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Successful Payments
              </p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {Number(paymentSummary.successfulCount)}
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
                    User ID
                  </dt>
                  <dd className="max-w-[60%] truncate text-right">{user.id}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Email
                  </dt>
                  <dd>{user.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Name
                  </dt>
                  <dd>{user.name || "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Phone
                  </dt>
                  <dd>{user.phone || "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Password Login
                  </dt>
                  <dd>{user.hasPassword ? "Enabled" : "Magic-link only"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Created
                  </dt>
                  <dd>{formatDate(user.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Updated
                  </dt>
                  <dd>{formatDate(user.updatedAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Last Login
                  </dt>
                  <dd>{formatDate(user.lastLoginAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    First Order
                  </dt>
                  <dd>{formatDate(summary.firstOrderAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Last Order
                  </dt>
                  <dd>{formatDate(summary.lastOrderAt)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Address Snapshot
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Shipping Address
                  </h3>
                  {user.shippingAddress ? (
                    <pre className="mt-2 overflow-x-auto rounded-md bg-neutral-100 p-3 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                      {JSON.stringify(user.shippingAddress, null, 2)}
                    </pre>
                  ) : (
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                      No shipping address saved.
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Billing Address
                  </h3>
                  {user.billingAddress ? (
                    <pre className="mt-2 overflow-x-auto rounded-md bg-neutral-100 p-3 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                      {JSON.stringify(user.billingAddress, null, 2)}
                    </pre>
                  ) : (
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                      No billing address saved.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Order Status Breakdown
              </h2>
              {statusBreakdown.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                  No orders yet.
                </p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm">
                  {statusBreakdown.map((row) => (
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

            <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Coupon Usage
              </h2>
              {couponUsage.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                  No coupon usage found.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                          Coupon
                        </th>
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                          Uses
                        </th>
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                          Discount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {couponUsage.map((row) => (
                        <tr key={row.couponCode || "unknown"}>
                          <td className="px-3 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {row.couponCode}
                          </td>
                          <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                            {Number(row.usageCount)}
                          </td>
                          <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                            {formatMoney(Number(row.discountTotal))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Recent Orders
            </h2>
            {recentOrders.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                No orders found for this user.
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
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Delivery
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Total
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Coupon
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-3 py-2 text-sm">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(order.status)}`}
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
                          {order.couponCode || "-"}
                        </td>
                        <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Recent Payment Transactions
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Total paid across linked transactions:{" "}
              {formatMoney(Number(paymentSummary.totalAmountKobo) / 100)}
            </p>
            {recentPayments.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                No payment transactions linked to this user yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Reference
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Source
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Order
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {recentPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-3 py-2 text-sm">
                          <Link
                            href={`/admin/payments/${payment.id}`}
                            className="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                          >
                            {payment.reference}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(payment.status)}`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                          {payment.provider} / {payment.source}
                        </td>
                        <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                          {formatMoney(Number(payment.amountKobo) / 100)}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {payment.orderId && payment.orderNumber ? (
                            <Link
                              href={`/admin/orders/${payment.orderId}`}
                              className="text-neutral-900 hover:underline dark:text-neutral-100"
                            >
                              {payment.orderNumber}
                            </Link>
                          ) : (
                            <span className="text-neutral-500 dark:text-neutral-400">
                              -
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                          {new Date(payment.createdAt).toLocaleString()}
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
