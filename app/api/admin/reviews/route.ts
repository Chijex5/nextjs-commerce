import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "lib/admin-auth";

// GET /api/admin/reviews - Get all reviews with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    // Check if user is admin
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

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (productId) where.productId = productId;
    if (rating) where.rating = rating;

    // Fetch reviews with pagination
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
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
              handle: true,
              images: {
                where: { isFeatured: true },
                take: 1,
                select: { url: true, altText: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.review.count({ where }),
    ]);

    // Get statistics
    const stats = await prisma.review.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    const statusCounts = stats.reduce(
      (acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    return NextResponse.json({
      reviews,
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
