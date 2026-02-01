import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "components/admin/AdminNav";
import UsersTable from "components/admin/UsersTable";
import { db } from "lib/db";
import { orders, users } from "lib/db/schema";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    perPage?: string;
    status?: string;
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

  const filters = [];

  if (statusFilter === "active") {
    filters.push(eq(users.isActive, true));
  } else if (statusFilter === "inactive") {
    filters.push(eq(users.isActive, false));
  }

  if (search) {
    const searchValue = `%${search}%`;
    filters.push(
      or(
        ilike(users.email, searchValue),
        ilike(users.name, searchValue),
        ilike(users.phone, searchValue),
      ),
    );
  }

  const whereClause = filters.length ? and(...filters) : undefined;

  const [userRows, totalResult, stats] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        isActive: users.isActive,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause),
    Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isActive, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isActive, false)),
    ]),
  ]);

  const userIds = userRows.map((user) => user.id);
  const orderCounts = userIds.length
    ? await db
        .select({
          userId: orders.userId,
          count: sql<number>`count(*)`,
        })
        .from(orders)
        .where(inArray(orders.userId, userIds))
        .groupBy(orders.userId)
    : [];

  const countsByUser = new Map(
    orderCounts.map((row) => [row.userId, Number(row.count)]),
  );

  const [totalUsersResult, activeUsersResult, inactiveUsersResult] = stats;
  const totalUsers = Number(totalUsersResult[0]?.count ?? 0);
  const activeUsers = Number(activeUsersResult[0]?.count ?? 0);
  const inactiveUsers = Number(inactiveUsersResult[0]?.count ?? 0);

  const total = Number(totalResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="users" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              Users
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Manage customer accounts and view user activity ({total} total)
            </p>
          </div>

          {/* Stats Overview */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Total Users
              </div>
              <div className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {totalUsers}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Active Users
              </div>
              <div className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                {activeUsers}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Inactive Users
              </div>
              <div className="mt-1 text-2xl font-semibold text-neutral-600 dark:text-neutral-400">
                {inactiveUsers}
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-6">
            <form
              action="/admin/users"
              method="get"
              className="flex flex-col gap-4 sm:flex-row"
            >
              <div className="flex-1">
                <input
                  type="search"
                  name="search"
                  placeholder="Search by name, email, or phone..."
                  defaultValue={search}
                  className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <select
                name="status"
                defaultValue={statusFilter}
                className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                type="submit"
                className="rounded-md bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Filter
              </button>
            </form>
          </div>

          {/* Users Table */}
          <UsersTable
            users={userRows.map((user) => ({
              ...user,
              _count: {
                orders: countsByUser.get(user.id) || 0,
              },
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
