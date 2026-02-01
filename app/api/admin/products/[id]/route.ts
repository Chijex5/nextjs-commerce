import { NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { PRODUCT_IMAGE_HEIGHT, PRODUCT_IMAGE_WIDTH } from "lib/image-constants";
import { db } from "lib/db";
import {
  cartLines,
  collections,
  productCollections,
  productImages,
  productOptions,
  productVariants,
  products,
} from "lib/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import type { UpdateProductBody } from "types/api";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db.delete(products).where(eq(products.id, id));

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
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const [images, variants, options, collectionLinks] = await Promise.all([
      db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, id))
        .orderBy(asc(productImages.position)),
      db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, id))
        .orderBy(asc(productVariants.createdAt)),
      db
        .select()
        .from(productOptions)
        .where(eq(productOptions.productId, id)),
      db
        .select({
          id: productCollections.id,
          productId: productCollections.productId,
          collectionId: productCollections.collectionId,
          position: productCollections.position,
          createdAt: productCollections.createdAt,
          collection: collections,
        })
        .from(productCollections)
        .innerJoin(
          collections,
          eq(productCollections.collectionId, collections.id),
        )
        .where(eq(productCollections.productId, id)),
    ]);

    return NextResponse.json({
      ...product,
      images,
      variants,
      options,
      productCollections: collectionLinks.map((link) => ({
        id: link.id,
        productId: link.productId,
        collectionId: link.collectionId,
        position: link.position,
        createdAt: link.createdAt,
        collection: link.collection,
      })),
    });
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
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as UpdateProductBody;

    const product = await db.transaction(async (tx) => {
      const [updatedProduct] = await tx
        .update(products)
        .set({
          title: body.title,
          handle: body.handle,
          description: body.description,
          descriptionHtml: body.descriptionHtml,
          availableForSale: body.availableForSale,
          seoTitle: body.seoTitle,
          seoDescription: body.seoDescription,
          tags: body.tags || [],
        })
        .where(eq(products.id, id))
        .returning();

      if (body.images && Array.isArray(body.images)) {
        await tx.delete(productImages).where(eq(productImages.productId, id));

        if (body.images.length > 0) {
          await tx.insert(productImages).values(
            body.images.map((img) => ({
              productId: id,
              url: img.url,
              altText: updatedProduct.title,
              width: img.width ?? PRODUCT_IMAGE_WIDTH,
              height: img.height ?? PRODUCT_IMAGE_HEIGHT,
              position: img.position || 0,
              isFeatured: img.isFeatured || false,
            })),
          );
        }
      }

      if (body.sizes || body.colors) {
        const variantRows = await tx
          .select({ id: productVariants.id })
          .from(productVariants)
          .where(eq(productVariants.productId, id));

        const variantIds = variantRows.map((variant) => variant.id);
        if (variantIds.length) {
          await tx
            .delete(cartLines)
            .where(inArray(cartLines.productVariantId, variantIds));
        }

        await tx
          .delete(productVariants)
          .where(eq(productVariants.productId, id));
        await tx
          .delete(productOptions)
          .where(eq(productOptions.productId, id));

        const sizes = body.sizes || [];
        const colors = body.colors || [];

        if (sizes.length > 0) {
          await tx.insert(productOptions).values({
            productId: id,
            name: "Size",
            values: sizes,
          });
        }

        if (colors.length > 0) {
          await tx.insert(productOptions).values({
            productId: id,
            name: "Color",
            values: colors,
          });
        }

        const getVariantPrice = (size: string, color: string): number => {
          const basePrice = body.basePrice || 0;
          const colorPrices = body.colorPrices || {};
          const largeSizePrice = body.largeSizePrice;
          const largeSizeFrom = body.largeSizeFrom;
          const sizePriceRules = Array.isArray(body.sizePriceRules)
            ? body.sizePriceRules
                .map((rule) => ({
                  from: parseInt(String(rule.from), 10),
                  price: parseFloat(String(rule.price)),
                }))
                .filter(
                  (rule) =>
                    !Number.isNaN(rule.from) &&
                    !Number.isNaN(rule.price) &&
                    rule.from > 0,
                )
                .sort((a, b) => b.from - a.from)
            : [];

          const colorKey = color.trim().toLowerCase();
          if (colorPrices[colorKey] !== undefined) {
            return colorPrices[colorKey];
          }

          if (sizePriceRules.length > 0) {
            const sizeValue = parseInt(size, 10);
            if (!Number.isNaN(sizeValue)) {
              const matched = sizePriceRules.find(
                (rule) => sizeValue >= rule.from,
              );
              if (matched) return matched.price;
            }
          }

          if (
            largeSizeFrom !== null &&
            largeSizePrice !== null &&
            parseInt(size, 10) >= largeSizeFrom
          ) {
            return largeSizePrice;
          }

          return basePrice;
        };

        const variants: Array<typeof productVariants.$inferInsert> = [];

        if (sizes.length > 0 && colors.length > 0) {
          for (const size of sizes) {
            for (const color of colors) {
              variants.push({
                productId: id,
                title: `${size} / ${color}`,
                price: String(getVariantPrice(size, color)),
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
              price: String(getVariantPrice(size, "")),
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
              price: String(getVariantPrice("", color)),
              currencyCode: "NGN",
              availableForSale: body.availableForSale ?? true,
              selectedOptions: [{ name: "Color", value: color }],
            });
          }
        }

        if (variants.length > 0) {
          await tx.insert(productVariants).values(variants);
        }
      }

      if (body.collectionIds !== undefined && Array.isArray(body.collectionIds)) {
        await tx
          .delete(productCollections)
          .where(eq(productCollections.productId, id));

        if (body.collectionIds.length > 0) {
          await tx.insert(productCollections).values(
            body.collectionIds.map((collectionId, index) => ({
              productId: id,
              collectionId,
              position: index,
            })),
          );
        }
      }

      return updatedProduct;
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}
