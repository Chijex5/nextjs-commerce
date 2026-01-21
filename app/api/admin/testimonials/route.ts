import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "lib/admin-auth";

// GET /api/admin/testimonials - Get all testimonials with filtering
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
    const status = searchParams.get("status");

    const where: any = {};
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 },
    );
  }
}

// POST /api/admin/testimonials - Create a new testimonial
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { customerName, role, content, rating, image, position, isActive } =
      body;

    if (!customerName || !content || !rating) {
      return NextResponse.json(
        { error: "Customer name, content, and rating are required" },
        { status: 400 },
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
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    return NextResponse.json(
      { error: "Failed to create testimonial" },
      { status: 500 },
    );
  }
}
