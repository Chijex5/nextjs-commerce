import { eq } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import {
  productImages,
  productOptions,
  productVariants,
  products,
} from "lib/db/schema";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [originalProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!originalProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const [originalImages, originalVariants, originalOptions] =
      await Promise.all([
        db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, id)),
        db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, id)),
        db
          .select()
          .from(productOptions)
          .where(eq(productOptions.productId, id)),
      ]);

    const newProduct = await db.transaction(async (tx) => {
      const [createdProduct] = await tx
        .insert(products)
        .values({
          title: `${originalProduct.title} (Copy)`,
          handle: `${originalProduct.handle}-copy-${Date.now()}`,
          description: originalProduct.description,
          descriptionHtml: originalProduct.descriptionHtml,
          availableForSale: originalProduct.availableForSale,
          seoTitle: originalProduct.seoTitle,
          seoDescription: originalProduct.seoDescription,
          tags: originalProduct.tags,
        })
        .returning();

      if (!createdProduct) {
        throw new Error("Failed to create duplicated product");
      }

      if (originalImages.length > 0) {
        await tx.insert(productImages).values(
          originalImages.map((img) => ({
            productId: createdProduct.id,
            url: img.url,
            altText: img.altText,
            width: img.width,
            height: img.height,
            position: img.position,
            isFeatured: img.isFeatured,
          })),
        );
      }

      if (originalOptions.length > 0) {
        await tx.insert(productOptions).values(
          originalOptions.map((opt) => ({
            productId: createdProduct.id,
            name: opt.name,
            values: opt.values,
          })),
        );
      }

      if (originalVariants.length > 0) {
        await tx.insert(productVariants).values(
          originalVariants.map((variant) => ({
            productId: createdProduct.id,
            title: variant.title,
            price: String(variant.price),
            currencyCode: variant.currencyCode,
            availableForSale: variant.availableForSale,
            selectedOptions: variant.selectedOptions ?? [],
          })),
        );
      }

      return createdProduct;
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error("Error duplicating product:", error);
    return NextResponse.json(
      { error: "Failed to duplicate product" },
      { status: 500 },
    );
  }
}
