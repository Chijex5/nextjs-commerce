import { NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { PRODUCT_IMAGE_HEIGHT, PRODUCT_IMAGE_WIDTH } from "lib/image-constants";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();

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

    // Create product images if provided (up to 5)
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      await prisma.productImage.createMany({
        data: body.images.map((img: any) => ({
          productId: product.id,
          url: img.url,
          altText: product.title,
          width: img.width ?? PRODUCT_IMAGE_WIDTH,
          height: img.height ?? PRODUCT_IMAGE_HEIGHT,
          position: img.position || 0,
          isFeatured: img.isFeatured || false,
        })),
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

    // Function to calculate variant price based on rules
    const getVariantPrice = (size: string, color: string): number => {
      const basePrice = body.basePrice || 0;
      const colorPrices = body.colorPrices || {};
      const largeSizePrice = body.largeSizePrice;
      const largeSizeFrom = body.largeSizeFrom;
      const sizePriceRules = Array.isArray(body.sizePriceRules)
        ? body.sizePriceRules
            .map((rule: any) => ({
              from: parseInt(rule.from, 10),
              price: parseFloat(rule.price),
            }))
            .filter(
              (rule: any) =>
                !Number.isNaN(rule.from) &&
                !Number.isNaN(rule.price) &&
                rule.from > 0,
            )
            .sort((a: any, b: any) => b.from - a.from)
        : [];

      // Check color-specific price first (highest priority)
      const colorKey = color.trim().toLowerCase();
      if (colorPrices[colorKey] !== undefined) {
        return colorPrices[colorKey];
      }

      // Check size-based tier rules
      if (sizePriceRules.length > 0) {
        const sizeValue = parseInt(size, 10);
        if (!Number.isNaN(sizeValue)) {
          const matched = sizePriceRules.find(
            (rule: any) => sizeValue >= rule.from,
          );
          if (matched) return matched.price;
        }
      }

      // Check legacy single-tier size price
      if (
        largeSizeFrom !== null &&
        largeSizePrice !== null &&
        parseInt(size, 10) >= largeSizeFrom
      ) {
        return largeSizePrice;
      }

      return basePrice;
    };

    // Create product variants for all size × color combinations with appropriate prices
    const variants = [];

    if (sizes.length > 0 && colors.length > 0) {
      // Create all combinations
      for (const size of sizes) {
        for (const color of colors) {
          variants.push({
            productId: product.id,
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
      // Only sizes
      for (const size of sizes) {
        variants.push({
          productId: product.id,
          title: `Size ${size}`,
          price: getVariantPrice(size, ""),
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
          price: getVariantPrice("", color),
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
        price: body.basePrice || 0,
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

    // Handle collection assignments if provided
    if (
      body.collectionIds &&
      Array.isArray(body.collectionIds) &&
      body.collectionIds.length > 0
    ) {
      await prisma.productCollection.createMany({
        data: body.collectionIds.map((collectionId: string, index: number) => ({
          productId: product.id,
          collectionId,
          position: index,
        })),
      });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
