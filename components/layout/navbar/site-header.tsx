"use client";

import clsx from "clsx";
import CartModal from "components/cart/modal";
import LogoIcon from "components/icons/logo";
import ThemeToggleButton from "components/theme-toggle-button";
import type { Menu } from "lib/shopify/types";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SearchOverlay } from "./search-overlay";
import { TabBar } from "./tab-bar";

const FALLBACK_MENU: Menu[] = [
  { title: "Shop", path: "/products" },
  { title: "New in", path: "/search?sort=latest-desc" },
  { title: "Custom", path: "/custom-orders" },
  { title: "About", path: "/about-us" },
];

/**
 * Storefront chrome: a slim header that hides while scrolling down and comes
 * back on scroll up, a bottom tab bar on phones, a full-screen search overlay
 * and the bag drawer. One instance of each, shared by desktop and mobile.
 */
export default function SiteHeader({
  menu,
  siteName,
}: {
  menu: Menu[];
  siteName: string;
}) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const items = menu.length ? menu : FALLBACK_MENU;

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setHidden(y > last && y > 120);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setSearchOpen(false), [pathname]);

  const isActive = (path: string) =>
    path !== "/" && pathname.startsWith(path.split("?")[0]!);

  return (
    <>
      <header
        className={clsx(
          "sticky top-0 z-40 border-b border-line bg-canvas/90 text-fg backdrop-blur-md transition-transform duration-500 ease-atelier",
          hidden && !searchOpen && "-translate-y-full",
        )}
      >
        <div className="mx-auto grid h-14 grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8 md:h-16 md:px-12">
          {/* Left: primary links (desktop) */}
          <nav aria-label="Main" className="hidden md:block">
            <ul className="label flex gap-7">
              {items.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    aria-current={isActive(item.path) ? "page" : undefined}
                    className={clsx(
                      "transition-opacity hover:opacity-100",
                      isActive(item.path)
                        ? "underline underline-offset-4"
                        : "opacity-70",
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <span className="md:hidden" />

          {/* Centre: logo */}
          <Link
            href="/"
            aria-label={`${siteName} home`}
            className="flex items-center gap-2"
          >
            <LogoIcon className="size-7 md:size-8" />
            <span className="display text-[22px] leading-none md:text-[26px]">
              {siteName}
            </span>
          </Link>

          {/* Right: actions */}
          <div className="label flex items-center justify-end gap-5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-2 opacity-70 transition-opacity hover:opacity-100 md:flex"
            >
              <Search className="size-3.5" strokeWidth={2} />
              Search
            </button>
            <Link
              href="/account"
              className="hidden opacity-70 transition-opacity hover:opacity-100 md:block"
            >
              Account
            </Link>
            <ThemeToggleButton
              className="grid size-8 place-items-center opacity-70 transition-opacity hover:opacity-100"
              iconClassName="size-4"
            />
            <Suspense fallback={<span className="hidden md:block">Bag</span>}>
              <CartModal
                trigger={(open, quantity) => (
                  <button
                    type="button"
                    onClick={open}
                    className="hidden md:block"
                    aria-label={`Open bag, ${quantity} items`}
                  >
                    Bag ({quantity})
                  </button>
                )}
              />
            </Suspense>
          </div>
        </div>
      </header>

      <TabBar onSearch={() => setSearchOpen(true)} />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        quickLinks={items}
      />
    </>
  );
}
