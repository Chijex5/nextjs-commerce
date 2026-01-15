import { NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();

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

    // Separate variants by operation type
    const variantsToDelete = variants.filter((v) => v.isDeleted && !v.isNew);
    const variantsToCreate = variants.filter((v) => v.isNew && !v.isDeleted);
    const variantsToUpdate = variants.filter(
      (v) => v.isModified && !v.isDeleted && !v.isNew,
    );

    // Validate prices for new and updated variants
    [...variantsToCreate, ...variantsToUpdate].forEach((variant) => {
      const price = parseFloat(variant.price);
      if (isNaN(price) || price < 0) {
        throw new Error(
          `Invalid price for variant "${variant.title}": ${variant.price}`,
        );
      }
    });

    // Batch delete existing variants
    if (variantsToDelete.length > 0) {
      await prisma.productVariant.deleteMany({
        where: {
          id: { in: variantsToDelete.map((v) => v.id) },
        },
      });
    }

    // Batch create new variants
    if (variantsToCreate.length > 0) {
      await prisma.productVariant.createMany({
        data: variantsToCreate.map((variant) => ({
          productId: id,
          title: variant.title,
          price: parseFloat(variant.price),
          currencyCode: "NGN",
          availableForSale: variant.availableForSale,
          selectedOptions: variant.selectedOptions || [],
        })),
      });
    }

    // Update existing variants (these must be done individually due to different data per variant)
    for (const variant of variantsToUpdate) {
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: {
          title: variant.title,
          price: parseFloat(variant.price),
          availableForSale: variant.availableForSale,
          selectedOptions: variant.selectedOptions || [],
        },
      });
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
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update variants";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
