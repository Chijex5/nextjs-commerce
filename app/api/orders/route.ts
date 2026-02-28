import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "lib/user-session";
import { db } from "lib/db";
import { customOrderRequests, orderItems, orders } from "lib/db/schema";
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
        const bucket =
          acc[item.orderId] ?? (acc[item.orderId] = [] as typeof items);
        bucket.push(item);
        return acc;
      },
      {},
    );

    const customRequestIds = orderRows
      .map((order) => order.customOrderRequestId)
      .filter((value): value is string => Boolean(value));
    const requestRows = customRequestIds.length
      ? await db
          .select({
            id: customOrderRequests.id,
            requestNumber: customOrderRequests.requestNumber,
          })
          .from(customOrderRequests)
          .where(inArray(customOrderRequests.id, customRequestIds))
      : [];
    const requestMap = new Map(requestRows.map((row) => [row.id, row.requestNumber]));

    return NextResponse.json({
      orders: orderRows.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        customOrderRequestId: order.customOrderRequestId,
        customRequestNumber: order.customOrderRequestId
          ? requestMap.get(order.customOrderRequestId) || null
          : null,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        estimatedArrival: order.estimatedArrival?.toISOString() || null,
        totalAmount: String(order.totalAmount),
        currencyCode: order.currencyCode,
        createdAt: order.createdAt.toISOString(),
        trackingNumber: order.trackingNumber,
        notes: order.notes,
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
