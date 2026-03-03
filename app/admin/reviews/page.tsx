import { redirect } from "next/navigation";
import { requireAdminSession } from "lib/admin-auth";
import AdminNav from "components/admin/AdminNav";
import ReviewsManagement from "components/admin/ReviewsManagement";

export default async function AdminReviewsPage() {
  const session = await requireAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="reviews" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              Product Reviews
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Moderate submitted reviews and control what appears on product
              pages.
            </p>
          </div>

          <ReviewsManagement />
        </div>
      </div>
    </div>
  );
}
