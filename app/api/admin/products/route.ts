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

    // Create product options for Size and Color
    const sizes = body.sizes || [];
    const colors = body.colors || [];

    if (sizes.length > 0) {
      await prisma.productOption.create({
        data: {
          productId: product.id,
          name: "Size",
          values: sizes,
        },
      });
    }

    if (colors.length > 0) {
      await prisma.productOption.create({
        data: {
          productId: product.id,
          name: "Color",
          values: colors,
        },
      });
    }

    // Create product variants for all size × color combinations
    const variants = [];
    const price = body.price || 0;

    if (sizes.length > 0 && colors.length > 0) {
      // Create all combinations
      for (const size of sizes) {
        for (const color of colors) {
          variants.push({
            productId: product.id,
            title: `${size} / ${color}`,
            price: price,
            currencyCode: "NGN",
            availableForSale: body.availableForSale ?? true,
            selectedOptions: [
              { name: "Size", value: size },
              { name: "Color", value: color },
            ],
          });
        }
      }
    } else if (sizes.length > 0) {
      // Only sizes
      for (const size of sizes) {
        variants.push({
          productId: product.id,
          title: `Size ${size}`,
          price: price,
          currencyCode: "NGN",
          availableForSale: body.availableForSale ?? true,
          selectedOptions: [{ name: "Size", value: size }],
        });
      }
    } else if (colors.length > 0) {
      // Only colors
      for (const color of colors) {
        variants.push({
          productId: product.id,
          title: color,
          price: price,
          currencyCode: "NGN",
          availableForSale: body.availableForSale ?? true,
          selectedOptions: [{ name: "Color", value: color }],
        });
      }
    } else {
      // No variants, create default
      variants.push({
        productId: product.id,
        title: "Default",
        price: price,
        currencyCode: "NGN",
        availableForSale: body.availableForSale ?? true,
        selectedOptions: [],
      });
    }

    // Batch create all variants
    if (variants.length > 0) {
      await prisma.productVariant.createMany({
        data: variants,
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
