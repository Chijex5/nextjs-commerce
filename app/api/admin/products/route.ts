import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Create product
    const product = await prisma.product.create({
      data: {
        title: body.title,
        handle: body.handle,
        description: body.description,
        descriptionHtml: body.descriptionHtml,
        availableForSale: body.availableForSale ?? true,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        tags: body.tags || [],
      },
    });

    // Create product image if provided
    if (body.image) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: body.image,
          altText: product.title,
          width: 800,
          height: 800,
          position: 0,
          isFeatured: true,
        },
      });
    }

    // Create product variant
    if (body.variant) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          title: body.variant.title || "Default",
          price: body.variant.price,
          currencyCode: body.variant.currencyCode || "NGN",
          availableForSale: body.variant.availableForSale ?? true,
          selectedOptions: body.variant.selectedOptions || [],
        },
      });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
