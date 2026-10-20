/**
 * Couples pairs: a product sold as his + hers slides, either as a set at a
 * discount or one pair at a time. Each pair is a normal variant (Wearer ×
 * Size × Colour) with its own stock; a set is a bag line holding one His and
 * one Hers variant, so singles and sets draw from the same shelf.
 *
 * Pure and client-safe: the product page, bag, checkout and payment all price
 * sets with these functions.
 */

export const WEARER = "Wearer";
export const HIS = "His";
export const HERS = "Hers";
export const WEARERS = [HIS, HERS] as const;
export type Wearer = (typeof WEARERS)[number];

export type PairingConfig = {
  discountType: "fixed" | "percentage";
  /** Naira off a set, or percent off a set. */
  discountValue: number;
};

/** Most a percentage discount may take off a set. */
const MAX_PERCENT = 90;

const money = (n: number) => Math.round(n * 100) / 100;

/** A saved `products.pairing` value, or null when it isn't a couples pair. */
export function parsePairing(value: unknown): PairingConfig | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Partial<PairingConfig>;
  const discountType = v.discountType === "percentage" ? "percentage" : "fixed";
  const discountValue = Number(v.discountValue);
  return {
    discountType,
    discountValue:
      Number.isFinite(discountValue) && discountValue > 0
        ? discountType === "percentage"
          ? Math.min(discountValue, MAX_PERCENT)
          : discountValue
        : 0,
  };
}

/** What the set saves against buying both pairs separately. */
export function setSaving(
  hisPrice: number,
  herPrice: number,
  pairing: PairingConfig,
) {
  const full = hisPrice + herPrice;
  const off =
    pairing.discountType === "percentage"
      ? (full * Math.min(pairing.discountValue, MAX_PERCENT)) / 100
      : pairing.discountValue;
  return money(Math.min(Math.max(0, off), full));
}

/** One set: both pairs less the set discount, never below zero. */
export function setUnitPrice(
  hisPrice: number,
  herPrice: number,
  pairing: PairingConfig,
) {
  return money(hisPrice + herPrice - setSaving(hisPrice, herPrice, pairing));
}

type Options = ReadonlyArray<{ name: string; value: string }>;

const option = (options: Options, name: string) =>
  options.find((o) => o.name.toLowerCase() === name.toLowerCase())?.value;

export function wearerOf(options: Options): Wearer | null {
  const value = option(options, WEARER);
  return value === HIS || value === HERS ? value : null;
}

/** "43 / Black": the variant's options without the wearer. */
export function pairLabel(options: Options) {
  return options
    .filter((o) => o.name.toLowerCase() !== WEARER.toLowerCase())
    .map((o) => o.value)
    .join(" / ");
}

/** "Couple set · His 43 / Black · Hers 38 / Tan" (receipts, emails, admin). */
export function setTitle(his: Options, hers: Options) {
  return `Couple set · ${HIS} ${pairLabel(his)} · ${HERS} ${pairLabel(hers)}`;
}

/**
 * Identifies a bag line: the variant, plus the Hers variant for a set. Two
 * sets in different sizes are separate lines; the same set twice is one.
 */
export function lineKey(variantId: string, pairVariantId?: string | null) {
  return pairVariantId ? `${variantId}+${pairVariantId}` : variantId;
}
