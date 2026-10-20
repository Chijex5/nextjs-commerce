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
import { lineKey } from "lib/pairing";
import type { Cart, CartItem } from "lib/types/commerce";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const keyOf = (line: CartItem) => lineKey(line.merchandise.id, line.pair?.id);

const buildCartSignature = (cart: Cart | undefined) =>
  JSON.stringify(
    (cart?.lines || [])
      .map((line) => ({ key: keyOf(line), quantity: line.quantity }))
      .sort((a, b) => a.key.localeCompare(b.key)),
  );

export async function POST(request: NextRequest) {
  let abandonedCartId: string | undefined;

  try {
    const body = (await request.json()) as { abandonedCartId?: string };
    abandonedCartId = body.abandonedCartId?.trim();

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
      // Compare/replace by variant (and Hers pair, for couples sets) to keep
      // product identity across carts where line ids are session-specific.
      const sourceKeys = new Set(sourceCart.lines.map(keyOf));

      const lineIdsToRemove = currentCart.lines
        .filter((line) => !sourceKeys.has(keyOf(line)))
        .map((line) => line.id)
        // Cart lines from local-first optimistic state can temporarily miss ids.
        .filter((lineId): lineId is string => Boolean(lineId));

      if (lineIdsToRemove.length > 0) {
        currentCart = await removeFromCart(lineIdsToRemove);
      }

      type LineInput = {
        merchandiseId: string;
        pairMerchandiseId: string | null;
        quantity: number;
      };
      const linesToUpdate: Array<LineInput & { id: string }> = [];
      const linesToAdd: LineInput[] = [];

      for (const sourceLine of sourceCart.lines) {
        const existingLine = currentCart.lines.find(
          (line) => keyOf(line) === keyOf(sourceLine),
        );
        const input = {
          merchandiseId: sourceLine.merchandise.id,
          pairMerchandiseId: sourceLine.pair?.id ?? null,
          quantity: sourceLine.quantity,
        };

        if (existingLine?.id) {
          if (existingLine.quantity !== sourceLine.quantity) {
            linesToUpdate.push({ id: existingLine.id, ...input });
          }
        } else {
          linesToAdd.push(input);
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
    console.error("Failed to recover abandoned cart:", abandonedCartId, error);
    return NextResponse.json(
      { error: "Failed to recover abandoned cart" },
      { status: 500 },
    );
  }
}
