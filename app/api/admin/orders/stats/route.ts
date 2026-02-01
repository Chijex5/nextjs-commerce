import { NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { orders } from "lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      deliveryStatusCounts,
      recentOrders,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(orders),
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, "pending")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, "processing")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, "completed")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, "cancelled")),
      db
        .select({
          deliveryStatus: orders.deliveryStatus,
          count: sql<number>`count(*)`,
        })
        .from(orders)
        .groupBy(orders.deliveryStatus),
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerName: orders.customerName,
          totalAmount: orders.totalAmount,
          currencyCode: orders.currencyCode,
          status: orders.status,
          deliveryStatus: orders.deliveryStatus,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(5),
    ]);

    const deliveryStats = deliveryStatusCounts.reduce(
      (acc, item) => {
        acc[item.deliveryStatus] = Number(item.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    return NextResponse.json({
      totalOrders: Number(totalOrders[0]?.count ?? 0),
      byStatus: {
        pending: Number(pendingOrders[0]?.count ?? 0),
        processing: Number(processingOrders[0]?.count ?? 0),
        completed: Number(completedOrders[0]?.count ?? 0),
        cancelled: Number(cancelledOrders[0]?.count ?? 0),
      },
      byDeliveryStatus: {
        production: deliveryStats.production || 0,
        sorting: deliveryStats.sorting || 0,
        dispatch: deliveryStats.dispatch || 0,
        paused: deliveryStats.paused || 0,
        completed: deliveryStats.completed || 0,
        cancelled: deliveryStats.cancelled || 0,
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        totalAmount: String(order.totalAmount),
        currencyCode: order.currencyCode,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        createdAt: order.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch order statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 },
    );
  }
}
