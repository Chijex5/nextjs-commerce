import { NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import prisma from "lib/prisma";

// GET - Get orders statistics
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
      prisma.order.count(),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.count({ where: { status: "processing" } }),
      prisma.order.count({ where: { status: "completed" } }),
      prisma.order.count({ where: { status: "cancelled" } }),
      prisma.order.groupBy({
        by: ["deliveryStatus"],
        _count: true,
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          totalAmount: true,
          currencyCode: true,
          status: true,
          deliveryStatus: true,
          createdAt: true,
        },
      }),
    ]);

    const deliveryStats = deliveryStatusCounts.reduce(
      (acc, item) => {
        acc[item.deliveryStatus] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return NextResponse.json({
      totalOrders,
      byStatus: {
        pending: pendingOrders,
        processing: processingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
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
        totalAmount: order.totalAmount.toString(),
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
