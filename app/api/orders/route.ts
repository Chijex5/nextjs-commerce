import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "lib/user-session";
import { db } from "lib/db";
import { orderItems, orders } from "lib/db/schema";
import { desc, eq, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getUserSession();

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, session.id))
      .orderBy(desc(orders.createdAt));

    const orderIds = orderRows.map((order) => order.id);
    const items = orderIds.length
      ? await db
          .select()
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds))
      : [];

    const itemsByOrder = items.reduce<Record<string, typeof items>>(
      (acc, item) => {
        if (!acc[item.orderId]) {
          acc[item.orderId] = [] as typeof items;
        }
        acc[item.orderId].push(item);
        return acc;
      },
      {},
    );

    return NextResponse.json({
      orders: orderRows.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        estimatedArrival: order.estimatedArrival?.toISOString() || null,
        totalAmount: String(order.totalAmount),
        currencyCode: order.currencyCode,
        createdAt: order.createdAt.toISOString(),
        shippingAddress: order.shippingAddress,
        items: (itemsByOrder[order.id] || []).map((item) => ({
          id: item.id,
          productId: item.productId,
          productVariantId: item.productVariantId,
          productTitle: item.productTitle,
          variantTitle: item.variantTitle,
          quantity: item.quantity,
          price: String(item.price),
          productImage: item.productImage,
        })),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
