import { authOptions } from "@/lib/auth";
import { sendAbandonedCartEmail } from "@/lib/email/order-emails";
import { and, desc, eq, isNotNull, lt, lte } from "drizzle-orm";
import { db } from "lib/db";
import { abandonedCarts, carts, users } from "lib/db/schema";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

type AbandonedCartItem = {
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: number;
  imageUrl?: string;
};

const normalizeCartItems = (items: unknown): AbandonedCartItem[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      productTitle:
        typeof item?.productTitle === "string" ? item.productTitle.trim() : "",
      variantTitle:
        typeof item?.variantTitle === "string" ? item.variantTitle.trim() : "",
      quantity: Math.max(0, Number(item?.quantity ?? 0)),
      price: Math.max(0, Number(item?.price ?? 0)),
      imageUrl: typeof item?.imageUrl === "string" ? item.imageUrl : undefined,
    }))
    .filter(
      (item) =>
        item.productTitle.length > 0 &&
        item.variantTitle.length > 0 &&
        item.quantity > 0,
    )
    .sort((a, b) => {
      const product = a.productTitle.localeCompare(b.productTitle);
      if (product !== 0) return product;
      const variant = a.variantTitle.localeCompare(b.variantTitle);
      if (variant !== 0) return variant;
      return a.price - b.price;
    });
};

const buildItemSignature = (items: AbandonedCartItem[]) =>
  JSON.stringify(
    items.map((item) => ({
      productTitle: item.productTitle,
      variantTitle: item.variantTitle,
      quantity: item.quantity,
      price: item.price,
    })),
  );

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "User must be logged in to track abandoned cart" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { cartId, items, cartTotal } = body;
    const normalizedItems = normalizeCartItems(items);

    if (!cartId || normalizedItems.length === 0) {
      return NextResponse.json({ error: "Invalid cart data" }, { status: 400 });
    }

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingUserRecords = await db
      .select()
      .from(abandonedCarts)
      .where(
        and(
          eq(abandonedCarts.userId, user.id),
          eq(abandonedCarts.recovered, false),
        ),
      )
      .orderBy(desc(abandonedCarts.createdAt))
      .limit(30);

    const incomingSignature = buildItemSignature(normalizedItems);
    const existingBySignature = existingUserRecords.find(
      (record) =>
        buildItemSignature(normalizeCartItems(record.items)) ===
        incomingSignature,
    );
    const existingByCartId = existingUserRecords.find(
      (record) => record.cartId === cartId,
    );
    const existing = existingBySignature || existingByCartId;

    if (existing) {
      // If an email was already sent for this cart, do not create a new
      // tracking record — this prevents sending duplicate abandoned cart emails.
      if (existing.emailSent) {
        return NextResponse.json({ success: true, message: "Cart tracked" });
      }

      await db
        .update(abandonedCarts)
        .set({
          cartId,
          items: normalizedItems,
          cartTotal: String(cartTotal),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        })
        .where(eq(abandonedCarts.id, existing.id));
    } else {
      await db.insert(abandonedCarts).values({
        userId: user.id,
        cartId,
        email: user.email,
        customerName: user.name || "Valued Customer",
        items: normalizedItems,
        cartTotal: String(cartTotal),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
    }

    return NextResponse.json({ success: true, message: "Cart tracked" });
  } catch (error) {
    console.error("Failed to track abandoned cart:", error);
    return NextResponse.json(
      { error: "Failed to track abandoned cart" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const requestSecret = request.headers.get("x-cron-secret");

    if (!cronSecret || requestSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expiredCarts = await db
      .select()
      .from(abandonedCarts)
      .where(
        and(
          eq(abandonedCarts.emailSent, false),
          eq(abandonedCarts.recovered, false),
          lte(abandonedCarts.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(abandonedCarts.createdAt))
      .limit(50);

    if (expiredCarts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No abandoned carts to process",
        sent: 0,
      });
    }

    let emailsSent = 0;
    const errors: string[] = [];

    const dedupedCarts = new Map<string, (typeof expiredCarts)[number]>();
    const duplicateIdsByKey = new Map<string, string[]>();

    for (const cart of expiredCarts) {
      const signature = buildItemSignature(normalizeCartItems(cart.items));
      const key = `${cart.email}|${signature}`;

      if (!dedupedCarts.has(key)) {
        dedupedCarts.set(key, cart);
        duplicateIdsByKey.set(key, []);
      } else {
        const duplicates = duplicateIdsByKey.get(key) || [];
        duplicates.push(cart.id);
        duplicateIdsByKey.set(key, duplicates);
      }
    }

    for (const [key, cart] of dedupedCarts.entries()) {
      try {
        const [currentCart] = await db
          .select({ id: carts.id, totalQuantity: carts.totalQuantity })
          .from(carts)
          .where(eq(carts.id, cart.cartId))
          .limit(1);

        if (!currentCart || currentCart.totalQuantity <= 0) {
          await db
            .update(abandonedCarts)
            .set({
              recovered: true,
              recoveredAt: new Date(),
            })
            .where(eq(abandonedCarts.id, cart.id));

          const duplicateIds = duplicateIdsByKey.get(key) || [];
          if (duplicateIds.length > 0) {
            for (const duplicateId of duplicateIds) {
              await db
                .update(abandonedCarts)
                .set({
                  recovered: true,
                  recoveredAt: new Date(),
                })
                .where(eq(abandonedCarts.id, duplicateId));
            }
          }

          continue;
        }

        const items = normalizeCartItems(cart.items);

        await sendAbandonedCartEmail({
          abandonedCartId: cart.id,
          customerName: cart.customerName,
          email: cart.email,
          items,
          cartTotal: Number(cart.cartTotal),
        });

        await db
          .update(abandonedCarts)
          .set({
            emailSent: true,
            emailSentAt: new Date(),
          })
          .where(eq(abandonedCarts.id, cart.id));

        const duplicateIds = duplicateIdsByKey.get(key) || [];
        if (duplicateIds.length > 0) {
          for (const duplicateId of duplicateIds) {
            await db
              .update(abandonedCarts)
              .set({
                emailSent: true,
                emailSentAt: new Date(),
              })
              .where(eq(abandonedCarts.id, duplicateId));
          }
        }

        emailsSent++;
      } catch (emailError) {
        console.error(
          `Failed to send abandoned cart email to ${cart.email}:`,
          emailError,
        );
        errors.push(`${cart.email}: ${(emailError as Error).message}`);
      }
    }

    // Purge expired ghost carts (empty carts whose expiry has passed)
    const deleteResult = await db
      .delete(carts)
      .where(
        and(
          isNotNull(carts.expiresAt),
          lt(carts.expiresAt, new Date()),
          eq(carts.totalQuantity, 0),
        ),
      );
    const deletedCarts =
      "rowsAffected" in deleteResult ? deleteResult.rowsAffected : 0;

    return NextResponse.json({
      success: true,
      message: `Sent ${emailsSent} abandoned cart emails`,
      sent: emailsSent,
      deletedGhostCarts: deletedCarts ?? 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Failed to process abandoned carts:", error);
    return NextResponse.json(
      { error: "Failed to process abandoned carts" },
      { status: 500 },
    );
  }
}
