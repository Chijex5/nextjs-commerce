import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "components/admin/AdminNav";
import AdminsManagement from "components/admin/AdminsManagement";
import { db } from "lib/db";
import { adminUsers } from "lib/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

export default async function AdminAdminsPage({
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
    filters.push(eq(adminUsers.isActive, true));
  } else if (statusFilter === "inactive") {
    filters.push(eq(adminUsers.isActive, false));
  }

  if (search) {
    const searchValue = `%${search}%`;
    filters.push(
      or(
        ilike(adminUsers.email, searchValue),
        ilike(adminUsers.name, searchValue),
      ),
    );
  }

  const whereClause = filters.length ? and(...filters) : undefined;

  const [admins, totalResult, totalStats] = await Promise.all([
    db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        createdAt: adminUsers.createdAt,
        lastLoginAt: adminUsers.lastLoginAt,
      })
      .from(adminUsers)
      .where(whereClause)
      .orderBy(desc(adminUsers.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db
      .select({ count: sql<number>`count(*)` })
      .from(adminUsers)
      .where(whereClause),
    Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(adminUsers),
      db
        .select({ count: sql<number>`count(*)` })
        .from(adminUsers)
        .where(eq(adminUsers.isActive, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(adminUsers)
        .where(eq(adminUsers.isActive, false)),
    ]),
  ]);

  const [totalAdminsResult, activeAdminsResult, inactiveAdminsResult] =
    totalStats;
  const totalAdmins = Number(totalAdminsResult[0]?.count ?? 0);
  const activeAdmins = Number(activeAdminsResult[0]?.count ?? 0);
  const inactiveAdmins = Number(inactiveAdminsResult[0]?.count ?? 0);

  const total = Number(totalResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="admins" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                Admin Management
              </h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Manage admin accounts and permissions ({total} total)
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Total Admins
              </div>
              <div className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {totalAdmins}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Active Admins
              </div>
              <div className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                {activeAdmins}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Inactive Admins
              </div>
              <div className="mt-1 text-2xl font-semibold text-neutral-600 dark:text-neutral-400">
                {inactiveAdmins}
              </div>
            </div>
          </div>

          {/* Admins Management Component */}
          <AdminsManagement
            admins={admins}
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
