"use client";

import clsx from "clsx";
import { Sheet } from "components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export type ShopLink = { label: string; href: string; active: boolean };

/**
 * Phones: a floating "Sort & filter" pill above the tab bar that opens a
 * bottom sheet. (Desktop shows the same links inline in the toolbar.)
 */
export function ShopControls({
  sorts,
  collections,
}: {
  sorts: ShopLink[];
  collections: ShopLink[];
}) {
  const [open, setOpen] = useState(false);
  const activeCount =
    (sorts.find((s) => s.active && s !== sorts[0]) ? 1 : 0) +
    (collections.find((c) => c.active && c !== collections[0]) ? 1 : 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="label fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-fg px-5 text-canvas shadow-lg transition-transform active:scale-95 md:hidden"
      >
        <SlidersHorizontal className="size-4" />
        Sort & filter{activeCount ? ` (${activeCount})` : ""}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Sort & filter">
        <OptionList
          title="Sort by"
          items={sorts}
          onPick={() => setOpen(false)}
        />
        <div className="h-8" />
        <OptionList
          title="Collection"
          items={collections}
          onPick={() => setOpen(false)}
        />
      </Sheet>
    </>
  );
}

function OptionList({
  title,
  items,
  onPick,
}: {
  title: string;
  items: ShopLink[];
  onPick: () => void;
}) {
  return (
    <div>
      <p className="label mb-2 text-fg-3">{title}</p>
      <ul className="border-t border-line">
        {items.map((item) => (
          <li key={item.href} className="border-b border-line">
            <Link
              href={item.href}
              onClick={onPick}
              scroll={false}
              aria-current={item.active ? "true" : undefined}
              className="flex h-14 items-center justify-between text-base"
            >
              {item.label}
              <span
                className={clsx(
                  "grid size-5 place-items-center rounded-full border",
                  item.active ? "border-fg" : "border-line",
                )}
              >
                {item.active ? (
                  <span className="size-2.5 rounded-full bg-fg" />
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
