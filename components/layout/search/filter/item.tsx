"use client";

import clsx from "clsx";
import type { SortFilterItem } from "lib/constants";
import { createUrl } from "lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ListItem, PathFilterItem } from ".";

function PathFilterItem({ item }: { item: PathFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname === item.path;
  const newParams = new URLSearchParams(searchParams.toString());
  const DynamicTag = active ? "p" : Link;

  newParams.delete("q");

  return (
    <li className="mt-2 flex text-black dark:text-white" key={item.title}>
      <DynamicTag
        href={createUrl(item.path, newParams)}
        className={clsx(
          "w-full text-sm underline-offset-4 md:hover:underline dark:md:hover:text-neutral-100",
          {
            "underline underline-offset-4": active,
          },
        )}
      >
        {item.title}
      </DynamicTag>
    </li>
  );
}

function SortFilterItem({ item }: { item: SortFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("sort") === item.slug;
  const q = searchParams.get("q");
  const href = createUrl(
    pathname,
    new URLSearchParams({
      ...(q && { q }),
      ...(item.slug && item.slug.length && { sort: item.slug }),
    }),
  );
  const DynamicTag = active ? "p" : Link;

  return (
    <li
      className="mt-2 flex text-sm text-black dark:text-white"
      key={item.title}
    >
      <DynamicTag
        prefetch={!active ? false : undefined}
        href={href}
        className={clsx("w-full md:hover:underline md:hover:underline-offset-4", {
          "underline underline-offset-4": active,
        })}
      >
        {item.title}
      </DynamicTag>
    </li>
  );
}

export function FilterItem({ item }: { item: ListItem }) {
  return "path" in item ? (
    <PathFilterItem item={item} />
  ) : (
    <SortFilterItem item={item} />
  );
}

// Mobile-friendly chip components without list styling
export function PathFilterChip({ item }: { item: PathFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname === item.path;
  const newParams = new URLSearchParams(searchParams.toString());
  const DynamicTag = active ? "p" : Link;

  newParams.delete("q");

  return (
    <DynamicTag
      href={createUrl(item.path, newParams)}
      className={clsx(
        "inline-block whitespace-nowrap rounded-full px-4 py-2 text-sm transition-all",
        {
          "bg-black text-white dark:bg-white dark:text-black": active,
          "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700": !active,
        },
      )}
    >
      {item.title}
    </DynamicTag>
  );
}

export function SortFilterChip({ item }: { item: SortFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("sort") === item.slug;
  const q = searchParams.get("q");
  const href = createUrl(
    pathname,
    new URLSearchParams({
      ...(q && { q }),
      ...(item.slug && item.slug.length && { sort: item.slug }),
    }),
  );
  const DynamicTag = active ? "p" : Link;

  return (
    <DynamicTag
      prefetch={!active ? false : undefined}
      href={href}
      className={clsx(
        "inline-block whitespace-nowrap rounded-full px-4 py-2 text-sm transition-all",
        {
          "bg-black text-white dark:bg-white dark:text-black": active,
          "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700": !active,
        },
      )}
    >
      {item.title}
    </DynamicTag>
  );
}

export function FilterChip({ item }: { item: ListItem }) {
  return "path" in item ? (
    <PathFilterChip item={item} />
  ) : (
    <SortFilterChip item={item} />
  );
}
