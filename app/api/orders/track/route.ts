import { NextRequest, NextResponse } from "next/server";
import prisma from "lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Order number is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        orderNumber,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount.toString(),
        currencyCode: order.currencyCode,
        createdAt: order.createdAt.toISOString(),
        trackingNumber: order.trackingNumber,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productVariantId: item.productVariantId,
          productTitle: item.productTitle,
          variantTitle: item.variantTitle,
          quantity: item.quantity,
          price: item.price.toString(),
          productImage: item.productImage,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to track order:", error);
    return NextResponse.json(
      { error: "Failed to track order" },
      { status: 500 }
    );
  }
}
