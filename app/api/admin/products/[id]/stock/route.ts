import { and, eq, inArray } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { productVariants } from "lib/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const StockSchema = z.object({
  variants: z
    .array(
      z.object({
        id: z.string().uuid(),
        trackInventory: z.boolean(),
        stockQuantity: z.coerce.number().int().min(0).max(100000).nullable(),
      }),
    )
    .min(1)
    .max(500),
});

/**
 * Stock counts per variant. Tracked variants sell until zero (and stop
 * selling at zero); untracked ones are made to order and always on sale.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = StockSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  }

  try {
    const updated = await db.transaction(async (tx) => {
      const owned = await tx
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(
          and(
            eq(productVariants.productId, id),
            inArray(
              productVariants.id,
              parsed.data.variants.map((v) => v.id),
            ),
          ),
        );
      const ownedIds = new Set(owned.map((v) => v.id));

      let count = 0;
      for (const v of parsed.data.variants) {
        if (!ownedIds.has(v.id)) continue;
        const quantity = v.trackInventory ? (v.stockQuantity ?? 0) : null;
        await tx
          .update(productVariants)
          .set({
            trackInventory: v.trackInventory,
            stockQuantity: quantity,
            availableForSale: !v.trackInventory || (quantity ?? 0) > 0,
            updatedAt: new Date(),
          })
          .where(eq(productVariants.id, v.id));
        count++;
      }
      return count;
    });

    return NextResponse.json({ updated });
  } catch (error) {
    console.error("Error updating stock:", error);
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 },
    );
  }
}
