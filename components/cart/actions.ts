"use server";

import { getCart } from "lib/database";
import { redirect } from "next/navigation";

export async function redirectToCheckout() {
  const cart = await getCart();

  if (!cart || cart.lines.length === 0) {
    return;
  }

  redirect(cart.checkoutUrl || "/checkout");
}
