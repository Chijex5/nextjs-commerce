import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import ReviewsPageClient from "./reviews";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="reviews" userEmail={session.user?.email} />
      <ReviewsPageClient />
    </div>
  );
}
