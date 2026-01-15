import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import prisma from "lib/prisma";
import {
  calculateEstimatedArrival,
  type DeliveryStatus,
} from "lib/order-utils/delivery-tracking";
import {
  sendOrderStatusUpdate,
  sendShippingNotification,
} from "@/lib/email/order-emails";

// GET - Get single order
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

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

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
        subtotalAmount: order.subtotalAmount.toString(),
        taxAmount: order.taxAmount.toString(),
        shippingAmount: order.shippingAmount.toString(),
        totalAmount: order.totalAmount.toString(),
        currencyCode: order.currencyCode,
        notes: order.notes,
        trackingNumber: order.trackingNumber,
        acknowledgedAt: order.acknowledgedAt?.toISOString() || null,
        acknowledgedBy: order.acknowledgedBy,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        user: order.user,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productVariantId: item.productVariantId,
          productTitle: item.productTitle,
          variantTitle: item.variantTitle,
          quantity: item.quantity,
          price: item.price.toString(),
          totalAmount: item.totalAmount.toString(),
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

// PUT - Update order
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
    const body = await request.json();
    const {
      status,
      deliveryStatus,
      trackingNumber,
      notes,
      acknowledge,
    }: {
      status?: string;
      deliveryStatus?: DeliveryStatus;
      trackingNumber?: string;
      notes?: string;
      acknowledge?: boolean;
    } = body;

    // Get the order to access shipping address for ETA calculation
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        createdAt: true,
        shippingAddress: true,
        status: true,
        deliveryStatus: true,
        customerName: true,
        email: true,
        orderNumber: true,
        acknowledgedAt: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Calculate new estimated arrival if delivery status is being updated
    let estimatedArrival: Date | null | undefined = undefined;
    if (deliveryStatus) {
      estimatedArrival = calculateEstimatedArrival(
        existingOrder.createdAt,
        deliveryStatus,
        existingOrder.shippingAddress as any,
      );
    }

    // Build update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (deliveryStatus !== undefined) {
      updateData.deliveryStatus = deliveryStatus;
      updateData.estimatedArrival = estimatedArrival;
    }
    if (trackingNumber !== undefined)
      updateData.trackingNumber = trackingNumber;
    if (notes !== undefined) updateData.notes = notes;
    if (acknowledge && !existingOrder.acknowledgedAt) {
      updateData.acknowledgedAt = new Date();
      updateData.acknowledgedBy = session.user?.email || null;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });

    // Send email notification if status or delivery status changed
    try {
      const oldStatus = existingOrder.status || "processing";
      const oldDeliveryStatus = existingOrder.deliveryStatus;

      // Check if status changed
      const statusChanged = status && status !== oldStatus;
      const deliveryStatusChanged =
        deliveryStatus && deliveryStatus !== oldDeliveryStatus;

      if (statusChanged || deliveryStatusChanged) {
        // Special case: if dispatch status, send shipping notification
        if (deliveryStatus === "dispatch") {
          await sendShippingNotification({
            orderNumber: updatedOrder.orderNumber,
            customerName: updatedOrder.customerName,
            email: updatedOrder.email,
            totalAmount: Number(updatedOrder.totalAmount),
            items: updatedOrder.items.map((item) => ({
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
          // Send general status update email
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
      // Don't fail the order update if email fails
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
