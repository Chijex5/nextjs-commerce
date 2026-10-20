/**
 * Couple sets: two existing products (say a men's and a women's slide) sold
 * together at a discount. Each stays a normal product with its own price,
 * photos and stock; a couple listing is a product with no variants of its
 * own that points at both (`products.pair_first_product_id` and
 * `pair_second_product_id`). A set is one bag line holding a variant of
 * each, so singles and sets draw from the same shelf.
 *
 * Pure and client-safe: the product page, bag, checkout and payment all price
 * sets with these functions.
 */
import type { Product } from "lib/types/commerce";

export const DEFAULT_LABELS: [string, string] = ["His", "Hers"];

export type PairingConfig = {
  discountType: "fixed" | "percentage";
  /** Naira off a set, or percent off a set. */
  discountValue: number;
  /** What each pair is called on the page and receipts ("His", "Hers"). */
  labels: [string, string];
};

/** Most a percentage discount may take off a set. */
export const MAX_PERCENT = 90;
/** Longest pair label ("His", "Hers", "Bride"). */
export const MAX_LABEL = 20;

const money = (n: number) => Math.round(n * 100) / 100;

const label = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim()
    ? value.trim().slice(0, MAX_LABEL)
    : fallback;

/** A saved `products.pairing` value, or null when it isn't a couple listing. */
export function parsePairing(value: unknown): PairingConfig | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Partial<Record<keyof PairingConfig, unknown>>;
  const discountType = v.discountType === "percentage" ? "percentage" : "fixed";
  const discountValue = Number(v.discountValue);
  const labels = Array.isArray(v.labels) ? v.labels : [];
  return {
    discountType,
    discountValue:
      Number.isFinite(discountValue) && discountValue > 0
        ? discountType === "percentage"
          ? Math.min(discountValue, MAX_PERCENT)
          : discountValue
        : 0,
    labels: [
      label(labels[0], DEFAULT_LABELS[0]),
      label(labels[1], DEFAULT_LABELS[1]),
    ],
  };
}

type Discount = Pick<PairingConfig, "discountType" | "discountValue">;

/** What the set saves against buying both pairs separately. */
export function setSaving(
  firstPrice: number,
  secondPrice: number,
  pairing: Discount,
) {
  const full = firstPrice + secondPrice;
  const off =
    pairing.discountType === "percentage"
      ? (full * Math.min(pairing.discountValue, MAX_PERCENT)) / 100
      : pairing.discountValue;
  return money(Math.min(Math.max(0, off), full));
}

/** One set: both pairs less the set discount, never below zero. */
export function setUnitPrice(
  firstPrice: number,
  secondPrice: number,
  pairing: Discount,
) {
  return money(
    firstPrice + secondPrice - setSaving(firstPrice, secondPrice, pairing),
  );
}

type Options = ReadonlyArray<{ name: string; value: string }>;

/** "43 / Black": the variant's option values. */
export function pairLabel(options: Options) {
  return options.map((o) => o.value).join(" / ");
}

/** "Couple set · His 43 / Black · Hers 38 / Tan" (bag, receipts, admin). */
export function setTitle(
  first: Options,
  second: Options,
  labels: readonly [string, string] = DEFAULT_LABELS,
) {
  const part = (name: string, options: Options) =>
    [name, pairLabel(options)].filter(Boolean).join(" ");
  return `Couple set · ${part(labels[0], first)} · ${part(labels[1], second)}`;
}

/**
 * Identifies a bag line: the variant, plus the second pair's variant for a
 * set. Two sets in different sizes are separate lines; the same set twice is
 * one.
 */
export function lineKey(variantId: string, pairVariantId?: string | null) {
  return pairVariantId ? `${variantId}+${pairVariantId}` : variantId;
}

/** Exists and is on sale (sold-out sizes show as sold out on the page). */
const buyable = (p: Product | undefined): p is Product =>
  Boolean(p?.availableForSale);

/**
 * A couple listing as the shop shows it: its two products attached, priced
 * from them (the cheapest set to the dearest), and their photos when the
 * listing has none of its own. Hidden from the shop when either product is
 * missing or hidden.
 */
export function withCouple(
  listing: Product,
  first: Product | undefined,
  second: Product | undefined,
): Product {
  const pairing = listing.pairing;
  if (!pairing) return listing;
  const couple =
    buyable(first) && buyable(second) && first.id !== second.id
      ? { first, second }
      : null;
  if (!couple) return { ...listing, couple: null, availableForSale: false };

  const price = (key: "minVariantPrice" | "maxVariantPrice") => ({
    amount: String(
      setUnitPrice(
        Number(couple.first.priceRange[key].amount),
        Number(couple.second.priceRange[key].amount),
        pairing,
      ),
    ),
    currencyCode: couple.first.priceRange[key].currencyCode,
  });
  const images = listing.images.length
    ? listing.images
    : [
        couple.first.images[0],
        couple.second.images[0],
        ...couple.first.images.slice(1),
        ...couple.second.images.slice(1),
      ].filter((image): image is Product["images"][number] =>
        Boolean(image?.url),
      );

  return {
    ...listing,
    couple,
    priceRange: {
      minVariantPrice: price("minVariantPrice"),
      maxVariantPrice: price("maxVariantPrice"),
    },
    images,
    featuredImage: listing.featuredImage.url
      ? listing.featuredImage
      : (images[0] ?? listing.featuredImage),
  };
}
