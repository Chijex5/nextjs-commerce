/**
 * Product pricing model used by the product form. Mirrors getVariantPrice in
 * app/api/admin/products/[id]/route.ts exactly, so the preview table shows the
 * variants and prices the API will actually create.
 */

export type SizeRule = { from: number; price: number };

export type PricingModel = {
  sizes: string[];
  colors: string[];
  basePrice: number;
  /** "Sizes N and up cost P" tiers. */
  sizeRules: SizeRule[];
  /** Absolute price for a colour, keyed by lower-cased colour name. */
  colorPrices: Record<string, number>;
};

export type VariantPreview = { size: string; color: string; price: number };

export function variantPrice(model: PricingModel, size: string, color: string) {
  const key = color.trim().toLowerCase();
  if (model.colorPrices[key] !== undefined) return model.colorPrices[key]!;
  const n = Number.parseInt(size, 10);
  if (!Number.isNaN(n)) {
    const rule = [...model.sizeRules]
      .filter((r) => r.from > 0)
      .sort((a, b) => b.from - a.from)
      .find((r) => n >= r.from);
    if (rule) return rule.price;
  }
  return model.basePrice;
}

export function previewVariants(model: PricingModel): VariantPreview[] {
  const { sizes, colors } = model;
  if (sizes.length && colors.length)
    return sizes.flatMap((s) =>
      colors.map((c) => ({
        size: s,
        color: c,
        price: variantPrice(model, s, c),
      })),
    );
  if (sizes.length)
    return sizes.map((s) => ({
      size: s,
      color: "",
      price: variantPrice(model, s, ""),
    }));
  return colors.map((c) => ({
    size: "",
    color: c,
    price: variantPrice(model, "", c),
  }));
}

type ExistingVariant = {
  price: number;
  selectedOptions: Array<{ name: string; value: string }>;
};
type ExistingOption = { name: string; values: string[] };

const optionValue = (v: ExistingVariant, name: string) =>
  v.selectedOptions.find((o) => o.name.toLowerCase() === name.toLowerCase())
    ?.value ?? "";

/**
 * Rebuild a pricing model from saved variants. `exact` is false when prices
 * were set some other way (e.g. the bulk editor) and can't be expressed as
 * base + size tiers + colour prices; the form then leaves variants alone
 * unless pricing is deliberately edited.
 */
export function deriveModel(
  options: ExistingOption[],
  variants: ExistingVariant[],
): { model: PricingModel; exact: boolean } {
  const sizesOpt = options.find((o) => o.name.toLowerCase() === "size")?.values;
  const colorsOpt = options.find(
    (o) => o.name.toLowerCase() === "color",
  )?.values;
  const sizes = sizesOpt ?? [
    ...new Set(variants.map((v) => optionValue(v, "Size")).filter(Boolean)),
  ];
  const colors = colorsOpt ?? [
    ...new Set(variants.map((v) => optionValue(v, "Color")).filter(Boolean)),
  ];

  const priceOf = (size: string, color: string) =>
    variants.find(
      (v) =>
        optionValue(v, "Size") === size && optionValue(v, "Color") === color,
    )?.price;

  const empty: PricingModel = {
    sizes,
    colors,
    basePrice: variants[0]?.price ?? 0,
    sizeRules: [],
    colorPrices: {},
  };
  if (!variants.length) return { model: empty, exact: true };

  // Use the colour whose prices vary by size the most as the reference line.
  const refColor = colors.length ? colors[0]! : "";
  const sortedSizes = [...sizes].sort(
    (a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10),
  );
  const refPrices = sortedSizes.map(
    (s) => priceOf(s, refColor) ?? empty.basePrice,
  );
  const basePrice = sizes.length
    ? refPrices[0]!
    : (priceOf("", refColor) ?? empty.basePrice);

  const sizeRules: SizeRule[] = [];
  let current = basePrice;
  sortedSizes.forEach((s, i) => {
    const p = refPrices[i]!;
    const n = Number.parseInt(s, 10);
    if (p !== current && !Number.isNaN(n)) {
      sizeRules.push({ from: n, price: p });
      current = p;
    }
  });

  const colorPrices: Record<string, number> = {};
  for (const c of colors.slice(1)) {
    const prices = (sizes.length ? sizes : [""]).map((s) => priceOf(s, c));
    const sameAsRef = (sizes.length ? sizes : [""]).every(
      (s) => priceOf(s, c) === priceOf(s, refColor),
    );
    const uniform = prices.every((p) => p !== undefined && p === prices[0]);
    if (!sameAsRef && uniform && prices[0] !== undefined)
      colorPrices[c.toLowerCase()] = prices[0];
  }

  const model: PricingModel = {
    sizes,
    colors,
    basePrice,
    sizeRules,
    colorPrices,
  };
  const exact =
    previewVariants(model).length === variants.length &&
    previewVariants(model).every(
      (pv) => priceOf(pv.size, pv.color) === pv.price,
    );
  return { model, exact };
}

/** "38" .. "44" → ["38", …, "44"]. */
export function sizeRange(from: number, to: number) {
  const out: string[] = [];
  for (let s = from; s <= to; s++) out.push(String(s));
  return out;
}
