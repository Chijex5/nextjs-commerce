import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/reviews - Submit a new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { productId, rating, title, comment, images, orderId } = body;

    // Validate required fields
    if (!productId || !rating) {
      return NextResponse.json(
        { error: "Product ID and rating are required" },
        { status: 400 },
      );
    }

    // Validate rating is between 1-5
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId: session.user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 },
      );
    }

    // Check if this is a verified purchase
    let isVerified = false;
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: session.user.id,
        },
        include: {
          items: {
            where: {
              productId,
            },
          },
        },
      });

      isVerified = !!order && order.items.length > 0;
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        orderId: orderId || null,
        rating,
        title: title || null,
        comment: comment || null,
        images: images || [],
        isVerified,
        status: "pending", // Reviews start as pending for moderation
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // TODO: Send email notification to admin about pending review

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review. Please try again." },
      { status: 500 },
    );
  }
}

// GET /api/reviews?productId=xxx - Get reviews for a product
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const status = searchParams.get("status") || "approved";
    const sort = searchParams.get("sort") || "newest";

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    // Build sort order
    let orderBy: any = { createdAt: "desc" };
    if (sort === "highest") {
      orderBy = { rating: "desc" };
    } else if (sort === "lowest") {
      orderBy = { rating: "asc" };
    } else if (sort === "helpful") {
      orderBy = { helpfulCount: "desc" };
    }

    // Fetch reviews
    const reviews = await prisma.review.findMany({
      where: {
        productId,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy,
    });

    // Calculate average rating and total count
    const stats = await prisma.review.aggregate({
      where: {
        productId,
        status: "approved",
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      reviews,
      averageRating: stats._avg.rating || 0,
      totalReviews: stats._count.id,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
