import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderItems, orders, products, reviews, users } from "@/lib/db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getUserSession } from "lib/user-session";

export async function POST(request: NextRequest) {
  try {
    const session = await getUserSession();

    if (!session?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { productId, rating, title, comment, images, orderId } = body;

    if (!productId || !rating) {
      return NextResponse.json(
        { error: "Product ID and rating are required" },
        { status: 400 },
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    const [product] = await db
      .select({ id: products.id, title: products.title })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const [existingReview] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.userId, session.id)))
      .limit(1);

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 },
      );
    }

    if (orderId && typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    const orderRows = await db
      .select({
        id: orders.id,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, session.id),
          eq(orderItems.productId, productId),
          eq(orders.status, "completed"),
          eq(orders.orderType, "catalog"),
        ),
      )
      .orderBy(desc(orders.createdAt));

    const orderMap = new Map(orderRows.map((order) => [order.id, order]));
    const eligibleOrders = Array.from(orderMap.values());

    if (!eligibleOrders.length) {
      return NextResponse.json(
        {
          error:
            "You can only review products from completed catalog orders.",
        },
        { status: 403 },
      );
    }

    if (orderId && !orderMap.has(orderId)) {
      return NextResponse.json(
        { error: "Selected order is not eligible for this review" },
        { status: 400 },
      );
    }

    const selectedOrderId = orderId || eligibleOrders[0]!.id;

    const [createdReview] = await db
      .insert(reviews)
      .values({
        productId,
        userId: session.id,
        orderId: selectedOrderId,
        rating,
        title: title || null,
        comment: comment || null,
        images: images || [],
        isVerified: true,
        status: "pending",
      })
      .returning();

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      review: {
        ...createdReview,
        user,
        product,
      },
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review. Please try again." },
      { status: 500 },
    );
  }
}

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

    let orderBy = desc(reviews.createdAt);
    if (sort === "highest") {
      orderBy = desc(reviews.rating);
    } else if (sort === "lowest") {
      orderBy = asc(reviews.rating);
    } else if (sort === "helpful") {
      orderBy = desc(reviews.helpfulCount);
    }

    const reviewRows = await db
      .select({ review: reviews, user: users })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(and(eq(reviews.productId, productId), eq(reviews.status, status)))
      .orderBy(orderBy);

    const [stats] = await db
      .select({
        averageRating: sql<number>`avg(${reviews.rating})`,
        totalReviews: sql<number>`count(${reviews.id})`,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")));

    return NextResponse.json({
      reviews: reviewRows.map(({ review, user }) => ({
        ...review,
        user: user
          ? {
              id: user.id,
              name: user.name,
            }
          : null,
      })),
      averageRating: Number(stats?.averageRating ?? 0),
      totalReviews: Number(stats?.totalReviews ?? 0),
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
