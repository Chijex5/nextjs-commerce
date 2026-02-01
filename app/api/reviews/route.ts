import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderItems, orders, products, reviews, users } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { and, asc, desc, eq, sql } from "drizzle-orm";

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
      .where(and(eq(reviews.productId, productId), eq(reviews.userId, session.user.id)))
      .limit(1);

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 },
      );
    }

    let isVerified = false;
    if (orderId) {
      const [order] = await db
        .select({ id: orders.id })
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, session.user.id)))
        .limit(1);

      if (order) {
        const [item] = await db
          .select({ id: orderItems.id })
          .from(orderItems)
          .where(
            and(eq(orderItems.orderId, order.id), eq(orderItems.productId, productId)),
          )
          .limit(1);
        isVerified = !!item;
      }
    }

    const [createdReview] = await db
      .insert(reviews)
      .values({
        productId,
        userId: session.user.id,
        orderId: orderId || null,
        rating,
        title: title || null,
        comment: comment || null,
        images: images || [],
        isVerified,
        status: "pending",
      })
      .returning();

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.user.id))
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
