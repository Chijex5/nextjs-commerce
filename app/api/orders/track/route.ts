import { NextRequest, NextResponse } from "next/server";
import { db } from "lib/db";
import { orderItems, orders } from "lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Order number is required" },
        { status: 400 },
      );
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        estimatedArrival: order.estimatedArrival?.toISOString() || null,
        totalAmount: String(order.totalAmount),
        currencyCode: order.currencyCode,
        createdAt: order.createdAt.toISOString(),
        trackingNumber: order.trackingNumber,
        shippingAddress: order.shippingAddress,
        items: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productVariantId: item.productVariantId,
          productTitle: item.productTitle,
          variantTitle: item.variantTitle,
          quantity: item.quantity,
          price: String(item.price),
          productImage: item.productImage,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to track order:", error);
    return NextResponse.json(
      { error: "Failed to track order" },
      { status: 500 },
    );
  }
}
