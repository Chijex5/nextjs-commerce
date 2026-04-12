"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { motion } from "framer-motion";
import { trackAddToCart } from "lib/analytics";
import { Product, ProductVariant } from "lib/shopify/types";
import { useCart } from "./cart-context";

function SubmitButton({
  availableForSale,
  selectedVariantId,
}: {
  availableForSale: boolean;
  selectedVariantId: string | undefined;
}) {
  const baseClasses =
    "relative flex w-full items-center justify-center gap-2 rounded-none px-6 py-4 text-xs font-medium uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dp-ember,#BF5A28)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--dp-charcoal,#191209)]";
  const activeClasses =
    "bg-[var(--dp-ember,#BF5A28)] text-[var(--dp-cream,#F2E8D5)] ring-1 ring-[rgba(191,90,40,0.35)]";
  const inactiveClasses =
    "bg-[rgba(242,232,213,0.06)] text-[var(--dp-muted,#6A5A48)] ring-1 ring-[var(--dp-border,rgba(242,232,213,0.09))]";
  const disabledClasses = "cursor-not-allowed";

  if (!availableForSale) {
    return (
      <button
        disabled
        className={clsx(baseClasses, inactiveClasses, disabledClasses)}
      >
        Out Of Stock
      </button>
    );
  }

  if (!selectedVariantId) {
    return (
      <button
        aria-label="Please select an option"
        disabled
        className={clsx(baseClasses, inactiveClasses, disabledClasses)}
      >
        <PlusIcon className="h-5" />
        Add To Cart
      </button>
    );
  }

  return (
    <motion.button
      type="submit"
      aria-label="Add to cart"
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={clsx(baseClasses, activeClasses, "hover:opacity-90")}
    >
      <PlusIcon className="h-5" />
      Add To Cart
    </motion.button>
  );
}

export function AddToCart({
  product,
  selectedOptions,
}: {
  product: Product;
  selectedOptions: Record<string, string>;
}) {
  const { variants, availableForSale } = product;
  const { addCartItem, syncPendingCount } = useCart();

  const variant = variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === selectedOptions[option.name.toLowerCase()],
    ),
  );
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = variant?.id || defaultVariantId;
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!selectedVariant) return;

        addCartItem(selectedVariant, product);

        trackAddToCart({
          id: selectedVariant.id,
          name: product.title,
          price: parseFloat(selectedVariant.price.amount),
          quantity: 1,
        });
      }}
    >
      <SubmitButton
        availableForSale={availableForSale}
        selectedVariantId={selectedVariantId}
      />
      <p aria-live="polite" className="sr-only" role="status">
        {syncPendingCount > 0 ? "Syncing cart" : "Cart updated"}
      </p>
    </form>
  );
}
