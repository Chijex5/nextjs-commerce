import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect, notFound } from "next/navigation";
import AdminNav from "components/admin/AdminNav";
import OrderDetailView from "components/admin/OrderDetailView";
import { db } from "lib/db";
import { customOrderRequests, orderItems, orders, users } from "lib/db/schema";
import { eq } from "drizzle-orm";

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

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    notFound();
  }

  const [items, user, customRequest] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    order.userId
      ? db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
          })
          .from(users)
          .where(eq(users.id, order.userId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
    order.customOrderRequestId
      ? db
          .select({ requestNumber: customOrderRequests.requestNumber })
          .from(customOrderRequests)
          .where(eq(customOrderRequests.id, order.customOrderRequestId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNav currentPage="orders" userEmail={session.user?.email} />

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <OrderDetailView
            order={{
              ...order,
              customRequestNumber: customRequest?.requestNumber || null,
              items,
              user,
            }}
          />
        </div>
      </div>
    </div>
  );
}
