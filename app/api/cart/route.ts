import { NextResponse } from "next/server";
import { getCart } from "lib/database";

export async function GET() {
  try {
    const cart = await getCart();
    
    if (!cart) {
      return NextResponse.json({ cart: null });
    }

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("Failed to fetch cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}
