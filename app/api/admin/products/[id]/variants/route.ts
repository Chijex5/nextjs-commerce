import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { variants } = body;

    if (!variants || !Array.isArray(variants)) {
      return NextResponse.json(
        { error: "Variants array is required" },
        { status: 400 },
      );
    }

    // Process variants
    for (const variant of variants) {
      if (variant.isDeleted && !variant.isNew) {
        // Delete existing variant
        await prisma.productVariant.delete({
          where: { id: variant.id },
        });
      } else if (variant.isNew && !variant.isDeleted) {
        // Create new variant
        await prisma.productVariant.create({
          data: {
            productId: id,
            title: variant.title,
            price: parseFloat(variant.price) || 0,
            currencyCode: "NGN",
            availableForSale: variant.availableForSale,
            selectedOptions: variant.selectedOptions || [],
          },
        });
      } else if (variant.isModified && !variant.isDeleted && !variant.isNew) {
        // Update existing variant
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            title: variant.title,
            price: parseFloat(variant.price) || 0,
            availableForSale: variant.availableForSale,
            selectedOptions: variant.selectedOptions || [],
          },
        });
      }
    }

    // Fetch updated product with variants
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating variants:", error);
    return NextResponse.json(
      { error: "Failed to update variants" },
      { status: 500 },
    );
  }
}
