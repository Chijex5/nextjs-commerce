/**
 * Helpers for the admin product routes, which rebuild every variant when
 * sizes, colours or prices are saved.
 */
import { HIS, HERS, WEARER, WEARERS } from "lib/pairing";

type Option = { name: string; value: string };
type VariantDraft = { title: string; selectedOptions?: unknown };

const optionsOf = (v: VariantDraft) =>
  Array.isArray(v.selectedOptions) ? (v.selectedOptions as Option[]) : [];

/**
 * A couples pair sells every size and colour to both wearers: one His and
 * one Hers variant per combination, each with its own stock.
 */
export function splitByWearer<T extends VariantDraft>(variants: T[]): T[] {
  return variants.flatMap((variant) =>
    WEARERS.map((wearer) => ({
      ...variant,
      title: variant.title ? `${wearer} / ${variant.title}` : wearer,
      selectedOptions: [{ name: WEARER, value: wearer }, ...optionsOf(variant)],
    })),
  );
}

export const WEARER_OPTION = { name: WEARER, values: [HIS, HERS] };

const signature = (v: VariantDraft) =>
  optionsOf(v)
    .map((o) => `${o.name.toLowerCase()}=${o.value.toLowerCase()}`)
    .sort()
    .join("&");

type Stock = {
  selectedOptions: unknown;
  title: string;
  trackInventory: boolean;
  stockQuantity: number | null;
  availableForSale: boolean;
};

/**
 * Keep stock counts across a rebuild: a new variant with the same options as
 * an old one inherits its tracking, count and (when tracked) availability.
 */
export function carryStock<
  T extends VariantDraft & {
    trackInventory?: boolean;
    stockQuantity?: number | null;
    availableForSale?: boolean;
  },
>(next: T[], previous: Stock[]): T[] {
  const bySignature = new Map(previous.map((p) => [signature(p), p]));
  return next.map((variant) => {
    const old = bySignature.get(signature(variant));
    if (!old?.trackInventory) return variant;
    return {
      ...variant,
      trackInventory: true,
      stockQuantity: old.stockQuantity ?? 0,
      availableForSale:
        (variant.availableForSale ?? true) && (old.stockQuantity ?? 0) > 0,
    };
  });
}
