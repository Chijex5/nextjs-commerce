import {
    addToCart,
    createCart,
    getCart,
    removeFromCart,
    updateCart,
} from "lib/database";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type SyncItem = {
  merchandiseId: string;
  quantity: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { items?: SyncItem[] };
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!items.length) {
      return NextResponse.json({ ok: true, cart: await getCart() });
    }

    let cart = await getCart();

    if (!cart) {
      const hasPositiveQuantity = items.some((item) => item.quantity > 0);
      if (!hasPositiveQuantity) {
        return NextResponse.json({ ok: true, cart: null });
      }

      const newCart = await createCart();
      (await cookies()).set("cartId", newCart.id!);
      cart = newCart;
    }

    for (const item of items) {
      const merchandiseId = item?.merchandiseId;
      const quantity = Math.max(0, Math.floor(item?.quantity ?? 0));

      if (!merchandiseId) continue;

      const existingLine = cart.lines.find(
        (line) => line.merchandise.id === merchandiseId,
      );

      if (quantity === 0) {
        if (existingLine?.id) {
          cart = await removeFromCart([existingLine.id]);
        }
        continue;
      }

      if (existingLine?.id) {
        cart = await updateCart([
          {
            id: existingLine.id,
            merchandiseId,
            quantity,
          },
        ]);
      } else {
        cart = await addToCart([
          {
            merchandiseId,
            quantity,
          },
        ]);
      }
    }

    return NextResponse.json({ ok: true, cart });
  } catch (error) {
    console.error("[cart/sync] failed", {
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined,
      error,
    });

    return NextResponse.json(
      { ok: false, error: "Cart sync failed" },
      { status: 500 },
    );
  }
}
