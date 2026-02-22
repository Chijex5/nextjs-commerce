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
    <nav className="relative p-4 lg:px-6">
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
          <div className="block flex-none">
            <Suspense fallback={null}>
              <MobileMenu menu={menu} />
            </Suspense>
          </div>

          <Link
            href="/"
            prefetch={true}
            className="mx-2 flex min-w-0 items-center justify-center"
          >
            <LogoSquare />
            <div className="ml-2 truncate text-sm font-medium uppercase">
              {siteName}
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
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

      <div className="hidden w-full items-center md:flex">
        <div className="flex w-full md:w-1/2">
          <Link
            href="/"
            prefetch={true}
            className="mr-2 flex w-full items-center justify-center md:w-auto lg:mr-6"
          >
            <LogoSquare />
            <div className="ml-2 flex-none text-sm font-medium uppercase md:hidden lg:block">
              {siteName}
            </div>
          </Link>
          {menu.length ? (
            <ul className="hidden gap-6 text-sm md:flex md:items-center">
              {menu.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.path}
                    prefetch={true}
                    className="text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 md:w-1/2">
          <div className="hidden justify-center md:flex md:w-full md:max-w-md lg:max-w-lg">
            <Suspense fallback={<SearchSkeleton />}>
              <Search />
            </Suspense>
          </div>
          <UserAccountIcon />
          <CartModal />
        </div>
      </div>
    </nav>
  );
}
