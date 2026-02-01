import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productImages, products, reviews, users } from "@/lib/db/schema";
import { requireAdminSession } from "lib/admin-auth";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const productId = searchParams.get("productId") || undefined;
    const rating = searchParams.get("rating")
      ? parseInt(searchParams.get("rating")!)
      : undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "20");
    const skip = (page - 1) * perPage;

    const filters = [];
    if (status) filters.push(eq(reviews.status, status));
    if (productId) filters.push(eq(reviews.productId, productId));
    if (rating) filters.push(eq(reviews.rating, rating));

    const whereClause = filters.length ? and(...filters) : undefined;

    const [reviewRows, totalResult] = await Promise.all([
      db
        .select({
          review: reviews,
          user: users,
          product: products,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .leftJoin(products, eq(reviews.productId, products.id))
        .where(whereClause)
        .orderBy(desc(reviews.createdAt))
        .limit(perPage)
        .offset(skip),
      db
        .select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(whereClause),
    ]);

    const productIds = reviewRows
      .map((row) => row.review.productId)
      .filter((id): id is string => Boolean(id));

    const featuredImages = productIds.length
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
            altText: productImages.altText,
          })
          .from(productImages)
          .where(
            and(
              inArray(productImages.productId, productIds),
              eq(productImages.isFeatured, true),
            ),
          )
      : [];

    const imagesByProduct = new Map(
      featuredImages.map((image) => [image.productId, image]),
    );

    const stats = await db
      .select({ status: reviews.status, count: sql<number>`count(*)` })
      .from(reviews)
      .groupBy(reviews.status);

    const statusCounts = stats.reduce(
      (acc, stat) => {
        acc[stat.status] = Number(stat.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    const total = Number(totalResult[0]?.count ?? 0);

    return NextResponse.json({
      reviews: reviewRows.map((row) => {
        const featuredImage = imagesByProduct.get(row.review.productId || "");
        return {
          ...row.review,
          user: row.user
            ? {
                id: row.user.id,
                name: row.user.name,
                email: row.user.email,
              }
            : null,
          product: row.product
            ? {
                id: row.product.id,
                title: row.product.title,
                handle: row.product.handle,
                images: featuredImage
                  ? [
                      {
                        url: featuredImage.url,
                        altText: featuredImage.altText,
                      },
                    ]
                  : [],
              }
            : null,
        };
      }),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      stats: {
        pending: statusCounts.pending || 0,
        approved: statusCounts.approved || 0,
        rejected: statusCounts.rejected || 0,
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
