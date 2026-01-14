"use client";

import { useEffect, useRef } from "react";
import { useCart } from "./cart-context";

export default function AbandonedCartTracker() {
  const { cart } = useCart();
  const lastTrackedKey = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!cart || !cart.id || cart.lines.length === 0) {
      return;
    }

    const items = cart.lines.map((line) => ({
      productTitle: line.merchandise.product.title,
      variantTitle: line.merchandise.title,
      quantity: line.quantity,
      price: parseFloat(line.cost.totalAmount.amount),
      imageUrl: line.merchandise.product.featuredImage?.url,
    }));

    const payload = {
      cartId: cart.id,
      items,
      cartTotal: parseFloat(cart.cost.totalAmount.amount),
    };

    const key = JSON.stringify({
      cartId: payload.cartId,
      cartTotal: payload.cartTotal,
      items: payload.items.map((item) => ({
        productTitle: item.productTitle,
        variantTitle: item.variantTitle,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    if (key === lastTrackedKey.current) {
      return;
    }

    lastTrackedKey.current = key;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await fetch("/api/abandoned-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error("Failed to track abandoned cart:", error);
      }
    }, 800);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [cart]);

  return null;
}
