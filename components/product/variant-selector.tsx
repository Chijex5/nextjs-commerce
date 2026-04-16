"use client";

import clsx from "clsx";
import { ProductOption, ProductVariant } from "lib/shopify/types";
import { useRouter } from "next/navigation";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

type Combination = {
  id: string;
  availableForSale: boolean;
  [key: string]: string | boolean;
};

type PendingOption = {
  name: string;
  value: string;
};

const OptionButton = memo(function OptionButton({
  optionName,
  value,
  isActive,
  isAvailableForSale,
  interactionDisabled,
  isBusy,
  onSelect,
}: {
  optionName: string;
  value: string;
  isActive: boolean;
  isAvailableForSale: boolean;
  interactionDisabled: boolean;
  isBusy: boolean;
  onSelect: (value: string) => void;
}) {
  const isDisabled = !isAvailableForSale || interactionDisabled;

  return (
    <button
      onClick={() => onSelect(value)}
      aria-disabled={isDisabled}
      aria-busy={isBusy}
      disabled={isDisabled}
      title={`${optionName} ${value}${!isAvailableForSale ? " (Out of Stock)" : ""}${isBusy ? " (Updating)" : ""}`}
      className={clsx(
        "relative flex min-w-[52px] items-center justify-center border px-2.5 py-1.5 text-[0.72rem] font-medium uppercase tracking-[0.12em] transition",
        {
          "cursor-default border-[var(--dp-ember,#BF5A28)] bg-[rgba(191,90,40,0.12)] text-[var(--dp-cream,#F2E8D5)]":
            isActive,
          "border-[var(--dp-border,rgba(242,232,213,0.09))] bg-[rgba(242,232,213,0.03)] text-[var(--dp-muted,#6A5A48)] hover:border-[rgba(242,232,213,0.3)] hover:text-[var(--dp-cream,#F2E8D5)]":
            !isActive && isAvailableForSale,
          "relative z-10 cursor-not-allowed overflow-hidden border-[var(--dp-border,rgba(242,232,213,0.09))] bg-[rgba(242,232,213,0.03)] text-[var(--dp-muted,#6A5A48)] before:absolute before:inset-x-0 before:top-1/2 before:-z-10 before:h-px before:-translate-y-1/2 before:-rotate-12 before:bg-[var(--dp-border,rgba(242,232,213,0.09))]":
            !isAvailableForSale,
          "cursor-wait": isBusy,
        },
      )}
    >
      <span className={clsx("transition-opacity", { "opacity-90": isBusy })}>
        {value}
      </span>
      {isBusy ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 bottom-0.5 h-px overflow-hidden bg-[var(--dp-ember,#BF5A28)]/20"
        >
          <span className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-transparent via-[var(--dp-ember,#BF5A28)]/90 to-transparent animate-[pulse_900ms_cubic-bezier(0.22,1,0.36,1)_infinite]" />
        </span>
      ) : null}
    </button>
  );
});

export function VariantSelector({
  options,
  variants,
  selectedOptions,
  onOptionChangeAction,
}: {
  options: ProductOption[];
  variants: ProductVariant[];
  selectedOptions: Record<string, string>;
  onOptionChangeAction: (name: string, value: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingOption, setPendingOption] = useState<PendingOption | null>(
    null,
  );
  const [optimisticSelectedOptions, setOptimisticSelectedOptions] =
    useState<Record<string, string>>(selectedOptions);
  const hasNoOptionsOrJustOneOption =
    !options.length ||
    (options.length === 1 && options[0]?.values.length === 1);

  if (hasNoOptionsOrJustOneOption) {
    return null;
  }

  useEffect(() => {
    if (!isPending) {
      setOptimisticSelectedOptions(selectedOptions);
      setPendingOption(null);
    }
  }, [isPending, selectedOptions]);

  const combinations: Combination[] = useMemo(
    () =>
      variants.map((variant) => ({
        id: variant.id,
        availableForSale: variant.availableForSale,
        ...variant.selectedOptions.reduce(
          (accumulator, option) => ({
            ...accumulator,
            [option.name.toLowerCase()]: option.value,
          }),
          {},
        ),
      })),
    [variants],
  );

  const updateOption = useCallback(
    (name: string, value: string) => {
      if (isPending) {
        return;
      }
      if (optimisticSelectedOptions[name] === value) {
        return;
      }

      const nextSelectedOptions = {
        ...optimisticSelectedOptions,
        [name]: value,
      };
      setPendingOption({ name, value });
      setOptimisticSelectedOptions(nextSelectedOptions);

      startTransition(() => {
        onOptionChangeAction(name, value);
        const params = new URLSearchParams(nextSelectedOptions);
        router.replace(`?${params.toString()}`, { scroll: false });
      });
    },
    [isPending, onOptionChangeAction, optimisticSelectedOptions, router],
  );

  return options.map((option) => {
    const optionNameLowerCase = option.name.toLowerCase();

    const onSelectOptionValue = (value: string) =>
      updateOption(optionNameLowerCase, value);

    return (
      <div key={option.id} aria-busy={isPending}>
        <dl className="mb-8">
          <dt className="mb-4 text-[0.66rem] font-medium uppercase tracking-[0.2em] text-[var(--dp-ember,#BF5A28)]">
            {option.name}
          </dt>
          <dd className="flex flex-wrap gap-3">
            {option.values.map((value, index) => {
              // Base option params on current selected options so we preserve other option state.
              const optionParams = {
                ...optimisticSelectedOptions,
                [optionNameLowerCase]: value,
              };

              // Filter out invalid options and check if the option combination is available for sale.
              const filtered = Object.entries(optionParams).filter(
                ([key, currentValue]) =>
                  options.find(
                    (currentOption) =>
                      currentOption.name.toLowerCase() === key &&
                      currentOption.values.includes(currentValue),
                  ),
              );
              const isAvailableForSale = combinations.find((combination) =>
                filtered.every(
                  ([key, currentValue]) =>
                    combination[key] === currentValue &&
                    combination.availableForSale,
                ),
              );

              // The option is active if it's in the selected options.
              const isActive =
                optimisticSelectedOptions[optionNameLowerCase] === value;
              const isBusy =
                isPending &&
                isActive &&
                pendingOption?.name === optionNameLowerCase &&
                pendingOption.value === value;

              return (
                <OptionButton
                  key={`${option.id}-${value}-${index}`}
                  optionName={option.name}
                  value={value}
                  isActive={isActive}
                  isAvailableForSale={Boolean(isAvailableForSale)}
                  interactionDisabled={isPending}
                  isBusy={isBusy}
                  onSelect={onSelectOptionValue}
                />
              );
            })}
          </dd>
        </dl>
      </div>
    );
  });
}
