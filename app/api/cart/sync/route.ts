import {
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCart,
} from "lib/database";
import { isMockData } from "lib/data/source";
import { lineKey } from "lib/pairing";
import { NextRequest, NextResponse } from "next/server";

type SyncItem = {
  merchandiseId: string;
  /** The Hers variant when the line is a couples set. */
  pairMerchandiseId?: string | null;
  quantity: number;
};

export async function POST(request: NextRequest) {
  // Mock mode keeps the bag in the browser only (no database to sync to).
  if (isMockData) return NextResponse.json({ ok: true, cart: null });

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

      cart = await createCart();
    }

    for (const item of items) {
      const merchandiseId = item?.merchandiseId;
      const pairMerchandiseId =
        typeof item?.pairMerchandiseId === "string" && item.pairMerchandiseId
          ? item.pairMerchandiseId
          : null;
      const quantity = Math.max(0, Math.floor(item?.quantity ?? 0));

      if (!merchandiseId) continue;

      const key = lineKey(merchandiseId, pairMerchandiseId);
      const existingLine = cart.lines.find(
        (line) => lineKey(line.merchandise.id, line.pair?.id) === key,
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
            pairMerchandiseId,
            quantity,
          },
        ]);
      } else {
        cart = await addToCart([
          {
            merchandiseId,
            pairMerchandiseId,
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
