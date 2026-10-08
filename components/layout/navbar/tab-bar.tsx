"use client";

import clsx from "clsx";
import { openCartDrawer } from "components/cart/modal";
import { useCart } from "components/cart/cart-context";
import { Home, LayoutGrid, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMounted } from "hooks/useMounted";
import type { ReactNode } from "react";

// Product pages show their own sticky "Add to bag" bar instead.
const HIDDEN_ON = ["/checkout", "/order", "/product/"];

function tap() {
  try {
    navigator.vibrate?.(8);
  } catch {
    /* not supported (iOS) */
  }
}

/** App-style bottom navigation for phones. Hidden from md up and in checkout. */
export function TabBar({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname();
  const { cart } = useCart();
  const mounted = useMounted();
  const count = mounted ? (cart?.totalQuantity ?? 0) : 0;

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const active = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/92 pb-[env(safe-area-inset-bottom)] text-fg backdrop-blur-md md:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        <Tab href="/" label="Home" active={active("/")}>
          <Home className="size-5" strokeWidth={1.6} />
        </Tab>
        <Tab
          href="/products"
          label="Shop"
          active={active("/products") || active("/search")}
        >
          <LayoutGrid className="size-5" strokeWidth={1.6} />
        </Tab>
        <TabButton
          label="Search"
          onClick={() => {
            tap();
            onSearch();
          }}
        >
          <Search className="size-5" strokeWidth={1.6} />
        </TabButton>
        <TabButton
          label="Bag"
          onClick={() => {
            tap();
            openCartDrawer();
          }}
        >
          <span className="relative">
            <ShoppingBag className="size-5" strokeWidth={1.6} />
            {count > 0 ? (
              <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-fg px-1 font-mono text-[9px] text-canvas">
                {count}
              </span>
            ) : null}
          </span>
        </TabButton>
        <Tab href="/account" label="Account" active={active("/account")}>
          <User className="size-5" strokeWidth={1.6} />
        </Tab>
      </ul>
    </nav>
  );
}

const itemClass =
  "flex h-full w-full flex-col items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-wider transition-[opacity,transform] active:scale-90";

function Tab({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={tap}
        aria-current={active ? "page" : undefined}
        className={clsx(itemClass, active ? "opacity-100" : "opacity-50")}
      >
        {children}
        {label}
      </Link>
    </li>
  );
}

function TabButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={clsx(itemClass, "opacity-50")}
      >
        {children}
        {label}
      </button>
    </li>
  );
}
