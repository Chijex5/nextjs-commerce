"use client";

import clsx from "clsx";
import type { SortFilterItem } from "lib/constants";
import type { Collection } from "lib/database";
import Link from "next/link";
import { useMemo, useState } from "react";

type SearchControlsMenuProps = {
  collections: Collection[];
  sorting: SortFilterItem[];
  pathname: string;
  query?: string;
  activeSortSlug: string | null;
  activeCollectionPath?: string;
};

export default function SearchControlsMenu({
  collections,
  sorting,
  pathname,
  query,
  activeSortSlug,
  activeCollectionPath,
}: SearchControlsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (query?.trim()) {
      params.set("q", query.trim());
    }
    return params;
  }, [query]);

  const buildHref = (options: { path?: string; sortSlug?: string | null }) => {
    const targetPath = options.path || pathname;
    const params = new URLSearchParams(queryParams);

    if (options.sortSlug) {
      params.set("sort", options.sortSlug);
    } else {
      params.delete("sort");
    }

    const search = params.toString();
    return search ? `${targetPath}?${search}` : targetPath;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-controls="search-controls-menu"
        className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-500"
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
        Filter & Sort
      </button>

      {isOpen ? (
        <div
          id="search-controls-menu"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(92vw,420px)] space-y-5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Browse controls
            </h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm text-neutral-500 transition-colors hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Close
            </button>
          </div>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
              Collections
            </h3>
            <ul className="max-h-44 space-y-2 overflow-y-auto pr-1">
              {collections.map((collection) => {
                const isActive = activeCollectionPath === collection.path;

                return (
                  <li key={collection.handle}>
                    <Link
                      href={buildHref({
                        path: collection.path,
                        sortSlug: activeSortSlug,
                      })}
                      onClick={() => setIsOpen(false)}
                      className={clsx(
                        "flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black"
                          : "border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-neutral-100",
                      )}
                    >
                      <span>{collection.title}</span>
                      {isActive ? <span>✓</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
              Sort by
            </h3>
            <ul className="space-y-2">
              {sorting.map((option) => {
                const isActive = option.slug === activeSortSlug;

                return (
                  <li key={option.title}>
                    <Link
                      href={buildHref({ sortSlug: option.slug })}
                      onClick={() => setIsOpen(false)}
                      className={clsx(
                        "flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black"
                          : "border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-neutral-100",
                      )}
                    >
                      <span>{option.title}</span>
                      {isActive ? <span>✓</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
