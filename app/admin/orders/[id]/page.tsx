import { OrderDetail } from "components/admin/orders/order-detail";
import { and, eq, ne, or, sql } from "drizzle-orm";
import { authOptions } from "lib/auth";
import { db } from "lib/db";
import {
  customOrderRequests,
  orderItems,
  orders,
  paymentTransactions,
} from "lib/db/schema";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  if (!order) notFound();

  const [items, customRequest, payment, [history]] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    order.customOrderRequestId
      ? db
          .select({
            id: customOrderRequests.id,
            requestNumber: customOrderRequests.requestNumber,
          })
          .from(customOrderRequests)
          .where(eq(customOrderRequests.id, order.customOrderRequestId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : null,
    db
      .select({
        id: paymentTransactions.id,
        reference: paymentTransactions.reference,
        status: paymentTransactions.status,
        amount: paymentTransactions.amount,
        conflictCode: paymentTransactions.conflictCode,
        conflictMessage: paymentTransactions.conflictMessage,
        updatedAt: paymentTransactions.updatedAt,
      })
      .from(paymentTransactions)
      .where(
        order.paymentTransactionId
          ? or(
              eq(paymentTransactions.id, order.paymentTransactionId),
              eq(paymentTransactions.orderId, order.id),
            )
          : eq(paymentTransactions.orderId, order.id),
      )
      .limit(1)
      .then((r) => r[0] ?? null),
    // The customer's other paid orders, matched by email like Shopify does.
    db
      .select({
        orders: sql<number>`count(*)`,
        spent: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
        first: sql<string | null>`min(${orders.createdAt})::text`,
      })
      .from(orders)
      .where(
        and(
          sql`lower(${orders.email}) = lower(${order.email})`,
          ne(orders.status, "cancelled"),
        ),
      ),
  ]);

  return (
    <OrderDetail
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        customerName: order.customerName,
        email: order.email,
        phone: order.phone,
        userId: order.userId,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        estimatedArrival: order.estimatedArrival?.toISOString() ?? null,
        shippingAddress: (order.shippingAddress ?? {}) as Record<
          string,
          string | undefined
        >,
        subtotal: Number(order.subtotalAmount),
        discount: Number(order.discountAmount),
        couponCode: order.couponCode,
        shipping: Number(order.shippingAmount),
        tax: Number(order.taxAmount),
        total: Number(order.totalAmount),
        notes: order.notes,
        trackingNumber: order.trackingNumber,
        acknowledgedAt: order.acknowledgedAt?.toISOString() ?? null,
        acknowledgedBy: order.acknowledgedBy,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: items.map((i) => ({
          id: i.id,
          productId: i.productId,
          title: i.productTitle,
          variant: i.variantTitle,
          quantity: i.quantity,
          price: Number(i.price),
          total: Number(i.totalAmount),
          image: i.productImage,
        })),
        customRequest,
        payment: payment
          ? {
              ...payment,
              amount: payment.amount / 100,
              updatedAt: payment.updatedAt.toISOString(),
            }
          : null,
        customer: {
          orders: Number(history?.orders ?? 0),
          spent: Number(history?.spent ?? 0),
          firstOrderAt: history?.first
            ? new Date(history.first.replace(" ", "T") + "Z").toISOString()
            : null,
        },
      }}
    />
  );
}
