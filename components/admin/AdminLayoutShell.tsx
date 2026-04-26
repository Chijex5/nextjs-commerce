"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type AdminLayoutShellProps = {
  children: React.ReactNode;
  adminProfile: {
    name: string | null;
    email: string;
    role: string;
    lastLoginAt: string | null;
  } | null;
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
    items: [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/admin/analytics", label: "Analytics" },
    ],
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
      { href: "/admin/reviews", label: "Reviews" },
      { href: "/admin/custom-order-requests", label: "Custom Requests" },
      { href: "/admin/custom-orders", label: "Custom Showcase" },
      { href: "/admin/coupons", label: "Coupons" },
      { href: "/admin/payments", label: "Payments" },
    ],
  },
  {
    label: "Access",
    items: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/admins", label: "Admins" },
      { href: "/admin/account", label: "Account" },
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

/* ─── Sidebar nav ────────────────────────────────────────────────────────── */

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={[
                      "group relative flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                    ].join(" ")}
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-white/40 dark:bg-neutral-900/40" />
                    )}
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

/* ═══════════════════════════════════════════════════════════════════════════
   Main shell
═══════════════════════════════════════════════════════════════════════════ */

export default function AdminLayoutShell({
  children,
  adminProfile,
}: AdminLayoutShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [profileMenuOpen]);

  const currentPage = useMemo(() => {
    if (!pathname) return "Admin";
    const matchedItem = [...NAV_ITEMS]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => isActive(pathname, item.href));
    return matchedItem?.label || "Admin";
  }, [pathname]);

  if (
    pathname?.startsWith("/admin/login") ||
    pathname?.startsWith("/admin/forgot-password") ||
    pathname?.startsWith("/admin/reset-password")
  ) {
    return <>{children}</>;
  }

  const displayName = adminProfile?.name?.trim() || "Admin User";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AU";
  const roleLabel = (adminProfile?.role || "admin").replace(/_/g, " ");
  const lastLoginLabel = adminProfile?.lastLoginAt
    ? new Date(adminProfile.lastLoginAt).toLocaleString()
    : "Not available";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden border-r border-neutral-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col dark:border-neutral-800 dark:bg-neutral-900">
          {/* Wordmark */}
          <div className="px-5 py-6">
            <Link href="/" className="block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 transition-colors hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-100">
                D&apos;FOOTPRINT
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-neutral-300 dark:text-neutral-600">
                Admin
              </p>
            </Link>
          </div>

          <div className="mx-4 h-px bg-neutral-100 dark:bg-neutral-800" />

          {/* Nav */}
          <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-5">
            <SidebarNav pathname={pathname || ""} />
          </div>

          <div className="mx-4 h-px bg-neutral-100 dark:bg-neutral-800" />

          {/* Footer */}
          <div className="px-4 py-4">
            <Link
              href="/admin/account"
              className="mb-2 flex w-full items-center justify-center rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              Account settings
            </Link>

            <Link
              href="/api/auth/signout"
              className="flex w-full items-center justify-center rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              Log out
            </Link>
          </div>
        </aside>

        {/* ── Content ── */}
        <div className="min-w-0">
          {/* Top header */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
            <button
              type="button"
              aria-label="Open admin menu"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 lg:hidden"
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
                  d="M4 7h16M4 12h16M4 17h16"
                />
              </svg>
            </button>

            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {currentPage}
            </p>

            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                aria-label="Open admin profile menu"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 px-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-neutral-800 dark:border-neutral-200 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                {initials}
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  aria-label="Admin profile menu"
                  className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:border-neutral-700 dark:bg-neutral-900 dark:ring-white/10"
                >
                  <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                    <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {adminProfile?.email || "Unknown email"}
                    </p>
                    <span className="mt-2 inline-flex rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
                      {roleLabel}
                    </span>
                    <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                      Last login: {lastLoginLabel}
                    </p>
                  </div>
                  <div className="mt-1 py-1">
                    <Link
                      href="/admin/account"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-900 hover:text-white dark:text-neutral-300 dark:hover:bg-neutral-100 dark:hover:text-neutral-900"
                    >
                      Account settings
                    </Link>
                    <Link
                      href="/api/auth/signout"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-900 hover:text-white dark:text-neutral-300 dark:hover:bg-neutral-100 dark:hover:text-neutral-900"
                    >
                      Log out
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </header>

          <main className="min-w-0">{children}</main>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close admin menu"
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <aside className="relative flex h-full w-72 max-w-[85%] flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
                  D&apos;FOOTPRINT
                </p>
                <p className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Admin Panel
                </p>
              </div>
              <button
                type="button"
                aria-label="Close admin menu"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
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

            <div className="mx-4 h-px bg-neutral-100 dark:bg-neutral-800" />

            <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-5">
              <SidebarNav
                pathname={pathname || ""}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>

            <div className="mx-4 h-px bg-neutral-100 dark:bg-neutral-800" />

            <div className="px-4 py-4">
              <Link
                href="/admin/account"
                onClick={() => setMobileMenuOpen(false)}
                className="mb-2 flex w-full items-center justify-center rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                Account settings
              </Link>

              <Link
                href="/api/auth/signout"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                Log out
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
