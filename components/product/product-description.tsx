"use client";

import { AddToCart } from "components/cart/add-to-cart";
import LoadingDots from "components/loading-dots";
import Price from "components/price";
import Prose from "components/prose";
import { SizeGuideButton } from "components/size-guide-modal";
import { trackProductView } from "lib/analytics";
import { Product, ProductVariant } from "lib/shopify/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { VariantSelector } from "./variant-selector";

export function ProductDescription({ product }: { product: Product }) {
  const searchParams = useSearchParams();
  const [alertEmail, setAlertEmail] = useState("");
  const [alertLoading, setAlertLoading] = useState(false);

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

  useEffect(() => {
    if (!displayPrice?.amount) return;

    trackProductView({
      id: product.id,
      name: product.title,
      price: parseFloat(displayPrice.amount),
    });
  }, [product.id, product.title, displayPrice.amount]);

  const handleAlertSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!alertEmail) return;

    setAlertLoading(true);
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: alertEmail }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "You're on the list!");
        setAlertEmail("");
      } else {
        toast.error(data.error || "Couldn't subscribe. Try again.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setAlertLoading(false);
    }
  };

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
      
      {/* Size Guide Link */}
      <div className="mb-4 flex items-center gap-2">
        <SizeGuideButton productType="footwear" />
      </div>

      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-tight dark:text-white/[60%]"
          html={product.descriptionHtml}
        />
      ) : null}
      <AddToCart product={product} />
      <form
        onSubmit={handleAlertSubmit}
        className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        <p className="font-medium text-neutral-900 dark:text-white">
          Get restock & price drop alerts
        </p>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          We will only send the good stuff.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="email"
            value={alertEmail}
            onChange={(event) => setAlertEmail(event.target.value)}
            placeholder="you@email.com"
            required
            className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-950"
          />
          <button
            type="submit"
            disabled={alertLoading}
            className="rounded-md bg-black px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {alertLoading ? (
              <LoadingDots className="bg-white dark:bg-black" />
            ) : (
              "Notify me"
            )}
          </button>
        </div>
      </form>
    </>
  );
}
