import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "lib/auth";
import prisma from "lib/prisma";
import AdminNav from "components/admin/AdminNav";
import CustomOrdersManagement from "components/admin/CustomOrdersManagement";

const toDetailsArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

export default async function AdminCustomOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const customOrders = await prisma.customOrder.findMany({
    orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
  });

  const mappedOrders = customOrders.map((order) => ({
    ...order,
    details: toDetailsArray(order.details),
  }));

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="custom-orders" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              Custom Orders
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Manage the customer stories shown on the Custom Orders page.
            </p>
          </div>

          <CustomOrdersManagement customOrders={mappedOrders} />
        </div>
      </div>
    </div>
  );
}
