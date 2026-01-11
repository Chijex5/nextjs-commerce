import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import prisma from "../../../../../lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the original product with all relations
    const originalProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
        variants: true,
        options: true,
      },
    });

    if (!originalProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create duplicate with "(Copy)" suffix
    const newProduct = await prisma.product.create({
      data: {
        title: `${originalProduct.title} (Copy)`,
        handle: `${originalProduct.handle}-copy-${Date.now()}`,
        description: originalProduct.description,
        descriptionHtml: originalProduct.descriptionHtml,
        availableForSale: originalProduct.availableForSale,
        seoTitle: originalProduct.seoTitle,
        seoDescription: originalProduct.seoDescription,
        tags: originalProduct.tags,
      },
    });

    // Duplicate images
    if (originalProduct.images.length > 0) {
      await prisma.productImage.createMany({
        data: originalProduct.images.map((img) => ({
          productId: newProduct.id,
          url: img.url,
          altText: img.altText,
          width: img.width,
          height: img.height,
          position: img.position,
          isFeatured: img.isFeatured,
        })),
      });
    }

    // Duplicate options
    if (originalProduct.options.length > 0) {
      await prisma.productOption.createMany({
        data: originalProduct.options.map((opt) => ({
          productId: newProduct.id,
          name: opt.name,
          values: opt.values,
        })),
      });
    }

    // Duplicate variants
    if (originalProduct.variants.length > 0) {
      await prisma.productVariant.createMany({
        data: originalProduct.variants.map((variant) => ({
          productId: newProduct.id,
          title: variant.title,
          price: variant.price,
          currencyCode: variant.currencyCode,
          availableForSale: variant.availableForSale,
          selectedOptions: variant.selectedOptions,
        })),
      });
    }

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error("Error duplicating product:", error);
    return NextResponse.json(
      { error: "Failed to duplicate product" },
      { status: 500 }
    );
  }
}
