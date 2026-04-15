"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import type { Cart } from "lib/shopify/types";
import { useCart } from "./cart-context";

export default function AbandonedCartRecovery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { replaceCart } = useCart();
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    const abandonedCartId = searchParams.get("abandoned-cart");
    if (!abandonedCartId) return;
    if (processedRef.current === abandonedCartId) return;

    processedRef.current = abandonedCartId;

    const recover = async () => {
      try {
        const response = await fetch("/api/abandoned-cart/recover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ abandonedCartId }),
        });

        if (response.ok) {
          const data = (await response.json()) as { cart?: Cart };
          if (data?.cart) {
            replaceCart(data.cart);
          }
        }
      } catch (error) {
        console.error("Failed to recover abandoned cart:", error);
      } finally {
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.delete("abandoned-cart");
        const nextQuery = nextParams.toString();
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
          scroll: false,
        });
      }
    };

    void recover();
  }, [pathname, replaceCart, router, searchParams]);

  return null;
}
