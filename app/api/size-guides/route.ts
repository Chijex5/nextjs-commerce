import { NextRequest, NextResponse } from "next/server";
import prisma from "lib/prisma";

/**
 * GET /api/size-guides - Get all size guides
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productType = searchParams.get("productType");
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const where: any = {};
    
    if (activeOnly) {
      where.isActive = true;
    }
    
    if (productType) {
      where.productType = productType;
    }

    const sizeGuides = await prisma.sizeGuide.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      sizeGuides,
    });
  } catch (error) {
    console.error("Error fetching size guides:", error);
    return NextResponse.json(
      { error: "Failed to fetch size guides" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/size-guides - Create a new size guide (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productType, title, sizesChart, measurements } = body;

    // Validate required fields
    if (!productType || !title || !sizesChart) {
      return NextResponse.json(
        { error: "Product type, title, and sizes chart are required" },
        { status: 400 }
      );
    }

    const sizeGuide = await prisma.sizeGuide.create({
      data: {
        productType,
        title,
        sizesChart,
        measurements: measurements || {},
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      sizeGuide,
    });
  } catch (error) {
    console.error("Error creating size guide:", error);
    return NextResponse.json(
      { error: "Failed to create size guide" },
      { status: 500 }
    );
  }
}
