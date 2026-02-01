import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderItems, orders, reviews } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { and, desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    const orderRows = await db
      .select({ order: orders })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(eq(orders.userId, session.user.id), eq(orderItems.productId, productId)),
      )
      .orderBy(desc(orders.createdAt));

    const ordersMap = new Map(
      orderRows.map(({ order }) => [order.id, order]),
    );

    const uniqueOrders = Array.from(ordersMap.values());
    const hasPurchased = uniqueOrders.length > 0;

    const [existingReview] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.userId, session.user.id)))
      .limit(1);

    return NextResponse.json({
      canReview: hasPurchased && !existingReview,
      hasPurchased,
      hasReviewed: !!existingReview,
      orders: hasPurchased
        ? uniqueOrders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            createdAt: order.createdAt,
          }))
        : [],
    });
  } catch (error) {
    console.error("Error verifying purchase:", error);
    return NextResponse.json(
      { error: "Failed to verify purchase" },
      { status: 500 },
    );
  }
}
