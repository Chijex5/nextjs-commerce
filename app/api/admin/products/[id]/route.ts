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
import { CreateProductSchema } from "@/lib/validation/product-schema";
import { validateAndSanitizeDescription } from "@/lib/validation/sanitize";
import { validateCollectionIds, generateUniqueHandle } from "@/lib/validation/product-helpers";
import { ZodError } from "zod";
import { and, asc, eq, inArray, ne } from "drizzle-orm";

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
      console.log("Unauthorized attempt to update product");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    let validatedData;
    try {
      validatedData = CreateProductSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        return NextResponse.json(
          { error: "Validation failed", details: messages },
          { status: 400 },
        );
      }
      throw error;
    }

    if (validatedData.collectionIds.length > 0) {
      const collectionCheck = await validateCollectionIds(validatedData.collectionIds);
      if (!collectionCheck.valid) {
        return NextResponse.json({ error: collectionCheck.error }, { status: 400 });
      }
    }

    let sanitizedHtml = validatedData.descriptionHtml;
    if (sanitizedHtml) {
      const sanitizationResult = validateAndSanitizeDescription(sanitizedHtml);
      if (!sanitizationResult.valid) {
        return NextResponse.json({ error: sanitizationResult.error }, { status: 400 });
      }
      sanitizedHtml = sanitizationResult.sanitized;
    }

    let finalHandle = validatedData.handle;
    const handleConflict = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.handle, validatedData.handle), ne(products.id, id)))
      .limit(1);

    if (handleConflict.length > 0) {
      finalHandle = await generateUniqueHandle(validatedData.handle);
    }

    const bodyWithSanitized = {
      ...validatedData,
      handle: finalHandle,
      descriptionHtml: sanitizedHtml,
    };

    const product = await db.transaction(async (tx) => {
      const [updatedProduct] = await tx
        .update(products)
        .set({
          title: bodyWithSanitized.title,
          handle: bodyWithSanitized.handle,
          description: bodyWithSanitized.description,
          descriptionHtml: bodyWithSanitized.descriptionHtml,
          availableForSale: bodyWithSanitized.availableForSale,
          seoTitle: bodyWithSanitized.seoTitle,
          seoDescription: bodyWithSanitized.seoDescription,
          tags: bodyWithSanitized.tags || [],
        })
        .where(eq(products.id, id))
        .returning();

      if (bodyWithSanitized.images && Array.isArray(bodyWithSanitized.images)) {
        await tx.delete(productImages).where(eq(productImages.productId, id));

        if (bodyWithSanitized.images.length > 0) {
          await tx.insert(productImages).values(
            bodyWithSanitized.images.map((img: any) => ({
              productId: id,
              url: img.url,
              altText: updatedProduct?.title,
              width: img.width ?? PRODUCT_IMAGE_WIDTH,
              height: img.height ?? PRODUCT_IMAGE_HEIGHT,
              position: img.position || 0,
              isFeatured: img.isFeatured || false,
            })),
          );
        }
      }

      if (bodyWithSanitized.sizes || bodyWithSanitized.colors) {
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

        const sizes = bodyWithSanitized.sizes || [];
        const colors = bodyWithSanitized.colors || [];

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
          const basePrice = bodyWithSanitized.basePrice || 0;
          const colorPrices = bodyWithSanitized.colorPrices || {};
          const largeSizePrice = bodyWithSanitized.largeSizePrice;
          const largeSizeFrom = bodyWithSanitized.largeSizeFrom;
          const sizePriceRules = Array.isArray(bodyWithSanitized.sizePriceRules)
            ? bodyWithSanitized.sizePriceRules
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

          const colorKey = color.trim().toLowerCase();
          if (colorPrices[colorKey] !== undefined) {
            return colorPrices[colorKey];
          }

          if (sizePriceRules.length > 0) {
            const sizeValue = parseInt(size, 10);
            if (!Number.isNaN(sizeValue)) {
              const matched = sizePriceRules.find(
                (rule: any) => sizeValue >= rule.from,
              );
              if (matched) return matched.price;
            }
          }

          if (
            typeof largeSizeFrom === "number" &&
            typeof largeSizePrice === "number" &&
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
                availableForSale: bodyWithSanitized.availableForSale ?? true,
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
              availableForSale: bodyWithSanitized.availableForSale ?? true,
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
              availableForSale: bodyWithSanitized.availableForSale ?? true,
              selectedOptions: [{ name: "Color", value: color }],
            });
          }
        }

        if (variants.length > 0) {
          await tx.insert(productVariants).values(variants);
        }
      }

      if (
        bodyWithSanitized.collectionIds !== undefined &&
        Array.isArray(bodyWithSanitized.collectionIds)
      ) {
        await tx
          .delete(productCollections)
          .where(eq(productCollections.productId, id));

        if (bodyWithSanitized.collectionIds.length > 0) {
          await tx.insert(productCollections).values(
            bodyWithSanitized.collectionIds.map((collectionId: string, index: number) => ({
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
