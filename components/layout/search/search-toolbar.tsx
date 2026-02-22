"use client";

import { FilterChip } from "components/layout/search/filter/item";
import type { SortFilterItem } from "lib/constants";
import type { Collection } from "lib/database";

export default function SearchToolbar({
  collections,
  sorting,
}: {
  collections: Collection[];
  sorting: SortFilterItem[];
}) {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-col gap-6 px-4 py-6">
        <section className="space-y-3">
          <p className="text-xs font-medium tracking-[0.14em] text-neutral-500 uppercase dark:text-neutral-400">
            Collections
          </p>
          <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {collections.map((collection) => (
              <FilterChip
                key={collection.handle}
                item={{ title: collection.title, path: collection.path }}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-medium tracking-[0.14em] text-neutral-500 uppercase dark:text-neutral-400">
            Sort
          </p>
          <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {sorting.map((item) => (
              <FilterChip key={item.title} item={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
