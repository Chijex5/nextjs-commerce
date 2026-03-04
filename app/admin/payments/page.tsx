import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import AdminNav from "components/admin/AdminNav";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import { orders, paymentTransactions } from "lib/db/schema";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    source?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
    perPage?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page || 1));
  const perPage = Math.min(100, Math.max(10, Number(params.perPage || 20)));
  const statusFilter = params.status || "all";
  const sourceFilter = params.source || "all";
  const search = params.search?.trim() || "";

  const filters = [];

  if (statusFilter !== "all") {
    filters.push(eq(paymentTransactions.status, statusFilter));
  }

  if (sourceFilter !== "all") {
    filters.push(eq(paymentTransactions.source, sourceFilter));
  }

  if (search) {
    const like = `%${search}%`;
    filters.push(
      or(
        ilike(paymentTransactions.reference, like),
        ilike(paymentTransactions.conflictCode, like),
        ilike(orders.orderNumber, like),
      ),
    );
  }

  if (params.dateFrom) {
    const parsed = new Date(params.dateFrom);
    if (!Number.isNaN(parsed.getTime())) {
      filters.push(gte(paymentTransactions.createdAt, parsed));
    }
  }

  if (params.dateTo) {
    const parsed = new Date(params.dateTo);
    if (!Number.isNaN(parsed.getTime())) {
      filters.push(lte(paymentTransactions.createdAt, parsed));
    }
  }

  const whereClause = filters.length ? and(...filters) : undefined;

  const [rows, totalRows, conflictRows] = await Promise.all([
    db
      .select({
        id: paymentTransactions.id,
        reference: paymentTransactions.reference,
        source: paymentTransactions.source,
        status: paymentTransactions.status,
        amount: paymentTransactions.amount,
        currencyCode: paymentTransactions.currencyCode,
        paystackStatus: paymentTransactions.paystackStatus,
        conflictCode: paymentTransactions.conflictCode,
        conflictMessage: paymentTransactions.conflictMessage,
        orderId: paymentTransactions.orderId,
        orderNumber: orders.orderNumber,
        updatedAt: paymentTransactions.updatedAt,
        createdAt: paymentTransactions.createdAt,
      })
      .from(paymentTransactions)
      .leftJoin(orders, eq(paymentTransactions.orderId, orders.id))
      .where(whereClause)
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db
      .select({ count: sql<number>`count(*)` })
      .from(paymentTransactions)
      .leftJoin(orders, eq(paymentTransactions.orderId, orders.id))
      .where(whereClause),
    db
      .select({ count: sql<number>`count(*)` })
      .from(paymentTransactions)
      .where(eq(paymentTransactions.status, "conflict")),
  ]);

  const total = Number(totalRows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const conflictCount = Number(conflictRows[0]?.count ?? 0);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="payments" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                Payments
              </h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Paystack transaction ledger and conflict queue.
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
              Conflicts: <strong>{conflictCount}</strong>
            </div>
          </div>

          <form
            action="/admin/payments"
            method="get"
            className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 md:grid-cols-6"
          >
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Reference / order / conflict"
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 md:col-span-2"
            />
            <select
              name="status"
              defaultValue={statusFilter}
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            >
              <option value="all">All Statuses</option>
              <option value="initialized">Initialized</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="conflict">Conflict</option>
              <option value="failed">Failed</option>
            </select>
            <select
              name="source"
              defaultValue={sourceFilter}
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            >
              <option value="all">All Sources</option>
              <option value="catalog_checkout">Catalog Checkout</option>
              <option value="custom_quote">Custom Quote</option>
            </select>
            <input
              type="date"
              name="dateFrom"
              defaultValue={params.dateFrom}
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <input
              type="date"
              name="dateTo"
              defaultValue={params.dateTo}
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <input type="hidden" name="perPage" value={String(perPage)} />
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              Filter
            </button>
          </form>

          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-neutral-500">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-neutral-500">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-neutral-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-neutral-500">
                    Paystack
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-neutral-500">
                    Local
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-neutral-500">
                    Linked Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-neutral-500">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-neutral-500">
                    Conflict
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100">
                      <Link
                        href={`/admin/payments/${row.id}`}
                        className="font-mono text-xs hover:underline"
                      >
                        {row.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                      {row.source}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                      {row.currencyCode} {(Number(row.amount) / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                      {row.paystackStatus || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-xs dark:border-neutral-700">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                      {row.orderId && row.orderNumber ? (
                        <Link href={`/admin/orders/${row.orderId}`} className="hover:underline">
                          {row.orderNumber}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                      {row.updatedAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                      {row.conflictCode ? (
                        <span title={row.conflictMessage || undefined}>
                          {row.conflictCode}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300">
            <div>
              Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={`/admin/payments?${new URLSearchParams({
                    ...Object.fromEntries(
                      Object.entries({
                        status: statusFilter,
                        source: sourceFilter,
                        search,
                        dateFrom: params.dateFrom || "",
                        dateTo: params.dateTo || "",
                        perPage: String(perPage),
                        page: String(page - 1),
                      }).filter(([, value]) => value && value !== "all"),
                    ),
                  }).toString()}`}
                  className="rounded border border-neutral-300 px-3 py-1 dark:border-neutral-700"
                >
                  Previous
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link
                  href={`/admin/payments?${new URLSearchParams({
                    ...Object.fromEntries(
                      Object.entries({
                        status: statusFilter,
                        source: sourceFilter,
                        search,
                        dateFrom: params.dateFrom || "",
                        dateTo: params.dateTo || "",
                        perPage: String(perPage),
                        page: String(page + 1),
                      }).filter(([, value]) => value && value !== "all"),
                    ),
                  }).toString()}`}
                  className="rounded border border-neutral-300 px-3 py-1 dark:border-neutral-700"
                >
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
