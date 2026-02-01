import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "components/admin/AdminNav";
import CollectionsManagement from "components/admin/CollectionsManagement";
import { db } from "lib/db";
import { collections, productCollections } from "lib/db/schema";
import { desc, ilike, inArray, or, sql } from "drizzle-orm";

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

  const whereClause = search
    ? or(
        ilike(collections.title, `%${search}%`),
        ilike(collections.handle, `%${search}%`),
        ilike(collections.description, `%${search}%`),
      )
    : undefined;

  const [collectionRows, totalResult] = await Promise.all([
    db
      .select({
        id: collections.id,
        handle: collections.handle,
        title: collections.title,
        description: collections.description,
        seoTitle: collections.seoTitle,
        seoDescription: collections.seoDescription,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
      })
      .from(collections)
      .where(whereClause)
      .orderBy(desc(collections.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db
      .select({ count: sql<number>`count(*)` })
      .from(collections)
      .where(whereClause),
  ]);

  const collectionIds = collectionRows.map((collection) => collection.id);
  const collectionCounts = collectionIds.length
    ? await db
        .select({
          collectionId: productCollections.collectionId,
          count: sql<number>`count(*)`,
        })
        .from(productCollections)
        .where(inArray(productCollections.collectionId, collectionIds))
        .groupBy(productCollections.collectionId)
    : [];

  const countsByCollection = new Map(
    collectionCounts.map((row) => [row.collectionId, Number(row.count)]),
  );

  const total = Number(totalResult[0]?.count ?? 0);
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
            collections={collectionRows.map((collection) => ({
              ...collection,
              _count: {
                productCollections: countsByCollection.get(collection.id) || 0,
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
