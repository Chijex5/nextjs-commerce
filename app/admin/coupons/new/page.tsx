import { CouponForm } from "components/admin/coupons/coupon-form";
import { Page, PageHeader } from "components/admin/ui";
import { authOptions } from "lib/auth";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewCouponPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  return (
    <Page>
      <Link
        href="/admin/coupons"
        className="label mb-4 inline-flex items-center gap-1.5 text-fg-3 hover:text-fg"
      >
        <ArrowLeft className="size-3.5" /> Coupons
      </Link>
      <PageHeader eyebrow="Marketing" title="New coupon" />
      <CouponForm />
    </Page>
  );
}
