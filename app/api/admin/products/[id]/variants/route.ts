import { NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { productVariants, products } from "lib/db/schema";
import { asc, eq, inArray } from "drizzle-orm";

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
    const body = await request.json();
    const { variants } = body;

    if (!variants || !Array.isArray(variants)) {
      return NextResponse.json(
        { error: "Variants array is required" },
        { status: 400 },
      );
    }

    const variantsToDelete = variants.filter((v) => v.isDeleted && !v.isNew);
    const variantsToCreate = variants.filter((v) => v.isNew && !v.isDeleted);
    const variantsToUpdate = variants.filter(
      (v) => v.isModified && !v.isDeleted && !v.isNew,
    );

    [...variantsToCreate, ...variantsToUpdate].forEach((variant) => {
      const price = parseFloat(variant.price);
      if (isNaN(price) || price < 0) {
        throw new Error(
          `Invalid price for variant "${variant.title}": ${variant.price}`,
        );
      }
    });

    await db.transaction(async (tx) => {
      if (variantsToDelete.length > 0) {
        await tx
          .delete(productVariants)
          .where(inArray(productVariants.id, variantsToDelete.map((v) => v.id)));
      }

      if (variantsToCreate.length > 0) {
        await tx.insert(productVariants).values(
          variantsToCreate.map((variant) => ({
            productId: id,
            title: variant.title,
            price: String(parseFloat(variant.price)),
            currencyCode: "NGN",
            availableForSale: variant.availableForSale,
            selectedOptions: variant.selectedOptions || [],
          })),
        );
      }

      for (const variant of variantsToUpdate) {
        await tx
          .update(productVariants)
          .set({
            title: variant.title,
            price: String(parseFloat(variant.price)),
            availableForSale: variant.availableForSale,
            selectedOptions: variant.selectedOptions || [],
          })
          .where(eq(productVariants.id, variant.id));
      }
    });

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    const productVariantRows = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .orderBy(asc(productVariants.createdAt));

    return NextResponse.json({
      ...product,
      variants: productVariantRows,
    });
  } catch (error) {
    console.error("Error updating variants:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update variants";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
