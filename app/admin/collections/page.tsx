import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "components/admin/AdminNav";
import CollectionsManagement from "components/admin/CollectionsManagement";
import prisma from "lib/prisma";

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1");
  const perPage = 20;

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" as const } },
      { handle: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
    ];
  }

  const [collections, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      select: {
        id: true,
        handle: true,
        title: true,
        description: true,
        seoTitle: true,
        seoDescription: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { productCollections: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.collection.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="collections" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                Collections
              </h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Manage product collections and categories ({total} total)
              </p>
            </div>
          </div>

          {/* Collections Management Component */}
          <CollectionsManagement
            collections={collections}
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
