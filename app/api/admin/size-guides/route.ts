import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "lib/admin-auth";

// GET /api/admin/size-guides - Get all size guides
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const sizeGuides = await prisma.sizeGuide.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ sizeGuides });
  } catch (error) {
    console.error("Error fetching size guides:", error);
    return NextResponse.json(
      { error: "Failed to fetch size guides" },
      { status: 500 },
    );
  }
}

// POST /api/admin/size-guides - Create a new size guide
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
    const { productType, title, sizesChart, measurements, isActive } = body;

    if (!productType || !title || !sizesChart) {
      return NextResponse.json(
        { error: "Product type, title, and sizes chart are required" },
        { status: 400 },
      );
    }

    const sizeGuide = await prisma.sizeGuide.create({
      data: {
        productType,
        title,
        sizesChart,
        measurements: measurements || {},
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ sizeGuide }, { status: 201 });
  } catch (error) {
    console.error("Error creating size guide:", error);
    return NextResponse.json(
      { error: "Failed to create size guide" },
      { status: 500 },
    );
  }
}
