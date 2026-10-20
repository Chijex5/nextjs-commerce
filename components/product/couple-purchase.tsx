"use client";

import clsx from "clsx";
import { useCart } from "components/cart/cart-context";
import { formatNaira } from "components/product/product-card";
import { RestockAlert } from "components/product/product-purchase";
import { trackAddToCart, trackProductView } from "lib/analytics";
import { setSaving, setUnitPrice } from "lib/pairing";
import type { Product, ProductVariant } from "lib/types/commerce";
import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

/** The set, or one side on its own. */
type Mode = "set" | 0 | 1;

const opt = (v: ProductVariant, name: string) =>
  v.selectedOptions.find((o) => o.name.toLowerCase() === name)?.value ?? "";

const unique = (values: string[]) => [...new Set(values)].filter(Boolean);

const naira = (amount: number) =>
  formatNaira({ amount: String(amount), currencyCode: "NGN" });

type Choice = { size?: string; color?: string };

type Side = {
  product: Product;
  label: string;
  sizes: string[];
  colors: string[];
};

function sideOf(product: Product, label: string): Side {
  return {
    product,
    label,
    sizes: unique(product.variants.map((v) => opt(v, "size"))),
    colors: unique(product.variants.map((v) => opt(v, "color"))),
  };
}

const onlyColor = (side: Side) =>
  side.colors.length === 1 ? side.colors[0] : undefined;

function resolve(side: Side, pick: Choice) {
  const color = pick.color ?? onlyColor(side);
  return side.product.variants.find(
    (v) =>
      (!side.sizes.length || opt(v, "size") === pick.size) &&
      (!side.colors.length || opt(v, "color") === color),
  );
}

/** Does any pair on this side fit the pick, with `size`/`color` swapped in? */
function isAvailable(side: Side, pick: Choice, size?: string, color?: string) {
  return side.product.variants.some(
    (v) =>
      v.availableForSale &&
      (!side.sizes.length ||
        opt(v, "size") === (size ?? pick.size ?? opt(v, "size"))) &&
      (!side.colors.length ||
        opt(v, "color") ===
          (color ?? pick.color ?? onlyColor(side) ?? opt(v, "color"))),
  );
}

/**
 * A couple listing: one pair from each of its two products as a set (cheaper
 * than both singly), or either pair on its own. Each side keeps its own
 * sizes, colours and prices; the second side's colour follows the first's
 * unless the customer mixes them.
 */
export function CouplePurchase({ product }: { product: Product }) {
  const { addCartItem } = useCart();
  const pairing = product.pairing!;
  const couple = product.couple;
  const pickerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("set");
  const [picks, setPicks] = useState<[Choice, Choice]>([{}, {}]);
  const [mixColours, setMixColours] = useState(false);
  const [added, setAdded] = useState(false);
  const [nudge, setNudge] = useState(false);

  const sides = useMemo(
    () =>
      couple
        ? ([
            sideOf(couple.first, pairing.labels[0]),
            sideOf(couple.second, pairing.labels[1]),
          ] as const)
        : null,
    [couple, pairing.labels],
  );

  useEffect(() => {
    trackProductView({
      id: product.id,
      name: product.title,
      price: Number(product.priceRange.minVariantPrice.amount),
    });
  }, [product.id, product.title, product.priceRange.minVariantPrice.amount]);

  if (!sides) {
    return (
      <p className="mt-6 border border-line p-4 text-sm text-fg-2">
        This set isn&apos;t available right now.
      </p>
    );
  }

  // The second side wears the first's colour, when it comes in it.
  const follows =
    mode === "set" &&
    !mixColours &&
    sides[1].colors.length > 1 &&
    Boolean(picks[0].color) &&
    sides[1].colors.includes(picks[0].color!);
  const effective: [Choice, Choice] = [
    picks[0],
    follows ? { ...picks[1], color: picks[0].color } : picks[1],
  ];
  const variants = [
    resolve(sides[0], effective[0]),
    resolve(sides[1], effective[1]),
  ] as const;
  const setPick = (i: 0 | 1, pick: Choice) =>
    setPicks((p) => (i === 0 ? [pick, p[1]] : [p[0], pick]));

  const chosen:
    | { single: ProductVariant; side: Side }
    | { first: ProductVariant; second: ProductVariant }
    | null =
    mode === "set"
      ? variants[0] && variants[1]
        ? { first: variants[0], second: variants[1] }
        : null
      : variants[mode]
        ? { single: variants[mode]!, side: sides[mode] }
        : null;

  // Before a size is picked, price from each side's cheapest pair.
  const priceOf = (i: 0 | 1) =>
    Number(
      variants[i]?.price.amount ??
        sides[i].product.priceRange.minVariantPrice.amount,
    );
  const prices = [priceOf(0), priceOf(1)] as const;
  const setPrice = setUnitPrice(prices[0], prices[1], pairing);
  const saving = setSaving(prices[0], prices[1], pairing);
  const price = mode === "set" ? setPrice : prices[mode];

  const unavailable =
    !product.availableForSale ||
    (chosen &&
      ("single" in chosen
        ? !chosen.single.availableForSale
        : !chosen.first.availableForSale || !chosen.second.availableForSale));

  const need = (i: 0 | 1) => {
    const side = sides[i];
    const pick = effective[i];
    const who = side.label.toLowerCase();
    if (side.sizes.length && !pick.size) return `${who} size`;
    if (side.colors.length > 1 && !pick.color) return `${who} colour`;
    return null;
  };
  const missing = mode === "set" ? (need(0) ?? need(1)) : need(mode);

  const add = () => {
    if (!chosen) {
      setNudge(true);
      pickerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      window.setTimeout(() => setNudge(false), 700);
      return;
    }
    if (unavailable) return;
    if ("single" in chosen) addCartItem(chosen.single, chosen.side.product);
    else addCartItem(chosen.first, product, chosen.second);
    trackAddToCart({
      id: "single" in chosen ? chosen.single.id : chosen.first.id,
      name: "single" in chosen ? chosen.side.product.title : product.title,
      price,
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

  const label = unavailable
    ? "Sold out"
    : added
      ? "Added to bag"
      : missing
        ? `Select ${missing}`
        : mode === "set"
          ? "Add set to bag"
          : "Add to bag";

  const button = (
    <button
      type="button"
      onClick={add}
      disabled={Boolean(unavailable)}
      className={clsx(
        "flex h-14 w-full items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide transition-[transform,background-color,color] duration-200 active:scale-[0.98]",
        unavailable
          ? "cursor-not-allowed bg-plate text-fg-3"
          : "bg-fg text-canvas hover:opacity-90",
      )}
    >
      {added ? <Check className="size-4" /> : null}
      {label}
    </button>
  );

  const canMix =
    mode === "set" && sides[0].colors.length > 1 && sides[1].colors.length > 1;

  const picker = (i: 0 | 1) => {
    const side = sides[i];
    const pick = effective[i];
    const followsFirst = i === 1 && follows;
    return (
      <div className="space-y-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-fg">
            {side.label}
            <span className="text-fg-3"> · {side.product.title}</span>
          </p>
          <Link
            href={`/product/${side.product.handle}`}
            className="label inline-flex shrink-0 items-center gap-1 text-fg-3 hover:text-fg"
          >
            View <ArrowUpRight className="size-3" />
          </Link>
        </div>
        {side.colors.length > 1 ? (
          <fieldset>
            <legend className="label mb-3 flex w-full justify-between">
              <span>
                {side.label} colour
                {pick.color ? (
                  <span className="text-fg-3"> — {pick.color}</span>
                ) : null}
              </span>
              {i === 1 && canMix ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!mixColours && follows)
                      setPick(1, { ...picks[1], color: picks[0].color });
                    setMixColours((x) => !x);
                  }}
                  className="link-underline text-fg-3"
                >
                  {mixColours ? "Match colours" : "Mix colours"}
                </button>
              ) : null}
            </legend>
            {followsFirst ? (
              <p className="text-sm text-fg-2">
                Same as {sides[0].label.toLowerCase()}: {pick.color}
              </p>
            ) : (
              <OptionGrid
                values={side.colors}
                active={pick.color}
                nudge={nudge && !pick.color}
                isAvailable={(c) => isAvailable(side, pick, undefined, c)}
                label={`${side.label} colour`}
                onChoose={(color) => setPick(i, { ...picks[i], color })}
              />
            )}
          </fieldset>
        ) : null}
        {side.sizes.length ? (
          <fieldset>
            <legend className="label mb-3 flex w-full justify-between">
              <span>
                {side.label} size
                {pick.size ? (
                  <span className="text-fg-3"> — {pick.size}</span>
                ) : null}
              </span>
              <Link href="/sizing-guide" className="link-underline text-fg-3">
                Size guide
              </Link>
            </legend>
            <OptionGrid
              values={side.sizes}
              active={pick.size}
              nudge={nudge && !pick.size}
              isAvailable={(s) => isAvailable(side, pick, s)}
              label={`${side.label} size`}
              onChoose={(size) => setPick(i, { ...picks[i], size })}
            />
          </fieldset>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <p className="label mt-5 flex items-baseline gap-3 text-base tracking-normal text-fg">
        {naira(price)}
        {mode === "set" && saving > 0 ? (
          <>
            <span className="text-fg-3 line-through">
              {naira(prices[0] + prices[1])}
            </span>
            <span className="text-sm text-fg-2">Save {naira(saving)}</span>
          </>
        ) : null}
      </p>

      <div
        role="radiogroup"
        aria-label="What to buy"
        className="mt-6 grid grid-cols-3 border border-line"
      >
        {(
          [
            ["set", "Couple set"],
            [0, `${sides[0].label} only`],
            [1, `${sides[1].label} only`],
          ] as const
        ).map(([value, text]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => setMode(value)}
            className={clsx(
              "h-12 truncate px-1 text-sm transition-colors",
              mode === value ? "bg-fg text-canvas" : "text-fg-2 hover:text-fg",
            )}
          >
            {text}
          </button>
        ))}
      </div>

      <div ref={pickerRef} className="mt-8 space-y-8">
        {mode !== 1 ? picker(0) : null}
        {mode === "set" ? <hr className="border-line" /> : null}
        {mode !== 0 ? picker(1) : null}
      </div>

      <div className="mt-8 hidden md:block">{button}</div>
      {unavailable ? <RestockAlert /> : null}

      {/* Phones: sticky price + button */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-canvas/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
        <div className="shrink-0">
          <p className="label text-fg-3">{mode === "set" ? "Set" : "Price"}</p>
          <p className="font-mono text-base">{naira(price)}</p>
        </div>
        <div className="flex-1">{button}</div>
      </div>
    </>
  );
}

/** On a single pair's page: "Also sold as a couple set" with the saving. */
export function CoupleOffers({
  product,
  listings,
}: {
  product: Product;
  listings: Product[];
}) {
  if (!listings.length) return null;
  return (
    <div className="mt-6 space-y-2">
      {listings.map((listing) => {
        const couple = listing.couple!;
        const partner =
          couple.first.id === product.id ? couple.second : couple.first;
        const pairing = listing.pairing!;
        const saving =
          pairing.discountType === "percentage"
            ? pairing.discountValue > 0
              ? `${pairing.discountValue}%`
              : null
            : pairing.discountValue > 0
              ? naira(pairing.discountValue)
              : null;
        return (
          <Link
            key={listing.id}
            href={`/product/${listing.handle}`}
            className="group flex items-center justify-between gap-4 border border-line p-4 hover:border-fg"
          >
            <span className="min-w-0">
              <span className="label block text-fg-3">
                Also sold as a couple set
              </span>
              <span className="mt-1 block text-sm text-fg">
                With {partner.title}, from{" "}
                {naira(Number(listing.priceRange.minVariantPrice.amount))}
                {saving ? (
                  <span className="text-fg-2"> · save {saving}</span>
                ) : null}
              </span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        );
      })}
    </div>
  );
}

function OptionGrid({
  values,
  active,
  nudge,
  isAvailable,
  label,
  onChoose,
}: {
  values: string[];
  active?: string;
  nudge: boolean;
  isAvailable: (value: string) => boolean;
  label: string;
  onChoose: (value: string) => void;
}) {
  return (
    <div
      className={clsx(
        "grid grid-cols-4 gap-1.5 sm:grid-cols-5",
        nudge && "animate-[shake_0.4s_ease-in-out]",
      )}
    >
      {values.map((value) => {
        const available = isAvailable(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChoose(value)}
            aria-pressed={active === value}
            aria-label={`${label} ${value}${available ? "" : ", sold out"}`}
            className={clsx(
              "relative h-12 border text-sm transition-colors",
              active === value
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
  );
}
