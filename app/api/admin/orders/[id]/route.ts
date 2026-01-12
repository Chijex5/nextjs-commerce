import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import prisma from "lib/prisma";
import {
  calculateEstimatedArrival,
  type DeliveryStatus,
} from "lib/order-utils/delivery-tracking";

// GET - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

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
    const session = await getServerSession(authOptions);

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
    }: {
      status?: string;
      deliveryStatus?: DeliveryStatus;
      trackingNumber?: string;
      notes?: string;
    } = body;

    // Get the order to access shipping address for ETA calculation
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        createdAt: true,
        shippingAddress: true,
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

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });

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
