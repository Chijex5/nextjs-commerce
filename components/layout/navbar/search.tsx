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
        style={{ borderColor: "var(--dp-muted)", color: "var(--dp-muted)"}}
        placeholder="Search products"
        aria-label="Search products"
        autoComplete="off"
        defaultValue={searchParams?.get("q") || ""}
        className="w-full border border-neutral-300 bg-white px-5 py-2.5 pr-10 text-sm text-black outline-none transition-colors focus:border-neutral-500 dark:border-[#6A5A48] dark:bg-neutral-900 dark:text-[#6A5A48]"
      />
      <div className="pointer-events-none absolute right-3 top-0 flex h-full items-center text-neutral-500 dark:text-neutral-400">
        <MagnifyingGlassIcon className="h-4 w-4" style={{color: "var(--dp-muted)"}} />
      </div>
    </Form>
  );
}

export function SearchSkeleton() {
  return (
    <form className="relative w-full">
      <input
        placeholder="Search products"
        aria-label="Search products"
        className="w-full rounded-full border border-neutral-300 bg-white px-5 py-2.5 pr-10 text-sm text-black placeholder:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-400"
      />
      <div className="pointer-events-none absolute right-3 top-0 flex h-full items-center text-neutral-500 dark:text-neutral-400">
        <MagnifyingGlassIcon className="h-4 w-4" />
      </div>
    </form>
  );
}
