import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/reviews/verify-purchase?productId=xxx - Check if user can review a product
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

    // Check if user has purchased this product
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        items: {
          some: {
            productId,
          },
        },
      },
      include: {
        items: {
          where: {
            productId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const hasPurchased = orders.length > 0;

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      canReview: hasPurchased && !existingReview,
      hasPurchased,
      hasReviewed: !!existingReview,
      orders: hasPurchased
        ? orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            createdAt: o.createdAt,
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
