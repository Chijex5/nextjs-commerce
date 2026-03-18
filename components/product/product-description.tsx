"use client";

import { AddToCart } from "components/cart/add-to-cart";
import LoadingDots from "components/loading-dots";
import Price from "components/price";
import Prose from "components/prose";
import { trackProductView } from "lib/analytics";
import { Product, ProductVariant } from "lib/shopify/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { VariantSelector } from "./variant-selector";

export function ProductDescription({
  product,
  reviewAggregate,
}: {
  product: Product;
  reviewAggregate?: { averageRating: number | null; reviewCount: number };
}) {
  const searchParams = useSearchParams();
  const [alertEmail, setAlertEmail] = useState("");
  const [alertLoading, setAlertLoading] = useState(false);

  const urlSelection = useMemo(() => {
    const selection: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      selection[key] = value;
    });
    return selection;
  }, [searchParams]);

  const [selectedOptions, setSelectedOptions] =
    useState<Record<string, string>>(urlSelection);

  useEffect(() => {
    setSelectedOptions((current) => {
      const keys = new Set([
        ...Object.keys(current),
        ...Object.keys(urlSelection),
      ]);
      for (const key of keys) {
        if ((current[key] ?? "") !== (urlSelection[key] ?? "")) {
          return urlSelection;
        }
      }
      return current;
    });
  }, [urlSelection]);

  const selectedVariant = product.variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === selectedOptions[option.name.toLowerCase()],
    ),
  );

  const displayVariant = selectedVariant || product.variants[0];
  const displayPrice = displayVariant
    ? displayVariant.price
    : product.priceRange.maxVariantPrice;
  const formatPrice = (amount: string, currencyCode: string) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "narrowSymbol",
    }).format(parseFloat(amount));

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

  const hasVariedPricing =
    product.priceRange.minVariantPrice.amount !==
    product.priceRange.maxVariantPrice.amount;
  const ratingLabel =
    reviewAggregate && reviewAggregate.reviewCount > 0
      ? `${reviewAggregate.averageRating?.toFixed(1) ?? "0.0"} / 5 (${
          reviewAggregate.reviewCount
        } reviews)`
      : "No reviews yet";

  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
          Product details
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-neutral-900 md:text-5xl dark:text-neutral-100">
          {product.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-neutral-600 dark:text-neutral-300">
          <span className="rounded-full border border-neutral-200 px-3 py-1 dark:border-neutral-700">
            {product.availableForSale ? "In stock" : "Out of stock"}
          </span>
          <span className="rounded-full border border-neutral-200 px-3 py-1 dark:border-neutral-700">
            {ratingLabel}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black">
            <Price
              amount={displayPrice.amount}
              currencyCode={displayPrice.currencyCode}
            />
          </div>
          {hasVariedPricing ? (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Range{" "}
              {formatPrice(
                product.priceRange.minVariantPrice.amount,
                product.priceRange.minVariantPrice.currencyCode,
              )}{" "}
              -{" "}
              {formatPrice(
                product.priceRange.maxVariantPrice.amount,
                product.priceRange.maxVariantPrice.currencyCode,
              )}
            </span>
          ) : null}
        </div>
      </div>
      <VariantSelector
        options={product.options}
        variants={product.variants}
        selectedOptions={selectedOptions}
        onOptionChange={(name, value) =>
          setSelectedOptions((current) => ({ ...current, [name]: value }))
        }
      />
      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-6 text-neutral-700 dark:text-neutral-300"
          html={product.descriptionHtml}
        />
      ) : null}

      <div className="mb-6 grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300">
        <div className="flex items-start gap-3">
          <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              Handcrafted quality
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Made by hand in Lagos with attention to every detail.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              Nationwide delivery
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              We deliver across Nigeria with secure packaging.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              Custom requests
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Need a different fit or style? Custom orders are welcome.
            </p>
          </div>
        </div>
      </div>
      <AddToCart product={product} selectedOptions={selectedOptions} />
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
