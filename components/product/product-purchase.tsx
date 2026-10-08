"use client";

import clsx from "clsx";
import { useCart } from "components/cart/cart-context";
import { formatNaira } from "components/product/product-card";
import { trackAddToCart, trackProductView } from "lib/analytics";
import type { Product, ProductVariant } from "lib/shopify/types";
import { Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Selection = Record<string, string>;

const key = (name: string) => name.toLowerCase();

function matches(variant: ProductVariant, selection: Selection) {
  return variant.selectedOptions.every(
    (o) => selection[key(o.name)] === o.value,
  );
}

/**
 * Size/option picker + Add to bag. Adding is optimistic (the bag updates
 * instantly and syncs in the background). On phones a sticky bar keeps the
 * price and button in reach while scrolling.
 */
export function ProductPurchase({ product }: { product: Product }) {
  const { addCartItem } = useCart();
  const optionsRef = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState(false);
  const [nudge, setNudge] = useState(false);

  // Options with a single value are pre-selected; the URL (e.g. ?size=42)
  // is read after mount so server and client render the same markup.
  const [selection, setSelection] = useState<Selection>(() => {
    const initial: Selection = {};
    for (const option of product.options) {
      if (option.values.length === 1)
        initial[key(option.name)] = option.values[0]!;
    }
    return initial;
  });

  useEffect(() => {
    const fromUrl: Selection = {};
    new URLSearchParams(window.location.search).forEach((v, k) => {
      if (product.options.some((o) => key(o.name) === k)) fromUrl[k] = v;
    });
    if (Object.keys(fromUrl).length) {
      setSelection((cur) => ({ ...cur, ...fromUrl }));
    }
  }, [product.options]);

  const variant =
    product.variants.length === 1
      ? product.variants[0]
      : product.variants.find((v) => matches(v, selection));
  const price = variant?.price ?? product.priceRange.minVariantPrice;
  const missing = product.options.find(
    (o) => o.values.length > 1 && !selection[key(o.name)],
  );

  useEffect(() => {
    trackProductView({
      id: product.id,
      name: product.title,
      price: Number(product.priceRange.minVariantPrice.amount),
    });
  }, [product.id, product.title, product.priceRange.minVariantPrice.amount]);

  const choose = (name: string, value: string) => {
    const next = { ...selection, [key(name)]: value };
    setSelection(next);
    const params = new URLSearchParams(window.location.search);
    params.set(key(name), value);
    window.history.replaceState(null, "", `?${params}`);
  };

  // A value is available if some in-stock variant has it together with the
  // other options already chosen.
  const isAvailable = useMemo(
    () => (name: string, value: string) =>
      product.variants.some(
        (v) =>
          v.availableForSale &&
          v.selectedOptions.every((o) =>
            key(o.name) === key(name)
              ? o.value === value
              : !selection[key(o.name)] || selection[key(o.name)] === o.value,
          ),
      ),
    [product.variants, selection],
  );

  const add = () => {
    if (!variant) {
      setNudge(true);
      optionsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      window.setTimeout(() => setNudge(false), 700);
      return;
    }
    if (!variant.availableForSale) return;
    addCartItem(variant, product);
    trackAddToCart({
      id: variant.id,
      name: product.title,
      price: Number(variant.price.amount),
      quantity: 1,
    });
    try {
      navigator.vibrate?.(12);
    } catch {
      /* not supported */
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const soldOut =
    !product.availableForSale || (variant && !variant.availableForSale);
  const label = soldOut
    ? "Sold out"
    : added
      ? "Added to bag"
      : missing
        ? `Select ${missing.name.toLowerCase()}`
        : "Add to bag";

  const button = (
    <button
      type="button"
      onClick={add}
      disabled={Boolean(soldOut)}
      className={clsx(
        "flex h-14 w-full items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide transition-[transform,background-color,color] duration-200 active:scale-[0.98]",
        soldOut
          ? "cursor-not-allowed bg-plate text-fg-3"
          : "bg-fg text-canvas hover:opacity-90",
      )}
    >
      {added ? <Check className="size-4" /> : null}
      {label}
    </button>
  );

  return (
    <>
      <p className="label mt-5 text-base tracking-normal text-fg">
        {formatNaira(price)}
      </p>

      <div ref={optionsRef} className="mt-8 space-y-7">
        {product.options
          .filter((o) => o.values.length > 1)
          .map((option) => (
            <fieldset key={option.id}>
              <legend className="label mb-3 flex w-full justify-between">
                <span>
                  {option.name}
                  {selection[key(option.name)] ? (
                    <span className="text-fg-3">
                      {" "}
                      — {selection[key(option.name)]}
                    </span>
                  ) : null}
                </span>
                {key(option.name) === "size" ? (
                  <Link
                    href="/sizing-guide"
                    className="link-underline text-fg-3"
                  >
                    Size guide
                  </Link>
                ) : null}
              </legend>
              <div
                className={clsx(
                  "grid grid-cols-4 gap-1.5 sm:grid-cols-5",
                  nudge && "animate-[shake_0.4s_ease-in-out]",
                )}
              >
                {option.values.map((value) => {
                  const active = selection[key(option.name)] === value;
                  const available = isAvailable(option.name, value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => choose(option.name, value)}
                      aria-pressed={active}
                      aria-label={`${option.name} ${value}${available ? "" : ", sold out"}`}
                      className={clsx(
                        "relative h-12 border text-sm transition-colors",
                        active
                          ? "border-fg bg-fg text-canvas"
                          : "border-line hover:border-fg",
                        !available && "text-fg-3 line-through decoration-1",
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
      </div>

      <div className="mt-8 hidden md:block">{button}</div>
      {soldOut ? <RestockAlert /> : null}

      {/* Phones: sticky price + button */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-canvas/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
        <div className="shrink-0">
          <p className="label text-fg-3">Price</p>
          <p className="font-mono text-base">{formatNaira(price)}</p>
        </div>
        <div className="flex-1">{button}</div>
      </div>
    </>
  );
}

function RestockAlert() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("We'll email you when it's back.");
        setEmail("");
      } else toast.error(data.error || "Couldn't sign you up. Try again.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 border border-line p-5">
      <p className="font-medium">Tell me when it&apos;s back</p>
      <p className="mt-1 text-sm text-fg-2">
        One email when this is restocked. That&apos;s it.
      </p>
      <div className="mt-4 flex gap-2">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="h-12 min-w-0 flex-1 border-b border-line bg-transparent text-base outline-none focus:border-fg"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-12 bg-fg px-5 text-sm font-semibold uppercase tracking-wide text-canvas disabled:opacity-50"
        >
          Notify me
        </button>
      </div>
    </form>
  );
}
