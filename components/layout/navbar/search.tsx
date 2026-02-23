"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Form from "next/form";
import { useSearchParams } from "next/navigation";

export default function Search() {
  const searchParams = useSearchParams();

  return (
    <Form action="/search" className="relative w-full">
      <input
        key={searchParams?.get("q")}
        type="text"
        name="q"
        placeholder="Search products"
        autoComplete="off"
        defaultValue={searchParams?.get("q") || ""}
        className="w-full rounded-full border border-neutral-300 bg-white px-5 py-2.5 pr-10 text-sm text-black placeholder:text-neutral-500 outline-none transition-colors focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-400"
      />
      <div className="pointer-events-none absolute right-3 top-0 flex h-full items-center text-neutral-500 dark:text-neutral-400">
        <MagnifyingGlassIcon className="h-4 w-4" />
      </div>
    </Form>
  );
}

export function SearchSkeleton() {
  return (
    <form className="relative w-full">
      <input
        placeholder="Search products"
        className="w-full rounded-full border border-neutral-300 bg-white px-5 py-2.5 pr-10 text-sm text-black placeholder:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-400"
      />
      <div className="pointer-events-none absolute right-3 top-0 flex h-full items-center text-neutral-500 dark:text-neutral-400">
        <MagnifyingGlassIcon className="h-4 w-4" />
      </div>
    </form>
  );
}
