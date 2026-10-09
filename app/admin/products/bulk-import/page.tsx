import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "../../../../components/admin/AdminNav";
import BulkImportWizard from "../../../../components/admin/BulkImportWizard";

export default async function BulkImportPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-plate">
      <AdminNav currentPage="products" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              Bulk Import Products
            </h1>
            <p className="mt-1 text-sm text-fg-2">
              Upload multiple products at once using a CSV file. Perfect for
              adding 200+ products efficiently.
            </p>
          </div>

          <BulkImportWizard />
        </div>
      </div>
    </div>
  );
}
