"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import type { CartItem } from "lib/shopify/types";
import { useCart } from "./cart-context";

export function DeleteItemButton({ item }: { item: CartItem }) {
  const { updateCartItem } = useCart();
  const merchandiseId = item.merchandise.id;

  return (
    <button
      type="button"
      aria-label="Remove cart item"
      className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-neutral-500"
      onClick={() => updateCartItem(merchandiseId, "delete")}
    >
      <XMarkIcon className="mx-[1px] h-4 w-4 text-white dark:text-black" />
    </button>
  );
}
