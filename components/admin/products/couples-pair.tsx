"use client";

import clsx from "clsx";
import { money } from "lib/admin/format";
import { setSaving, setUnitPrice, type PairingConfig } from "lib/pairing";

const input =
  "h-11 w-full border border-line bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-fg";

/**
 * Turns a product into a couples pair (every size and colour for His and for
 * Hers, bought singly or as a set) and sets the set discount.
 */
export function CouplesPair({
  value,
  basePrice,
  isNew,
  onChange,
}: {
  value: PairingConfig | null;
  /** A single pair's price, for the example. */
  basePrice: number;
  isNew: boolean;
  /** `rebuild` when switching on or off, which changes the variants. */
  onChange: (pairing: PairingConfig | null, rebuild: boolean) => void;
}) {
  const on = value !== null;
  const example =
    on && basePrice > 0
      ? {
          price: setUnitPrice(basePrice, basePrice, value),
          saving: setSaving(basePrice, basePrice, value),
        }
      : null;

  return (
    <div className="mt-6 border-t border-line pt-6">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) =>
            onChange(
              e.target.checked
                ? { discountType: "fixed", discountValue: 0 }
                : null,
              true,
            )
          }
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-medium text-fg">
            Couples pair
          </span>
          <span className="block text-xs text-fg-3">
            Sold as his + hers. Every size and colour is made for His and for
            Hers, with its own stock. Customers buy one pair, or both as a set
            for less.
          </span>
        </span>
      </label>

      {on ? (
        <div className="mt-4 space-y-3 pl-7">
          {!isNew ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Saving rebuilds the sizes below as His and Hers. Stock you've
              already counted for a size and colour carries over.
            </p>
          ) : null}
          <span className="label block text-fg-3">Set discount</span>
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
                  onClick={() =>
                    onChange({ ...value, discountType: type }, false)
                  }
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
                onChange(
                  {
                    ...value,
                    discountValue:
                      Number(e.target.value.replace(/[^\d.]/g, "")) || 0,
                  },
                  false,
                )
              }
              placeholder={value.discountType === "fixed" ? "5000" : "10"}
              className={clsx(input, "max-w-40")}
            />
          </div>
          {example ? (
            <p className="text-xs text-fg-3">
              Two {money(basePrice)} pairs as a set:{" "}
              <span className="font-medium text-fg">
                {money(example.price)}
              </span>
              {example.saving > 0
                ? ` (saves ${money(example.saving)})`
                : ". Add a discount so the set is cheaper."}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
