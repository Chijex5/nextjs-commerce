"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NotFound() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      {/* Brand bar */}
      <div className="mb-10 flex items-center gap-3">
        <span className="rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          D&apos;FOOTPRINT
        </span>
      </div>

      <div className="grid gap-8 rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/90 md:p-8 sm:grid-cols-2 sm:items-start">
        {/* Left — copy + actions */}
        <div>
          <span className="mb-4 inline-block rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
            Page not found
          </span>

          <h1 className="mb-3 font-serif text-4xl font-bold leading-tight tracking-tight text-neutral-900 md:text-5xl dark:text-neutral-100">
            This page stepped out.{" "}
            <span className="text-amber-700 dark:text-amber-300">
              Your next pair didn&apos;t.
            </span>
          </h1>

          <p className="mb-6 max-w-sm text-sm leading-7 text-neutral-500 dark:text-neutral-400">
            The link might be broken or the page moved. Search below, browse the
            shop, or pick a quick route.
          </p>

          <form
            onSubmit={handleSearch}
            className="mb-5 flex overflow-hidden rounded-xl border border-neutral-300 focus-within:border-neutral-500 dark:border-neutral-700 dark:focus-within:border-neutral-500"
          >
            <input
              type="search"
              placeholder="Search styles, collections…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full bg-transparent px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-neutral-900 px-4 text-xs font-medium uppercase tracking-wide text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              Back to homepage
            </Link>
            <Link
              href="/products"
              className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-900 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
            >
              Browse products
            </Link>
          </div>
        </div>

        {/* Right — 404 + quick links */}
        <div>
          <div className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900/80">
            <p className="font-serif text-8xl font-bold leading-none text-neutral-900/10 dark:text-white/10">
              404
            </p>
          </div>

          <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Quick routes
          </p>
          <nav className="flex flex-col gap-0.5">
            {[
              { href: "/products?sort=latest-desc", label: "New arrivals" },
              { href: "/custom-orders", label: "Custom orders" },
              { href: "/about-us", label: "About D'Footprint" },
              { href: "/contact", label: "Contact support" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-sm text-neutral-700 hover:border-neutral-200 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:border-neutral-800 dark:hover:bg-neutral-900"
              >
                {label}
                <span className="text-neutral-400">→</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
