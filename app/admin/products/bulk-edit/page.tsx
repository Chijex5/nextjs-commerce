import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "../../../../components/admin/AdminNav";
import BulkProductEditor from "../../../../components/admin/BulkProductEditor";

export default async function BulkEditPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const selectedIds = params.ids ? params.ids.split(",") : [];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="products" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                  {selectedIds.length > 0
                    ? `Bulk Edit (${selectedIds.length} products)`
                    : "Bulk Create Products"}
                </h1>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {selectedIds.length > 0
                    ? "Edit multiple products in spreadsheet-style grid."
                    : "Create multiple products quickly. Desktop optimized."}
                </p>
              </div>
            </div>
          </div>

          {/* Bulk Editor Component */}
          <BulkProductEditor selectedIds={selectedIds} />
        </div>
      </div>
    </div>
  );
}
