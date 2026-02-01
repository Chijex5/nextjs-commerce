import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "lib/db";
import { abandonedCarts, users } from "lib/db/schema";
import { sendAbandonedCartEmail } from "@/lib/email/order-emails";
import { and, eq, lte } from "drizzle-orm";

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

    if (!cartId || !items || !Array.isArray(items) || items.length === 0) {
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

    const [existing] = await db
      .select()
      .from(abandonedCarts)
      .where(
        and(
          eq(abandonedCarts.userId, user.id),
          eq(abandonedCarts.cartId, cartId),
          eq(abandonedCarts.emailSent, false),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(abandonedCarts)
        .set({
          items,
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
        items,
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

    for (const cart of expiredCarts) {
      try {
        const items = cart.items as Array<{
          productTitle: string;
          variantTitle: string;
          quantity: number;
          price: number;
          imageUrl?: string;
        }>;

        await sendAbandonedCartEmail({
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

        emailsSent++;
      } catch (emailError) {
        console.error(
          `Failed to send abandoned cart email to ${cart.email}:`,
          emailError,
        );
        errors.push(`${cart.email}: ${(emailError as Error).message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${emailsSent} abandoned cart emails`,
      sent: emailsSent,
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
