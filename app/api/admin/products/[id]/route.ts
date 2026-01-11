import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete product (cascades to images, variants, options, etc.)
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
        variants: {
          orderBy: { createdAt: "asc" },
        },
        options: true,
        productCollections: {
          include: {
            collection: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

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

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        title: body.title,
        handle: body.handle,
        description: body.description,
        descriptionHtml: body.descriptionHtml,
        availableForSale: body.availableForSale,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        tags: body.tags || [],
      },
    });

    // Update images - delete old ones and create new ones
    if (body.images && Array.isArray(body.images)) {
      // Delete existing images
      await prisma.productImage.deleteMany({
        where: { productId: id },
      });

      // Create new images
      if (body.images.length > 0) {
        await prisma.productImage.createMany({
          data: body.images.map((img: any) => ({
            productId: id,
            url: img.url,
            altText: product.title,
            width: 800,
            height: 800,
            position: img.position || 0,
            isFeatured: img.isFeatured || false,
          })),
        });
      }
    }

    // Update variants and options if sizes/colors provided
    if (body.sizes || body.colors) {
      // Delete existing variants and options
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      await prisma.productOption.deleteMany({ where: { productId: id } });

      const sizes = body.sizes || [];
      const colors = body.colors || [];

      // Recreate options
      if (sizes.length > 0) {
        await prisma.productOption.create({
          data: {
            productId: id,
            name: "Size",
            values: sizes,
          },
        });
      }

      if (colors.length > 0) {
        await prisma.productOption.create({
          data: {
            productId: id,
            name: "Color",
            values: colors,
          },
        });
      }

      // Function to calculate variant price based on rules
      const getVariantPrice = (size: string, color: string): number => {
        const basePrice = body.basePrice || 0;
        const colorPrices = body.colorPrices || {};
        const largeSizePrice = body.largeSizePrice;
        const largeSizeFrom = body.largeSizeFrom;

        // Check color-specific price first (highest priority)
        const colorKey = color.trim().toLowerCase();
        if (colorPrices[colorKey] !== undefined) {
          return colorPrices[colorKey];
        }

        // Check size-based price
        if (
          largeSizeFrom !== null &&
          largeSizePrice !== null &&
          parseInt(size) >= largeSizeFrom
        ) {
          return largeSizePrice;
        }

        return basePrice;
      };

      // Recreate variants with new prices
      const variants = [];

      if (sizes.length > 0 && colors.length > 0) {
        for (const size of sizes) {
          for (const color of colors) {
            variants.push({
              productId: id,
              title: `${size} / ${color}`,
              price: getVariantPrice(size, color),
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
        for (const size of sizes) {
          variants.push({
            productId: id,
            title: `Size ${size}`,
            price: getVariantPrice(size, ""),
            currencyCode: "NGN",
            availableForSale: body.availableForSale ?? true,
            selectedOptions: [{ name: "Size", value: size }],
          });
        }
      } else if (colors.length > 0) {
        for (const color of colors) {
          variants.push({
            productId: id,
            title: color,
            price: getVariantPrice("", color),
            currencyCode: "NGN",
            availableForSale: body.availableForSale ?? true,
            selectedOptions: [{ name: "Color", value: color }],
          });
        }
      }

      if (variants.length > 0) {
        await prisma.productVariant.createMany({
          data: variants,
        });
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}
