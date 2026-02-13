import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { orderItems, orders, users } from "lib/db/schema";
import {
  calculateEstimatedArrival,
  type DeliveryStatus,
} from "lib/order-utils/delivery-tracking";
import {
  sendOrderStatusUpdate,
  sendShippingNotification,
} from "@/lib/email/order-emails";
import { eq } from "drizzle-orm";
import { UpdateOrderBody } from "types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    const user = order.userId
      ? (
          await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              phone: users.phone,
            })
            .from(users)
            .where(eq(users.id, order.userId))
            .limit(1)
        )[0]
      : null;

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        email: order.email,
        phone: order.phone,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        estimatedArrival: order.estimatedArrival?.toISOString() || null,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        subtotalAmount: String(order.subtotalAmount),
        taxAmount: String(order.taxAmount),
        shippingAmount: String(order.shippingAmount),
        totalAmount: String(order.totalAmount),
        currencyCode: order.currencyCode,
        notes: order.notes,
        trackingNumber: order.trackingNumber,
        acknowledgedAt: order.acknowledgedAt?.toISOString() || null,
        acknowledgedBy: order.acknowledgedBy,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        user,
        items: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productVariantId: item.productVariantId,
          productTitle: item.productTitle,
          variantTitle: item.variantTitle,
          quantity: item.quantity,
          price: String(item.price),
          totalAmount: String(item.totalAmount),
          currencyCode: item.currencyCode,
          productImage: item.productImage,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as UpdateOrderBody & {
      deliveryStatus?: DeliveryStatus;
      acknowledge?: boolean;
    };
    const {
      status,
      deliveryStatus,
      trackingNumber,
      notes,
      acknowledge,
    } = body;

    const [existingOrder] = await db
      .select({
        createdAt: orders.createdAt,
        shippingAddress: orders.shippingAddress,
        status: orders.status,
        deliveryStatus: orders.deliveryStatus,
        customerName: orders.customerName,
        email: orders.email,
        orderNumber: orders.orderNumber,
        acknowledgedAt: orders.acknowledgedAt,
      })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let estimatedArrival: Date | null | undefined = undefined;
    if (deliveryStatus) {
      estimatedArrival = calculateEstimatedArrival(
        existingOrder.createdAt,
        deliveryStatus,
        existingOrder.shippingAddress as any,
      );
    }

    const updateData: Partial<typeof orders.$inferInsert> = {};
    if (status !== undefined) updateData.status = status;
    if (deliveryStatus !== undefined) {
      updateData.deliveryStatus = deliveryStatus;
      updateData.estimatedArrival = estimatedArrival;
    }
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (notes !== undefined) updateData.notes = notes;
    if (acknowledge && !existingOrder.acknowledgedAt) {
      updateData.acknowledgedAt = new Date();
      updateData.acknowledgedBy = session.user?.email || null;
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, updatedOrder.id));

    try {
      const oldStatus = existingOrder.status || "processing";
      const oldDeliveryStatus = existingOrder.deliveryStatus;

      const statusChanged = status && status !== oldStatus;
      const deliveryStatusChanged =
        deliveryStatus && deliveryStatus !== oldDeliveryStatus;

      if (statusChanged || deliveryStatusChanged) {
        if (deliveryStatus === "dispatch") {
          await sendShippingNotification({
            orderNumber: updatedOrder.orderNumber,
            customerName: updatedOrder.customerName,
            email: updatedOrder.email,
            totalAmount: Number(updatedOrder.totalAmount),
            items: items.map((item) => ({
              productTitle: item.productTitle,
              variantTitle: item.variantTitle,
              quantity: item.quantity,
              price: Number(item.price),
              productImage: item.productImage,
            })),
            trackingNumber: updatedOrder.trackingNumber || undefined,
            estimatedArrival:
              updatedOrder.estimatedArrival?.toLocaleDateString() || undefined,
          });
        } else {
          await sendOrderStatusUpdate({
            orderNumber: updatedOrder.orderNumber,
            customerName: updatedOrder.customerName,
            email: updatedOrder.email,
            oldStatus,
            newStatus: updatedOrder.status,
            deliveryStatus: updatedOrder.deliveryStatus || undefined,
            trackingNumber: updatedOrder.trackingNumber || undefined,
            estimatedArrival:
              updatedOrder.estimatedArrival?.toLocaleDateString() || undefined,
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send status update email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        deliveryStatus: updatedOrder.deliveryStatus,
        estimatedArrival: updatedOrder.estimatedArrival?.toISOString() || null,
        trackingNumber: updatedOrder.trackingNumber,
        acknowledgedAt: updatedOrder.acknowledgedAt?.toISOString() || null,
        acknowledgedBy: updatedOrder.acknowledgedBy,
        updatedAt: updatedOrder.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}
