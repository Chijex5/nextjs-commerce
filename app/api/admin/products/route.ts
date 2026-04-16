import { generateUniqueHandle, validateCollectionIds } from "@/lib/validation/product-helpers";
import { CreateProductSchema } from "@/lib/validation/product-schema";
import { validateAndSanitizeDescription } from "@/lib/validation/sanitize";
import { asc, eq, inArray } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import {
    collections,
    productCollections,
    productImages,
    productOptions,
    productVariants,
    products,
} from "lib/db/schema";
import { PRODUCT_IMAGE_HEIGHT, PRODUCT_IMAGE_WIDTH } from "lib/image-constants";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

type ProductImageInput = {
  url: string;
  altText?: string;
  width?: number;
  height?: number;
  position?: number;
  isFeatured?: boolean;
};

type BatchProductResponse = {
  products: Array<{
    id: string;
    title: string;
    handle: string;
    description: string | null;
    descriptionHtml: string | null;
    availableForSale: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    images: any[];
    variants: any[];
    options: any[];
    productCollections: any[];
  }>;
  missingIds: string[];
};

export async function GET(request: Request) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids") || "";
    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ products: [], missingIds: [] } satisfies BatchProductResponse);
    }

    const [productRows, imageRows, variantRows, optionRows, collectionRows] =
      await Promise.all([
        db.select().from(products).where(inArray(products.id, ids)),
        db
          .select()
          .from(productImages)
          .where(inArray(productImages.productId, ids))
          .orderBy(asc(productImages.position)),
        db
          .select()
          .from(productVariants)
          .where(inArray(productVariants.productId, ids))
          .orderBy(asc(productVariants.createdAt)),
        db
          .select()
          .from(productOptions)
          .where(inArray(productOptions.productId, ids)),
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
          .innerJoin(collections, eq(productCollections.collectionId, collections.id))
          .where(inArray(productCollections.productId, ids)),
      ]);

    const productsById = new Map(productRows.map((product) => [product.id, product]));
    const imagesByProductId = new Map<string, typeof imageRows>();
    const variantsByProductId = new Map<string, typeof variantRows>();
    const optionsByProductId = new Map<string, typeof optionRows>();
    const collectionsByProductId = new Map<string, typeof collectionRows>();

    for (const image of imageRows) {
      const current = imagesByProductId.get(image.productId) || [];
      current.push(image);
      imagesByProductId.set(image.productId, current);
    }

    for (const variant of variantRows) {
      const current = variantsByProductId.get(variant.productId) || [];
      current.push(variant);
      variantsByProductId.set(variant.productId, current);
    }

    for (const option of optionRows) {
      const current = optionsByProductId.get(option.productId) || [];
      current.push(option);
      optionsByProductId.set(option.productId, current);
    }

    for (const link of collectionRows) {
      const current = collectionsByProductId.get(link.productId) || [];
      current.push(link);
      collectionsByProductId.set(link.productId, current);
    }

    const productsResponse = ids
      .map((id) => {
        const product = productsById.get(id);
        if (!product) return null;

        return {
          ...product,
          tags: product.tags ?? [],
          images: imagesByProductId.get(id) || [],
          variants: variantsByProductId.get(id) || [],
          options: optionsByProductId.get(id) || [],
          productCollections: (collectionsByProductId.get(id) || []).map((link) => ({
            id: link.id,
            productId: link.productId,
            collectionId: link.collectionId,
            position: link.position,
            createdAt: link.createdAt,
            collection: link.collection,
          })),
        };
      })
      .filter(
        (product): product is NonNullable<typeof product> => product !== null,
      );

    const missingIds = ids.filter((id) => !productsById.has(id));

    return NextResponse.json({
      products: productsResponse,
      missingIds,
    } satisfies BatchProductResponse);
  } catch (error) {
    console.error("Error fetching products batch:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body with Zod
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

    // Validate collections exist
    if (validatedData.collectionIds.length > 0) {
      const collectionCheck = await validateCollectionIds(validatedData.collectionIds);
      if (!collectionCheck.valid) {
        return NextResponse.json(
          { error: collectionCheck.error },
          { status: 400 },
        );
      }
    }

    // Sanitize description HTML
    let sanitizedHtml = validatedData.descriptionHtml;
    if (sanitizedHtml) {
      const sanitizationResult = validateAndSanitizeDescription(sanitizedHtml);
      if (!sanitizationResult.valid) {
        return NextResponse.json(
          { error: sanitizationResult.error },
          { status: 400 },
        );
      }
      sanitizedHtml = sanitizationResult.sanitized;
    }

    // Ensure handle is unique (generateUniqueHandle checks for conflicts)
    const finalHandle = await generateUniqueHandle(validatedData.handle);

    const bodyWithSanitized = {
      ...validatedData,
      descriptionHtml: sanitizedHtml,
      handle: finalHandle,
    };

    const product = await db.transaction(async (tx) => {
      const [createdProduct] = await tx
        .insert(products)
        .values({
          title: bodyWithSanitized.title,
          handle: bodyWithSanitized.handle,
          description: bodyWithSanitized.description,
          descriptionHtml: bodyWithSanitized.descriptionHtml,
          availableForSale: bodyWithSanitized.availableForSale,
          seoTitle: bodyWithSanitized.seoTitle || `${bodyWithSanitized.title} - D'FOOTPRINT`,
          seoDescription: bodyWithSanitized.seoDescription,
          tags: bodyWithSanitized.tags,
        })
        .returning();

      if (!createdProduct) {
        throw new Error("Failed to create product");
      }

      const MAX_IMAGES = 20;
      const MAX_OPTIONS = 50;

      if (validatedData.images && Array.isArray(validatedData.images) && validatedData.images.length > 0) {
        const imagesToInsert = validatedData.images.slice(0, MAX_IMAGES);
        if (validatedData.images.length > MAX_IMAGES) {
          console.warn(
            `Product "${createdProduct.id}" (${validatedData.title}): ${validatedData.images.length} images provided but only ${MAX_IMAGES} will be saved (limit enforced).`,
          );
        }
        await tx.insert(productImages).values(
          imagesToInsert.map((img: ProductImageInput) => ({
            productId: createdProduct.id,
            url: img.url,
            altText: img.altText ?? createdProduct.title,
            width: img.width ?? PRODUCT_IMAGE_WIDTH,
            height: img.height ?? PRODUCT_IMAGE_HEIGHT,
            position: img.position || 0,
            isFeatured: img.isFeatured || false,
          })),
        );
      }

      const sizes = bodyWithSanitized.sizes || [];
      const colors = bodyWithSanitized.colors || [];

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

      const getVariantPrice = (size: string, color: string): number => {
        const basePrice = bodyWithSanitized.basePrice;
        const colorPrices = bodyWithSanitized.colorPrices || {};
        const largeSizePrice = bodyWithSanitized.largeSizePrice;
        const largeSizeFrom = bodyWithSanitized.largeSizeFrom;
        const sizePriceRules = bodyWithSanitized.sizePriceRules || [];

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
          largeSizeFrom !== undefined &&
          largeSizePrice !== null &&
          largeSizePrice !== undefined &&
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
              productId: createdProduct.id,
              title: `${size} / ${color}`,
              price: String(getVariantPrice(size, color)),
              currencyCode: "NGN",
              availableForSale: bodyWithSanitized.availableForSale,
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
            price: String(getVariantPrice(size, "")),
            currencyCode: "NGN",
            availableForSale: bodyWithSanitized.availableForSale,
            selectedOptions: [{ name: "Size", value: size }],
          });
        }
      } else if (colors.length > 0) {
        for (const color of colors) {
          variants.push({
            productId: createdProduct.id,
            title: color,
            price: String(getVariantPrice("", color)),
            currencyCode: "NGN",
            availableForSale: bodyWithSanitized.availableForSale,
            selectedOptions: [{ name: "Color", value: color }],
          });
        }
      } else {
        variants.push({
          productId: createdProduct.id,
          title: "Default",
          price: String(bodyWithSanitized.basePrice),
          currencyCode: "NGN",
          availableForSale: bodyWithSanitized.availableForSale,
          selectedOptions: [],
        });
      }

      if (variants.length > 0) {
        await tx.insert(productVariants).values(variants);
      }

      if (bodyWithSanitized.collectionIds.length > 0) {
        await tx.insert(productCollections).values(
          bodyWithSanitized.collectionIds.map((collectionId: string, index: number) => ({
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
