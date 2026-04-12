"use client";

import clsx from "clsx";
import { ProductOption, ProductVariant } from "lib/shopify/types";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Combination = {
  id: string;
  availableForSale: boolean;
  [key: string]: string | boolean;
};

export function VariantSelector({
  options,
  variants,
  selectedOptions,
  onOptionChange,
}: {
  options: ProductOption[];
  variants: ProductVariant[];
  selectedOptions: Record<string, string>;
  onOptionChange: (name: string, value: string) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const hasNoOptionsOrJustOneOption =
    !options.length ||
    (options.length === 1 && options[0]?.values.length === 1);

  if (hasNoOptionsOrJustOneOption) {
    return null;
  }

  const combinations: Combination[] = variants.map((variant) => ({
    id: variant.id,
    availableForSale: variant.availableForSale,
    ...variant.selectedOptions.reduce(
      (accumulator, option) => ({
        ...accumulator,
        [option.name.toLowerCase()]: option.value,
      }),
      {},
    ),
  }));

  const updateOption = (name: string, value: string) => {
    onOptionChange(name, value);
    startTransition(() => {
      const params = new URLSearchParams(selectedOptions);
      params.set(name, value);
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  return options.map((option) => (
    <form key={option.id}>
      <dl className="mb-8">
        <dt className="mb-4 text-[0.66rem] font-medium uppercase tracking-[0.2em] text-[var(--dp-ember,#BF5A28)]">
          {option.name}
        </dt>
        <dd className="flex flex-wrap gap-3">
          {option.values.map((value, index) => {
            const optionNameLowerCase = option.name.toLowerCase();

            // Base option params on current searchParams so we can preserve any other param state.
            const optionParams: Record<string, string> = {};
            Object.entries(selectedOptions).forEach(
              ([key, currentValue]) => (optionParams[key] = currentValue),
            );
            optionParams[optionNameLowerCase] = value;

            // Filter out invalid options and check if the option combination is available for sale.
            const filtered = Object.entries(optionParams).filter(
              ([key, value]) =>
                options.find(
                  (option) =>
                    option.name.toLowerCase() === key &&
                    option.values.includes(value),
                ),
            );
            const isAvailableForSale = combinations.find((combination) =>
              filtered.every(
                ([key, value]) =>
                  combination[key] === value && combination.availableForSale,
              ),
            );

            // The option is active if it's in the selected options.
            const isActive = selectedOptions[optionNameLowerCase] === value;

            return (
              <button
                formAction={() => updateOption(optionNameLowerCase, value)}
                key={`${option.id}-${value}-${index}`}
                aria-disabled={!isAvailableForSale}
                disabled={!isAvailableForSale}
                title={`${option.name} ${value}${!isAvailableForSale ? " (Out of Stock)" : ""}`}
                className={clsx(
                  "flex min-w-[52px] items-center justify-center border px-2.5 py-1.5 text-[0.72rem] font-medium uppercase tracking-[0.12em] transition",
                  {
                    "cursor-default border-[var(--dp-ember,#BF5A28)] bg-[rgba(191,90,40,0.12)] text-[var(--dp-cream,#F2E8D5)]":
                      isActive,
                    "border-[var(--dp-border,rgba(242,232,213,0.09))] bg-[rgba(242,232,213,0.03)] text-[var(--dp-muted,#6A5A48)] hover:border-[rgba(242,232,213,0.3)] hover:text-[var(--dp-cream,#F2E8D5)]":
                      !isActive && isAvailableForSale,
                    "relative z-10 cursor-not-allowed overflow-hidden border-[var(--dp-border,rgba(242,232,213,0.09))] bg-[rgba(242,232,213,0.03)] text-[var(--dp-muted,#6A5A48)] before:absolute before:inset-x-0 before:top-1/2 before:-z-10 before:h-px before:-translate-y-1/2 before:-rotate-12 before:bg-[var(--dp-border,rgba(242,232,213,0.09))]":
                      !isAvailableForSale,
                  },
                )}
              >
                {value}
              </button>
            );
          })}
        </dd>
      </dl>
    </form>
  ));
}
