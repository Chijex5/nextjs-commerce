import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "lib/db";
import { customOrderRequests, orderItems, orders } from "lib/db/schema";
import { getUserSession } from "lib/user-session";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orderNumber = request.nextUrl.searchParams.get("orderNumber");
    const session = await getUserSession();

    const [order] = session?.id
      ? await db
          .select()
          .from(orders)
          .where(and(eq(orders.id, id), eq(orders.userId, session.id)))
          .limit(1)
      : orderNumber
        ? await db
            .select()
            .from(orders)
            .where(and(eq(orders.id, id), eq(orders.orderNumber, orderNumber)))
            .limit(1)
        : [];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    const customRequest = order.customOrderRequestId
      ? (
          await db
            .select({ requestNumber: customOrderRequests.requestNumber })
            .from(customOrderRequests)
            .where(eq(customOrderRequests.id, order.customOrderRequestId))
            .limit(1)
        )[0]
      : null;

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        customOrderRequestId: order.customOrderRequestId,
        customRequestNumber: customRequest?.requestNumber || null,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        estimatedArrival: order.estimatedArrival?.toISOString() || null,
        subtotalAmount: String(order.subtotalAmount),
        shippingAmount: String(order.shippingAmount),
        discountAmount: String(order.discountAmount),
        couponCode: order.couponCode,
        totalAmount: String(order.totalAmount),
        currencyCode: order.currencyCode,
        createdAt: order.createdAt.toISOString(),
        trackingNumber: order.trackingNumber,
        notes: order.notes,
        shippingAddress: order.shippingAddress,
        items: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productVariantId: item.productVariantId,
          productTitle: item.productTitle,
          variantTitle: item.variantTitle,
          quantity: item.quantity,
          price: String(item.price),
          totalAmount: String(item.totalAmount),
          productImage: item.productImage,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch order detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch order detail" },
      { status: 500 },
    );
  }
}
