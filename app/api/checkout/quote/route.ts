import { quoteCheckout } from "lib/checkout/quote";
import { getCart } from "lib/database";
import { handleApiError } from "lib/errors";
import { limitByIp } from "lib/rate-limit";
import { getUserSession } from "lib/user-session";
import { NextRequest, NextResponse } from "next/server";

const text = (value: unknown, max = 80) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/**
 * Live totals for the checkout page: shipping for the chosen state, the
 * coupon, the delivery estimate and any bag problems — priced exactly the
 * way Pay will charge.
 */
export async function POST(request: NextRequest) {
  try {
    const limited = limitByIp(request, "checkout-quote", 120, 60_000);
    if (limited) return limited;

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const address = (
      typeof body.address === "object" && body.address !== null
        ? body.address
        : {}
    ) as Record<string, unknown>;

    const cart = await getCart();
    if (!cart?.id) {
      return NextResponse.json({ quote: null });
    }

    const session = await getUserSession();
    const quote = await quoteCheckout({
      cartId: cart.id,
      address: {
        state: text(address.state),
        lga: text(address.lga),
        ward: text(address.ward),
      },
      couponCode: text(body.couponCode, 50) || null,
      userId: session?.id,
      sessionId: session?.id ? null : cart.id,
    });

    return NextResponse.json(
      { quote },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleApiError(error, "Checkout quote");
  }
}
