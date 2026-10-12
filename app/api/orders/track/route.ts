import { limitByIp } from "lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { db } from "lib/db";
import { customOrderRequests, orderItems, orders } from "lib/db/schema";
import { eq } from "drizzle-orm";
import { getUserSession } from "lib/user-session";
import { normalizeEmail } from "lib/user-utils";

export async function GET(request: NextRequest) {
  try {
    const limited = limitByIp(request, "order-track", 20, 15 * 60_000);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber")?.trim();
    const email = searchParams.get("email")?.trim() || "";

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

    // The order number alone (it appears in URLs and emails) only reveals a
    // status summary. Address, notes, tracking number and the order id (which
    // opens the full order page) need the order's email or its signed-in owner.
    const session = await getUserSession();
    const canSeeDetails =
      (Boolean(email) &&
        normalizeEmail(email) === normalizeEmail(order.email)) ||
      (Boolean(session?.id) && order.userId === session?.id);

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

    const summary = {
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      estimatedArrival: order.estimatedArrival?.toISOString() || null,
      totalAmount: String(order.totalAmount),
      currencyCode: order.currencyCode,
      createdAt: order.createdAt.toISOString(),
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productTitle: item.productTitle,
        variantTitle: item.variantTitle,
        quantity: item.quantity,
        price: String(item.price),
        productImage: item.productImage,
      })),
    };

    if (!canSeeDetails) {
      return NextResponse.json({ order: summary, detailsRequireEmail: true });
    }

    return NextResponse.json({
      order: {
        ...summary,
        id: order.id,
        customOrderRequestId: order.customOrderRequestId,
        customRequestNumber: customRequest?.requestNumber || null,
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
