"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import CartModal from "components/cart/modal";
import LogoSquare from "components/logo-square";
import Link from "next/link";
import { Suspense, useState } from "react";
import MobileMenu from "./mobile-menu";
import Search, { SearchSkeleton } from "./search";
import UserAccountIcon from "./user-account-icon";

type NavbarMenuItem = {
  title: string;
  path: string;
};

export default function NavbarClient({
  menu,
  siteName,
}: {
  menu: NavbarMenuItem[];
  siteName?: string;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-neutral-200/80 bg-neutral-50/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-3 md:px-6 lg:px-8">
        <div className="relative flex w-full items-center md:hidden">
          <div
            className={clsx(
              "flex w-full items-center justify-between gap-2 transition-all duration-300 ease-out",
              isSearchOpen
                ? "pointer-events-none -translate-y-1 opacity-0"
                : "translate-y-0 opacity-100",
            )}
            aria-hidden={isSearchOpen}
          >
            <Suspense fallback={null}>
              <MobileMenu menu={menu} />
            </Suspense>

            <Link
              href="/"
              prefetch={true}
              className="mx-2 flex min-w-0 items-center justify-center"
            >
              <LogoSquare />
              <div className="ml-2 truncate text-sm font-semibold uppercase tracking-wide">
                {siteName}
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-black transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:border-neutral-500"
                aria-label="Open search"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
              <UserAccountIcon />
              <CartModal />
            </div>
          </div>

          <div
            className={clsx(
              "absolute inset-0 flex items-center gap-3 transition-all duration-300 ease-out",
              isSearchOpen
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-1 opacity-0",
            )}
            aria-hidden={!isSearchOpen}
          >
            <div className="w-full">
              <Suspense fallback={<SearchSkeleton />}>
                <Search />
              </Suspense>
            </div>
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-black dark:text-neutral-300 dark:hover:text-white"
              aria-label="Close search"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="hidden w-full items-center gap-8 md:flex">
          <Link href="/" prefetch={true} className="flex items-center">
            <LogoSquare />
            <div className="ml-2 text-sm font-semibold uppercase tracking-wide text-neutral-900 dark:text-neutral-100">
              {siteName}
            </div>
          </Link>

          {menu.length ? (
            <ul className="flex items-center gap-2">
              {menu.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.path}
                    prefetch={true}
                    className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-white hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden w-full max-w-md lg:block">
              <Suspense fallback={<SearchSkeleton />}>
                <Search />
              </Suspense>
            </div>
            <UserAccountIcon />
            <CartModal />
          </div>
        </div>
      </div>
    </nav>
  );
}
