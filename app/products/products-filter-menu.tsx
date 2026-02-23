"use client";

import clsx from "clsx";
import type { SortFilterItem } from "lib/constants";
import Link from "next/link";
import { useState } from "react";

type ProductsFilterMenuProps = {
  sorting: SortFilterItem[];
  activeSortSlug: string | null;
};

export default function ProductsFilterMenu({
  sorting,
  activeSortSlug,
}: ProductsFilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-controls="products-filter-menu"
        className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-500"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M3 5h14" strokeLinecap="round" />
          <path d="M6 10h8" strokeLinecap="round" />
          <path d="M8 15h4" strokeLinecap="round" />
        </svg>
        Filters
      </button>

      {isOpen ? (
        <div
          id="products-filter-menu"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[min(92vw,360px)] rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Sort products
            </h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Close
            </button>
          </div>

          <ul className="space-y-2">
            {sorting.map((option) => {
              const href = option.slug
                ? `/products?sort=${option.slug}`
                : "/products";
              const isActive = option.slug === activeSortSlug;

              return (
                <li key={option.title}>
                  <Link
                    href={href}
                    className={clsx(
                      "flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-neutral-100",
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <span>{option.title}</span>
                    {isActive ? <span>✓</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
