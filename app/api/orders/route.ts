import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "lib/user-session";
import prisma from "lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getUserSession();

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: session.id,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        estimatedArrival: order.estimatedArrival?.toISOString() || null,
        totalAmount: order.totalAmount.toString(),
        currencyCode: order.currencyCode,
        createdAt: order.createdAt.toISOString(),
        shippingAddress: order.shippingAddress,
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
