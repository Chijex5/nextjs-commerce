"use client";

import { Panel } from "components/admin/ui";
import clsx from "clsx";
import { money } from "lib/admin/format";
import {
  DEFAULT_LABELS,
  MAX_LABEL,
  MAX_PERCENT,
  setSaving,
  setUnitPrice,
  type PairingConfig,
} from "lib/pairing";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

const input =
  "h-11 w-full border border-line bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-fg";

/** What the editor holds for a couple listing. */
export type CoupleDraft = PairingConfig & {
  firstProductId: string;
  secondProductId: string;
};

/** A product that can be one side of a couple set. */
export type PairableProduct = {
  id: string;
  title: string;
  active: boolean;
  /** Cheapest and dearest pair, or null with no sizes yet. */
  minPrice: number | null;
  maxPrice: number | null;
};

export const emptyCouple = (): CoupleDraft => ({
  discountType: "fixed",
  discountValue: 0,
  labels: [...DEFAULT_LABELS],
  firstProductId: "",
  secondProductId: "",
});

/**
 * A couple listing sells one pair from each of two existing products as a
 * set, cheaper than both singly. Each product keeps its own price, sizes and
 * stock (and is still sold on its own); this only links them and sets the
 * discount.
 */
export function CouplesPair({
  value,
  products,
  isNew,
  onChange,
}: {
  value: CoupleDraft | null;
  products: PairableProduct[];
  isNew: boolean;
  onChange: (value: CoupleDraft | null) => void;
}) {
  if (!value && !isNew) return null;
  const byId = new Map(products.map((p) => [p.id, p]));
  const first = value ? byId.get(value.firstProductId) : undefined;
  const second = value ? byId.get(value.secondProductId) : undefined;

  const example =
    value && first?.minPrice != null && second?.minPrice != null
      ? {
          full: first.minPrice + second.minPrice,
          price: setUnitPrice(first.minPrice, second.minPrice, value),
          saving: setSaving(first.minPrice, second.minPrice, value),
        }
      : null;

  const side = (i: 0 | 1) => {
    if (!value) return null;
    const key = i === 0 ? "firstProductId" : "secondProductId";
    const other = i === 0 ? value.secondProductId : value.firstProductId;
    const chosen = byId.get(value[key]);
    return (
      <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <label className="block">
          <span className="label mb-1.5 block text-fg-3">Called</span>
          <input
            value={value.labels[i]}
            maxLength={MAX_LABEL}
            onChange={(e) => {
              const labels: [string, string] = [...value.labels];
              labels[i] = e.target.value;
              onChange({ ...value, labels });
            }}
            placeholder={DEFAULT_LABELS[i]}
            aria-label={`Name for pair ${i + 1}`}
            className={input}
          />
        </label>
        <label className="block min-w-0">
          <span className="label mb-1.5 flex justify-between text-fg-3">
            Product
            {chosen ? (
              <Link
                href={`/admin/products/${chosen.id}/edit`}
                target="_blank"
                className="inline-flex items-center gap-1 hover:text-fg"
              >
                Prices &amp; stock <ExternalLink className="size-3" />
              </Link>
            ) : null}
          </span>
          <select
            value={value[key]}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            className={input}
          >
            <option value="">Choose a product…</option>
            {products
              .filter((p) => p.id !== other)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                  {p.minPrice != null
                    ? ` · ${money(p.minPrice)}${p.maxPrice !== p.minPrice ? `–${money(p.maxPrice ?? p.minPrice)}` : ""}`
                    : " · no sizes yet"}
                  {p.active ? "" : " (hidden)"}
                </option>
              ))}
          </select>
        </label>
      </div>
    );
  };

  return (
    <Panel
      title="Couple set"
      description="Sell one pair from each of two products together, for less than both bought separately. Each product keeps its own prices, sizes and stock, and is still sold on its own."
    >
      {isNew ? (
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={value !== null}
            onChange={(e) => onChange(e.target.checked ? emptyCouple() : null)}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium text-fg">
              This is a couple set
            </span>
            <span className="block text-xs text-fg-3">
              It has no sizes of its own: customers pick a size from each
              product. Can&apos;t be changed after creating.
            </span>
          </span>
        </label>
      ) : null}

      {value ? (
        <div className={clsx("space-y-5", isNew && "mt-5")}>
          {side(0)}
          {side(1)}
          {(first && !first.active) || (second && !second.active) ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              A hidden product can&apos;t be bought, so the set won&apos;t show
              in the shop until both are active.
            </p>
          ) : null}

          <div>
            <span className="label mb-1.5 block text-fg-3">Set discount</span>
            <div className="flex gap-2">
              <div className="flex border border-line" role="radiogroup">
                {(
                  [
                    ["fixed", "₦ off"],
                    ["percentage", "% off"],
                  ] as const
                ).map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={value.discountType === type}
                    onClick={() => onChange({ ...value, discountType: type })}
                    className={clsx(
                      "h-11 px-3 text-sm",
                      value.discountType === type
                        ? "bg-fg text-canvas"
                        : "text-fg-2 hover:text-fg",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                inputMode="decimal"
                aria-label="Set discount"
                value={value.discountValue || ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    discountValue:
                      Number(e.target.value.replace(/[^\d.]/g, "")) || 0,
                  })
                }
                placeholder={value.discountType === "fixed" ? "5000" : "10"}
                className={clsx(input, "max-w-40")}
              />
            </div>
            {value.discountType === "percentage" &&
            value.discountValue > MAX_PERCENT ? (
              <p className="mt-2 text-xs text-red-600">
                At most {MAX_PERCENT}%.
              </p>
            ) : null}
            {example ? (
              <p className="mt-2 text-xs text-fg-3">
                Cheapest set: {money(first!.minPrice!)} +{" "}
                {money(second!.minPrice!)} ={" "}
                <span className="line-through">{money(example.full)}</span>, as
                a set{" "}
                <span className="font-medium text-fg">
                  {money(example.price)}
                </span>
                {example.saving > 0
                  ? ` (saves ${money(example.saving)})`
                  : ". Add a discount so the set is cheaper."}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
