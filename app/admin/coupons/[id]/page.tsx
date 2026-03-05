import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import CouponDetailClient from "./coupon-detail";

export default async function AdminCouponDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="coupons" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CouponDetailClient couponId={id} />
        </div>
      </div>
    </div>
  );
}
