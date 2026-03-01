"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AdminLayoutShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard" }],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/collections", label: "Collections" },
      { href: "/admin/content", label: "Content" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/custom-order-requests", label: "Custom Requests" },
      { href: "/admin/custom-orders", label: "Custom Showcase" },
      { href: "/admin/coupons", label: "Coupons" },
    ],
  },
  {
    label: "Access",
    items: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/admins", label: "Admins" },
    ],
  },
];

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

function isActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") {
    return pathname === "/admin" || pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-8">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-2">
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                        : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function AdminLayoutShell({ children }: AdminLayoutShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const currentPage = useMemo(() => {
    if (!pathname) {
      return "Admin";
    }

    const matchedItem = [...NAV_ITEMS]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => isActive(pathname, item.href));

    return matchedItem?.label || "Admin";
  }, [pathname]);

  if (pathname?.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-neutral-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-6 py-6 dark:border-neutral-800">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
              D&apos;FOOTPRINT
            </p>
            <p className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Admin Panel
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <SidebarNav pathname={pathname || ""} />
          </div>

          <div className="border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <Link
              href="/api/auth/signout"
              className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Log out
            </Link>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900 lg:hidden">
            <button
              type="button"
              aria-label="Open admin menu"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-300 text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              </svg>
            </button>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {currentPage}
            </p>
            <Link
              href="/api/auth/signout"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              Log out
            </Link>
          </header>

          <main className="min-w-0">{children}</main>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close admin menu"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside className="relative flex h-full w-[18rem] max-w-[85%] flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-5 dark:border-neutral-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                  D&apos;FOOTPRINT
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Admin Panel
                </p>
              </div>
              <button
                type="button"
                aria-label="Close admin menu"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <SidebarNav
                pathname={pathname || ""}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>

            <div className="border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <Link
                href="/api/auth/signout"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Log out
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
