import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect, notFound } from "next/navigation";
import AdminNav from "components/admin/AdminNav";
import OrderDetailView from "components/admin/OrderDetailView";
import prisma from "lib/prisma";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="orders" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <OrderDetailView order={order} />
        </div>
      </div>
    </div>
  );
}
