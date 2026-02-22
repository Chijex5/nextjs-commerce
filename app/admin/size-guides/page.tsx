import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import SizeGuidesPageClient from "./size-guides";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminSizeGuidesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="size-guides" userEmail={session.user?.email} />
      <SizeGuidesPageClient />
    </div>
  );
}
