import { NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { getVariantPrice } from "lib/admin-utils";
import { PRODUCT_IMAGE_HEIGHT, PRODUCT_IMAGE_WIDTH } from "lib/image-constants";
import { db } from "lib/db";
import {
  productCollections,
  productImages,
  productOptions,
  productVariants,
  products,
} from "lib/db/schema";

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const product = await db.transaction(async (tx) => {
      const [createdProduct] = await tx
        .insert(products)
        .values({
          title: body.title,
          handle: body.handle,
          description: body.description,
          descriptionHtml: body.descriptionHtml,
          availableForSale: body.availableForSale ?? true,
          seoTitle: body.seoTitle,
          seoDescription: body.seoDescription,
          tags: body.tags || [],
        })
        .returning();

      if (!createdProduct) {
        throw new Error("Failed to create product");
      }

      if (body.images && Array.isArray(body.images) && body.images.length > 0) {
        await tx.insert(productImages).values(
          body.images.map((img: any) => ({
            productId: createdProduct.id,
            url: img.url,
            altText: createdProduct.title,
            width: img.width ?? PRODUCT_IMAGE_WIDTH,
            height: img.height ?? PRODUCT_IMAGE_HEIGHT,
            position: img.position || 0,
            isFeatured: img.isFeatured || false,
          })),
        );
      }

      const sizes = body.sizes || [];
      const colors = body.colors || [];

      if (sizes.length > 0) {
        await tx.insert(productOptions).values({
          productId: createdProduct.id,
          name: "Size",
          values: sizes,
        });
      }

      if (colors.length > 0) {
        await tx.insert(productOptions).values({
          productId: createdProduct.id,
          name: "Color",
          values: colors,
        });
      }

      const variants: Array<typeof productVariants.$inferInsert> = [];

      const pricingConfig = {
        basePrice: body.basePrice,
        colorPrices: body.colorPrices,
        largeSizePrice: body.largeSizePrice,
        largeSizeFrom: body.largeSizeFrom,
        sizePriceRules: body.sizePriceRules,
      };

      if (sizes.length > 0 && colors.length > 0) {
        for (const size of sizes) {
          for (const color of colors) {
            variants.push({
              productId: createdProduct.id,
              title: `${size} / ${color}`,
              price: String(getVariantPrice(size, color, pricingConfig)),
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
            productId: createdProduct.id,
            title: `Size ${size}`,
            price: String(getVariantPrice(size, "", pricingConfig)),
            currencyCode: "NGN",
            availableForSale: body.availableForSale ?? true,
            selectedOptions: [{ name: "Size", value: size }],
          });
        }
      } else if (colors.length > 0) {
        for (const color of colors) {
          variants.push({
            productId: createdProduct.id,
            title: color,
            price: String(getVariantPrice("", color, pricingConfig)),
            currencyCode: "NGN",
            availableForSale: body.availableForSale ?? true,
            selectedOptions: [{ name: "Color", value: color }],
          });
        }
      } else {
        variants.push({
          productId: createdProduct.id,
          title: "Default",
          price: String(body.basePrice || 0),
          currencyCode: "NGN",
          availableForSale: body.availableForSale ?? true,
          selectedOptions: [],
        });
      }

      if (variants.length > 0) {
        await tx.insert(productVariants).values(variants);
      }

      if (
        body.collectionIds &&
        Array.isArray(body.collectionIds) &&
        body.collectionIds.length > 0
      ) {
        await tx.insert(productCollections).values(
          body.collectionIds.map((collectionId: string, index: number) => ({
            productId: createdProduct.id,
            collectionId,
            position: index,
          })),
        );
      }

      return createdProduct;
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
