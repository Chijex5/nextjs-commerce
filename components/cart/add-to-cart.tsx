"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { addItem } from "components/cart/actions";
import { Product, ProductVariant } from "lib/shopify/types";
import { trackAddToCart } from "lib/analytics";
import { motion } from "framer-motion";
import { useActionState } from "react";
import { useCart } from "./cart-context";
import LoadingDots from "components/loading-dots";

function SubmitButton({
  availableForSale,
  selectedVariantId,
  pending,
}: {
  availableForSale: boolean;
  selectedVariantId: string | undefined;
  pending: boolean;
}) {
  const baseClasses =
    "relative flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900";
  const activeClasses =
    "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/30";
  const inactiveClasses =
    "bg-neutral-200 text-neutral-500 ring-1 ring-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700";
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
      aria-label="Add to cart"
      disabled={pending}
      whileTap={!pending ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.15 }}
      className={clsx(baseClasses, activeClasses, {
        "hover:brightness-110": !pending,
        "cursor-not-allowed opacity-70": pending,
      })}
    >
      {pending ? (
        <>
          <LoadingDots className="bg-white/90" />
          <span className="text-sm font-medium">Adding</span>
        </>
      ) : (
        <>
          <PlusIcon className="h-5" />
          Add To Cart
        </>
      )}
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
  const { addCartItem } = useCart();
  const [message, formAction, pending] = useActionState(addItem, null);

  const variant = variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === selectedOptions[option.name.toLowerCase()],
    ),
  );
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = variant?.id || defaultVariantId;
  const addItemAction = formAction.bind(null, selectedVariantId);
  const finalVariant = variants.find(
    (variant) => variant.id === selectedVariantId,
  )!;

  return (
    <form
      action={async () => {
        addCartItem(finalVariant, product);
        trackAddToCart({
          id: finalVariant.id,
          name: product.title,
          price: parseFloat(finalVariant.price.amount),
          quantity: 1,
        });
        await addItemAction();
      }}
    >
      <SubmitButton
        availableForSale={availableForSale}
        selectedVariantId={selectedVariantId}
        pending={pending}
      />
      <p aria-live="polite" className="sr-only" role="status">
        {message}
      </p>
    </form>
  );
}
