"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  getLgaOptions,
  getWardOptions,
  normalizeLocationName,
  stateOptions,
  type LocationOption,
} from "@/lib/locations";

export type LocationChangeSource = "input" | "select";

type SearchableSelectProps = {
  label: string;
  value: string;
  options: LocationOption[];
  onChange: (value: string, source: LocationChangeSource) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  inputClassName?: string;
  menuClassName?: string;
  labelClassName?: string;
  containerClassName?: string;
  showAllOnEmpty?: boolean;
  emptyMessage?: string;
  emptyQueryMessage?: string;
  maxResults?: number;
};

function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
  required,
  inputClassName,
  menuClassName,
  labelClassName,
  containerClassName,
  showAllOnEmpty = false,
  emptyMessage = "No matches found.",
  emptyQueryMessage = "Start typing to search.",
  maxResults = 12,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const query = normalizeLocationName(value);
  const hasQuery = query.length > 0;

  const filteredOptions = useMemo(() => {
    if (!hasQuery && !showAllOnEmpty) return [];
    const matches = hasQuery
      ? options.filter((option) =>
          normalizeLocationName(option.searchText ?? option.label).includes(
            query,
          ),
        )
      : options;
    return matches.slice(0, maxResults);
  }, [hasQuery, options, query, showAllOnEmpty, maxResults]);

  useEffect(() => {
    if (!open) return;
    if (filteredOptions.length === 0) {
      setHighlightedIndex(-1);
      return;
    }
    if (highlightedIndex < 0 || highlightedIndex >= filteredOptions.length) {
      setHighlightedIndex(0);
    }
  }, [open, filteredOptions.length, highlightedIndex]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (option: LocationOption) => {
    onChange(option.value, "select");
    setOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div className={clsx("relative", containerClassName)} ref={rootRef}>
      <label className={clsx("mb-1 block text-sm font-medium", labelClassName)}>
        {label}
      </label>
      <div className="relative">
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value, "input");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setHighlightedIndex((current) =>
                Math.min(current + 1, filteredOptions.length - 1),
              );
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlightedIndex((current) => Math.max(current - 1, 0));
            }
            if (event.key === "Enter" && open) {
              const option = filteredOptions[highlightedIndex];
              if (option) {
                event.preventDefault();
                handleSelect(option);
              }
            }
            if (event.key === "Escape") {
              setOpen(false);
              setHighlightedIndex(-1);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          role="combobox"
          className={clsx(
            "w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 pr-10 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-200 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white dark:focus:ring-neutral-800",
            disabled && "cursor-not-allowed opacity-60",
            inputClassName,
          )}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>

      {open && !disabled && (
        <div
          id={listId}
          role="listbox"
          className={clsx(
            "absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-950",
            menuClassName,
          )}
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">
              {hasQuery ? emptyMessage : emptyQueryMessage}
            </div>
          ) : (
            <div className="max-h-60 overflow-auto">
              {filteredOptions.map((option, index) => {
                const isActive = index === highlightedIndex;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelect(option)}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                      isActive
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                        : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type LocationSelectGroupProps = {
  stateValue: string;
  lgaValue: string;
  wardValue: string;
  onStateChange: (value: string, source: LocationChangeSource) => void;
  onLgaChange: (value: string, source: LocationChangeSource) => void;
  onWardChange: (value: string, source: LocationChangeSource) => void;
  inputClassName?: string;
  menuClassName?: string;
  labelClassName?: string;
  className?: string;
  stateRequired?: boolean;
  lgaRequired?: boolean;
  wardRequired?: boolean;
  statePlaceholder?: string;
  lgaPlaceholder?: string;
  wardPlaceholder?: string;
  wardLabel?: string;
};

export function LocationSelectGroup({
  stateValue,
  lgaValue,
  wardValue,
  onStateChange,
  onLgaChange,
  onWardChange,
  inputClassName,
  menuClassName,
  labelClassName,
  className,
  stateRequired,
  lgaRequired,
  wardRequired,
  statePlaceholder = "Start typing a state",
  lgaPlaceholder = "Search for your LGA",
  wardPlaceholder = "Search for your ward",
  wardLabel = "Ward (optional)",
}: LocationSelectGroupProps) {
  const lgaOptions = useMemo(
    () => getLgaOptions(stateValue),
    [stateValue],
  );
  const wardOptions = useMemo(
    () => getWardOptions(stateValue, lgaValue),
    [stateValue, lgaValue],
  );

  const hasState = normalizeLocationName(stateValue).length > 0;
  const hasLga = normalizeLocationName(lgaValue).length > 0;

  return (
    <div className={clsx("space-y-4", className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SearchableSelect
          label="State"
          value={stateValue}
          options={stateOptions}
          onChange={onStateChange}
          placeholder={statePlaceholder}
          showAllOnEmpty
          inputClassName={inputClassName}
          menuClassName={menuClassName}
          labelClassName={labelClassName}
          required={stateRequired}
          emptyMessage="No matching state found."
          emptyQueryMessage="Select or type your state."
          maxResults={50}
        />
        <SearchableSelect
          label="LGA (Local Government Area)"
          value={lgaValue}
          options={lgaOptions}
          onChange={onLgaChange}
          placeholder={lgaPlaceholder}
          inputClassName={inputClassName}
          menuClassName={menuClassName}
          labelClassName={labelClassName}
          required={lgaRequired}
          disabled={!hasState}
          emptyMessage="No matching LGA found."
          emptyQueryMessage={
            hasState ? "Start typing to search LGAs." : "Select a state first."
          }
        />
      </div>
      <SearchableSelect
        label={wardLabel}
        value={wardValue}
        options={wardOptions}
        onChange={onWardChange}
        placeholder={wardPlaceholder}
        inputClassName={inputClassName}
        menuClassName={menuClassName}
        labelClassName={labelClassName}
        required={wardRequired}
        disabled={!hasLga}
        emptyMessage="No matching ward found."
        emptyQueryMessage={
          hasLga ? "Start typing to search wards." : "Select an LGA first."
        }
      />
    </div>
  );
}
