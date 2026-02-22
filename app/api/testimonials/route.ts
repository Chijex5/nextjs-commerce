import { NextRequest, NextResponse } from "next/server";
import prisma from "lib/prisma";

/**
 * GET /api/testimonials - Get active testimonials
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "active";

    const testimonials = await prisma.testimonial.findMany({
      where:
        status === "all"
          ? {}
          : {
              isActive: status === "active",
            },
      orderBy: {
        position: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      testimonials,
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/testimonials - Create a new testimonial (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, role, content, rating, image, position } = body;

    // Validate required fields
    if (!customerName || !content || !rating) {
      return NextResponse.json(
        { error: "Customer name, content, and rating are required" },
        { status: 400 }
      );
    }

    // Validate rating is between 1-5
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        customerName,
        role: role || null,
        content,
        rating,
        image: image || null,
        position: position || 0,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      testimonial,
    });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    return NextResponse.json(
      { error: "Failed to create testimonial" },
      { status: 500 }
    );
  }
}
