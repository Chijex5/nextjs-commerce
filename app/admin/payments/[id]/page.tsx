import AdminNav from "components/admin/AdminNav";
import PaymentDetailActions from "components/admin/PaymentDetailActions";
import { desc, eq } from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { orders, paymentEvents, paymentTransactions } from "lib/db/schema";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const [payment] = await db
    .select({
      id: paymentTransactions.id,
      provider: paymentTransactions.provider,
      reference: paymentTransactions.reference,
      source: paymentTransactions.source,
      status: paymentTransactions.status,
      amount: paymentTransactions.amount,
      currencyCode: paymentTransactions.currencyCode,
      metadata: paymentTransactions.metadata,
      paystackStatus: paymentTransactions.paystackStatus,
      customer: paymentTransactions.customer,
      payload: paymentTransactions.payload,
      conflictCode: paymentTransactions.conflictCode,
      conflictMessage: paymentTransactions.conflictMessage,
      orderId: paymentTransactions.orderId,
      createdAt: paymentTransactions.createdAt,
      updatedAt: paymentTransactions.updatedAt,
      lastVerifiedAt: paymentTransactions.lastVerifiedAt,
      resolvedAt: paymentTransactions.resolvedAt,
      orderNumber: orders.orderNumber,
      orderEmail: orders.email,
      orderCustomerName: orders.customerName,
    })
    .from(paymentTransactions)
    .leftJoin(orders, eq(paymentTransactions.orderId, orders.id))
    .where(eq(paymentTransactions.id, id))
    .limit(1);

  if (!payment) {
    notFound();
  }

  const events = await db
    .select()
    .from(paymentEvents)
    .where(eq(paymentEvents.paymentTransactionId, payment.id))
    .orderBy(desc(paymentEvents.createdAt));

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="payments" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link
                href="/admin/payments"
                className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                Back to Payments
              </Link>
              <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Payment {payment.reference}
              </h1>
            </div>
            <PaymentDetailActions
              paymentId={payment.id}
              provider={payment.provider}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Transaction
              </h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Provider
                  </dt>
                  <dd>{payment.provider}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Source
                  </dt>
                  <dd>{payment.source}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Status
                  </dt>
                  <dd>{payment.status}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Paystack Status
                  </dt>
                  <dd>{payment.paystackStatus || "-"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Amount
                  </dt>
                  <dd>
                    {payment.currencyCode}{" "}
                    {(Number(payment.amount) / 100).toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Created
                  </dt>
                  <dd>{payment.createdAt.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Updated
                  </dt>
                  <dd>{payment.updatedAt.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Last Verified
                  </dt>
                  <dd>{payment.lastVerifiedAt?.toLocaleString() || "-"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    Resolved
                  </dt>
                  <dd>{payment.resolvedAt?.toLocaleString() || "-"}</dd>
                </div>
              </dl>

              {payment.conflictCode ? (
                <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                  <div className="font-semibold">{payment.conflictCode}</div>
                  <div>{payment.conflictMessage || "No conflict message"}</div>
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Linked Order
              </h2>
              {payment.orderId && payment.orderNumber ? (
                <div className="mt-4 space-y-2 text-sm">
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      Order:
                    </span>{" "}
                    <Link
                      href={`/admin/orders/${payment.orderId}`}
                      className="font-medium hover:underline"
                    >
                      {payment.orderNumber}
                    </Link>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      Customer:
                    </span>{" "}
                    {payment.orderCustomerName || "-"}
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      Email:
                    </span>{" "}
                    {payment.orderEmail || "-"}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                  No linked order yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Event History
            </h2>
            {events.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                No events recorded.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Time
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                          {event.createdAt.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                          {event.eventType}
                        </td>
                        <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                          {event.status}
                        </td>
                        <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                          {event.message || "-"}
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
