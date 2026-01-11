"use client";

import { AddToCart } from "components/cart/add-to-cart";
import Price from "components/price";
import Prose from "components/prose";
import { Product, ProductVariant } from "lib/shopify/types";
import { useSearchParams } from "next/navigation";
import { VariantSelector } from "./variant-selector";

export function ProductDescription({ product }: { product: Product }) {
  const searchParams = useSearchParams();

  // Find the selected variant based on search params
  const selectedVariant = product.variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === searchParams.get(option.name.toLowerCase()),
    ),
  );

  // Use the selected variant's price, or fall back to the first variant or max price
  const displayVariant = selectedVariant || product.variants[0];
  const displayPrice = displayVariant
    ? displayVariant.price
    : product.priceRange.maxVariantPrice;

  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-2 text-3xl font-medium md:text-5xl">
          {product.title}
        </h1>
        <div className="mr-auto w-auto rounded-full bg-blue-600 p-2 text-sm text-white">
          <Price
            amount={displayPrice.amount}
            currencyCode={displayPrice.currencyCode}
          />
        </div>
      </div>
      <VariantSelector options={product.options} variants={product.variants} />
      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-tight dark:text-white/[60%]"
          html={product.descriptionHtml}
        />
      ) : null}
      <AddToCart product={product} />
    </>
  );
}
