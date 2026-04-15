import {
  addToCart,
  createCart,
  getCart as getSessionCart,
  removeFromCart,
  updateCart,
} from "lib/database";
import { db } from "lib/db";
import { getCart as getCartById } from "lib/db/queries";
import { abandonedCarts } from "lib/db/schema";
import type { Cart } from "lib/shopify/types";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const buildCartSignature = (cart: Cart | undefined) =>
  JSON.stringify(
    (cart?.lines || [])
      .map((line) => ({
        merchandiseId: line.merchandise.id,
        quantity: line.quantity,
      }))
      .sort((a, b) => a.merchandiseId.localeCompare(b.merchandiseId)),
  );

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { abandonedCartId?: string };
    const abandonedCartId = body.abandonedCartId?.trim();

    if (!abandonedCartId) {
      return NextResponse.json(
        { error: "abandonedCartId is required" },
        { status: 400 },
      );
    }

    const [abandonedCart] = await db
      .select()
      .from(abandonedCarts)
      .where(eq(abandonedCarts.id, abandonedCartId))
      .limit(1);

    if (!abandonedCart) {
      return NextResponse.json(
        { error: "Abandoned cart not found" },
        { status: 404 },
      );
    }

    const sourceCartId = abandonedCart.cartId;
    const sourceCart = sourceCartId
      ? await getCartById(sourceCartId)
      : undefined;

    if (!sourceCart || sourceCart.lines.length === 0) {
      return NextResponse.json({
        restored: false,
        replaced: false,
        cart: await getSessionCart(),
      });
    }

    let currentCart = await getSessionCart();
    if (!currentCart) {
      currentCart = await createCart();
    }

    const sourceSignature = buildCartSignature(sourceCart);
    const currentSignature = buildCartSignature(currentCart);
    const shouldReplace = sourceSignature !== currentSignature;

    if (shouldReplace) {
      // Compare/replace by merchandise variant id to preserve product identity
      // across carts where line ids are session-specific.
      const sourceByVariantId = new Map(
        sourceCart.lines.map((line) => [line.merchandise.id, line.quantity]),
      );

      const lineIdsToRemove = currentCart.lines
        .filter((line) => !sourceByVariantId.has(line.merchandise.id))
        .map((line) => line.id)
        // Cart lines from local-first optimistic state can temporarily miss ids.
        .filter((lineId): lineId is string => Boolean(lineId));

      if (lineIdsToRemove.length > 0) {
        currentCart = await removeFromCart(lineIdsToRemove);
      }

      const linesToUpdate: Array<{
        id: string;
        merchandiseId: string;
        quantity: number;
      }> = [];
      const linesToAdd: Array<{ merchandiseId: string; quantity: number }> = [];

      for (const sourceLine of sourceCart.lines) {
        const existingLine = currentCart.lines.find(
          (line) => line.merchandise.id === sourceLine.merchandise.id,
        );

        if (existingLine?.id) {
          if (existingLine.quantity !== sourceLine.quantity) {
            linesToUpdate.push({
              id: existingLine.id,
              merchandiseId: sourceLine.merchandise.id,
              quantity: sourceLine.quantity,
            });
          }
        } else {
          linesToAdd.push({
            merchandiseId: sourceLine.merchandise.id,
            quantity: sourceLine.quantity,
          });
        }
      }

      if (linesToUpdate.length > 0) {
        currentCart = await updateCart(linesToUpdate);
      }

      if (linesToAdd.length > 0) {
        currentCart = await addToCart(linesToAdd);
      }
    }

    await db
      .update(abandonedCarts)
      .set({
        recovered: true,
        recoveredAt: new Date(),
      })
      .where(eq(abandonedCarts.id, abandonedCart.id));

    return NextResponse.json({
      restored: true,
      replaced: shouldReplace,
      cart: currentCart,
    });
  } catch (error) {
    console.error("Failed to recover abandoned cart:", error);
    return NextResponse.json(
      { error: "Failed to recover abandoned cart" },
      { status: 500 },
    );
  }
}
