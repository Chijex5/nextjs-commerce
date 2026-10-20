"use client";

import clsx from "clsx";
import { useCart } from "components/cart/cart-context";
import { formatNaira } from "components/product/product-card";
import { RestockAlert } from "components/product/product-purchase";
import { trackAddToCart, trackProductView } from "lib/analytics";
import {
  HERS,
  HIS,
  setSaving,
  setUnitPrice,
  wearerOf,
  type Wearer,
} from "lib/pairing";
import type { Product, ProductVariant } from "lib/types/commerce";
import { Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Mode = "set" | Wearer;

const opt = (v: ProductVariant, name: string) =>
  v.selectedOptions.find((o) => o.name.toLowerCase() === name)?.value ?? "";

const naira = (amount: number) =>
  formatNaira({ amount: String(amount), currencyCode: "NGN" });

type Choice = { size?: string; color?: string };

/**
 * A couples pair: his + hers as a set (cheaper than both singly), or one
 * pair on its own. Each wearer picks a size and, if there's a choice, a
 * colour; hers follows his colour unless the customer mixes them.
 */
export function CouplePurchase({ product }: { product: Product }) {
  const { addCartItem } = useCart();
  const pairing = product.pairing!;
  const pickerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("set");
  const [his, setHis] = useState<Choice>({});
  const [hers, setHers] = useState<Choice>({});
  const [mixColours, setMixColours] = useState(false);
  const [added, setAdded] = useState(false);
  const [nudge, setNudge] = useState(false);

  const byWearer = useMemo(() => {
    const of = (w: Wearer) =>
      product.variants.filter((v) => wearerOf(v.selectedOptions) === w);
    return { [HIS]: of(HIS), [HERS]: of(HERS) } as Record<
      Wearer,
      ProductVariant[]
    >;
  }, [product.variants]);

  const sizes = useMemo(
    () =>
      [...new Set(product.variants.map((v) => opt(v, "size")))].filter(Boolean),
    [product.variants],
  );
  const colors = useMemo(
    () =>
      [...new Set(product.variants.map((v) => opt(v, "color")))].filter(
        Boolean,
      ),
    [product.variants],
  );
  const onlyColor = colors.length === 1 ? colors[0] : undefined;

  useEffect(() => {
    trackProductView({
      id: product.id,
      name: product.title,
      price: Number(product.priceRange.minVariantPrice.amount),
    });
  }, [product.id, product.title, product.priceRange.minVariantPrice.amount]);

  const resolve = (w: Wearer, pick: Choice) => {
    const color = pick.color ?? onlyColor;
    return byWearer[w].find(
      (v) =>
        (!sizes.length || opt(v, "size") === pick.size) &&
        (!colors.length || opt(v, "color") === color),
    );
  };

  const hersPick: Choice = mixColours ? hers : { ...hers, color: his.color };
  const hisVariant = resolve(HIS, his);
  const hersVariant = resolve(HERS, hersPick);
  const single = mode === HIS ? hisVariant : hersVariant;
  const chosen:
    | { single: ProductVariant }
    | { his: ProductVariant; hers: ProductVariant }
    | null =
    mode === "set"
      ? hisVariant && hersVariant
        ? { his: hisVariant, hers: hersVariant }
        : null
      : single
        ? { single }
        : null;

  // Cheapest pair of each wearer, for the price before sizes are picked.
  const cheapest = (w: Wearer) =>
    byWearer[w].length
      ? Math.min(...byWearer[w].map((v) => Number(v.price.amount)))
      : 0;
  const hisPrice = Number(hisVariant?.price.amount ?? cheapest(HIS));
  const hersPrice = Number(hersVariant?.price.amount ?? cheapest(HERS));
  const setPrice = setUnitPrice(hisPrice, hersPrice, pairing);
  const saving = setSaving(hisPrice, hersPrice, pairing);
  const price = mode === "set" ? setPrice : mode === HIS ? hisPrice : hersPrice;

  const unavailable =
    !product.availableForSale ||
    (chosen &&
      ("single" in chosen
        ? !chosen.single.availableForSale
        : !chosen.his.availableForSale || !chosen.hers.availableForSale));

  const missing = (() => {
    const need = (w: Wearer, pick: Choice) =>
      sizes.length && !pick.size
        ? `${w.toLowerCase()} size`
        : colors.length > 1 && !pick.color
          ? `${w.toLowerCase()} colour`
          : null;
    if (mode === "set") return need(HIS, his) ?? need(HERS, hersPick);
    return need(mode, mode === HIS ? his : hersPick);
  })();

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
    if ("single" in chosen) addCartItem(chosen.single, product);
    else addCartItem(chosen.his, product, chosen.hers);
    trackAddToCart({
      id: "single" in chosen ? chosen.single.id : chosen.his.id,
      name: product.title,
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

  const isAvailable = (
    w: Wearer,
    pick: Choice,
    size?: string,
    color?: string,
  ) =>
    byWearer[w].some(
      (v) =>
        v.availableForSale &&
        (!sizes.length ||
          opt(v, "size") === (size ?? pick.size ?? opt(v, "size"))) &&
        (!colors.length ||
          opt(v, "color") ===
            (color ?? pick.color ?? onlyColor ?? opt(v, "color"))),
    );

  const wearerPicker = (
    w: Wearer,
    pick: Choice,
    onPick: (p: Choice) => void,
    colourFollowsHis = false,
  ) => (
    <div className="space-y-5">
      {colors.length > 1 ? (
        <fieldset>
          <legend className="label mb-3 flex w-full justify-between">
            <span>
              {w} colour
              {pick.color ? (
                <span className="text-fg-3"> — {pick.color}</span>
              ) : null}
            </span>
            {w === HERS && mode === "set" ? (
              <button
                type="button"
                onClick={() => {
                  if (!mixColours) setHers((x) => ({ ...x, color: his.color }));
                  setMixColours((x) => !x);
                }}
                className="link-underline text-fg-3"
              >
                {mixColours ? "Match his colour" : "Mix colours"}
              </button>
            ) : null}
          </legend>
          {colourFollowsHis ? (
            <p className="text-sm text-fg-2">
              {his.color ? `Same as his: ${his.color}` : "Same as his"}
            </p>
          ) : (
            <OptionGrid
              values={colors}
              active={pick.color}
              nudge={nudge && !pick.color}
              isAvailable={(c) => isAvailable(w, pick, undefined, c)}
              label={`${w} colour`}
              onChoose={(color) => onPick({ ...pick, color })}
            />
          )}
        </fieldset>
      ) : null}
      {sizes.length ? (
        <fieldset>
          <legend className="label mb-3 flex w-full justify-between">
            <span>
              {w} size
              {pick.size ? (
                <span className="text-fg-3"> — {pick.size}</span>
              ) : null}
            </span>
            <Link href="/sizing-guide" className="link-underline text-fg-3">
              Size guide
            </Link>
          </legend>
          <OptionGrid
            values={sizes}
            active={pick.size}
            nudge={nudge && !pick.size}
            isAvailable={(s) => isAvailable(w, pick, s)}
            label={`${w} size`}
            onChoose={(size) => onPick({ ...pick, size })}
          />
        </fieldset>
      ) : null}
    </div>
  );

  return (
    <>
      <p className="label mt-5 flex items-baseline gap-3 text-base tracking-normal text-fg">
        {naira(price)}
        {mode === "set" && saving > 0 ? (
          <>
            <span className="text-fg-3 line-through">
              {naira(hisPrice + hersPrice)}
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
            [HIS, "His only"],
            [HERS, "Hers only"],
          ] as const
        ).map(([value, text]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => setMode(value)}
            className={clsx(
              "h-12 text-sm transition-colors",
              mode === value ? "bg-fg text-canvas" : "text-fg-2 hover:text-fg",
            )}
          >
            {text}
          </button>
        ))}
      </div>

      <div ref={pickerRef} className="mt-8 space-y-8">
        {mode !== HERS ? wearerPicker(HIS, his, setHis) : null}
        {mode === "set" ? <hr className="border-line" /> : null}
        {mode !== HIS
          ? wearerPicker(HERS, hersPick, setHers, mode === "set" && !mixColours)
          : null}
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
