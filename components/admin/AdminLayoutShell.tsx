"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import LogoIcon from "components/icons/logo";
import { Menu, X } from "lucide-react";
import ThemeToggleButton from "../theme-toggle-button";
import "./admin.css";

type AdminLayoutShellProps = {
  children: React.ReactNode;
  /** Items waiting on a human, keyed by nav href. */
  badges?: Record<string, { count: number; urgent?: boolean }>;
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
      { href: "/admin/dashboard", label: "Home" },
      { href: "/admin/analytics", label: "Analytics" },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/custom-order-requests", label: "Custom requests" },
      { href: "/admin/payments", label: "Payments" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/collections", label: "Collections" },
      { href: "/admin/custom-orders", label: "Custom showcase" },
      { href: "/admin/content", label: "Content" },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/admin/users", label: "Customers" },
      { href: "/admin/reviews", label: "Reviews" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/campaigns", label: "Campaigns" },
      { href: "/admin/coupons", label: "Coupons" },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/admins", label: "Team" },
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
  badges,
}: {
  pathname: string;
  onNavigate?: () => void;
  badges?: AdminLayoutShellProps["badges"];
}) {
  return (
    <nav className="space-y-7">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="label mb-2 px-3 text-white/40">{group.label}</p>
          <ul>
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const badge = badges?.[item.href];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "group flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-white text-black"
                        : "text-white/70 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    <span className="flex-1">{item.label}</span>
                    {badge && badge.count > 0 ? (
                      <span
                        className={[
                          "min-w-5 px-1.5 text-center font-mono text-[10px] leading-5 tabular-nums",
                          badge.urgent
                            ? "bg-red-600 text-white"
                            : active
                              ? "bg-black text-white"
                              : "bg-white/15 text-white",
                        ].join(" ")}
                      >
                        {badge.count > 99 ? "99+" : badge.count}
                      </span>
                    ) : null}
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

const MOBILE_TABS: NavItem[] = [
  { href: "/admin/dashboard", label: "Home" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/custom-order-requests", label: "Requests" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Main shell
═══════════════════════════════════════════════════════════════════════════ */

export default function AdminLayoutShell({
  children,
  adminProfile,
  badges,
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

  const brand = (
    <Link href="/" className="flex items-center gap-2.5 text-white">
      <LogoIcon className="!size-9 !fill-white" />
      <span>
        <span className="display block text-xl leading-none">
          D&apos;Footprint
        </span>
        <span className="label text-white/50">Admin</span>
      </span>
    </Link>
  );

  const accountLinks = (onClick?: () => void) => (
    <div className="space-y-1.5 px-3 py-4">
      <Link
        href="/admin/account"
        onClick={onClick}
        className="label flex h-10 items-center justify-between border border-white/15 px-3 text-white/70 hover:border-white hover:text-white"
      >
        Account settings <span>→</span>
      </Link>
      <Link
        href="/api/auth/signout"
        onClick={onClick}
        className="label flex h-10 items-center justify-between border border-white/15 px-3 text-white/70 hover:border-white hover:text-white"
      >
        Log out <span>→</span>
      </Link>
    </div>
  );

  return (
    <div className="admin-shell min-h-screen bg-canvas text-fg">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden border-r border-white/10 bg-ink lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
          <div className="px-5 py-6">{brand}</div>
          <div className="no-scrollbar flex-1 overflow-y-auto px-2 py-4">
            <SidebarNav pathname={pathname || ""} badges={badges} />
          </div>
          <div className="border-t border-white/10">{accountLinks()}</div>
        </aside>

        {/* ── Content ── */}
        <div className="min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur-md lg:h-16 lg:px-8">
            <button
              type="button"
              aria-label="Open admin menu"
              onClick={() => setMobileMenuOpen(true)}
              className="grid size-10 place-items-center border border-line lg:hidden"
            >
              <Menu className="size-4" />
            </button>

            <p className="label min-w-0 flex-1 truncate">
              <span className="text-fg-3">Admin / </span>
              {currentPage}
            </p>

            <div className="flex items-center gap-2">
              <ThemeToggleButton className="grid size-10 place-items-center border border-line text-fg-2 hover:border-fg hover:text-fg" />

              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  aria-label="Open admin profile menu"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  className="grid size-10 place-items-center bg-fg font-mono text-xs text-canvas"
                >
                  {initials}
                </button>

                {profileMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Admin profile menu"
                    className="animate-fade-in absolute right-0 z-50 mt-2 w-72 border border-line bg-canvas p-1 shadow-xl"
                  >
                    <div className="border-b border-line px-3 py-3">
                      <p className="truncate font-medium">{displayName}</p>
                      <p className="truncate text-xs text-fg-3">
                        {adminProfile?.email || "Unknown email"}
                      </p>
                      <p className="label mt-2 text-fg-3">
                        {roleLabel} · Last login {lastLoginLabel}
                      </p>
                    </div>
                    <Link
                      href="/admin/account"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block px-3 py-2.5 text-sm hover:bg-fg hover:text-canvas"
                    >
                      Account settings
                    </Link>
                    <Link
                      href="/api/auth/signout"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block px-3 py-2.5 text-sm hover:bg-fg hover:text-canvas"
                    >
                      Log out
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="min-w-0">{children}</main>
        </div>
      </div>

      {/* ── Mobile bottom tabs ── */}
      <nav
        aria-label="Admin quick links"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="grid h-16 grid-cols-5">
          {MOBILE_TABS.map((tab) => {
            const active = isActive(pathname || "", tab.href);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex h-full items-center justify-center font-mono text-[11px] uppercase tracking-wide",
                    active
                      ? "text-fg underline underline-offset-4"
                      : "text-fg-3",
                  ].join(" ")}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-full w-full items-center justify-center font-mono text-[11px] uppercase tracking-wide text-fg-3"
            >
              More
            </button>
          </li>
        </ul>
      </nav>

      {/* ── Mobile drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close admin menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="animate-slide-up absolute inset-x-0 bottom-0 flex max-h-[88svh] flex-col bg-ink pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-5 py-5">
              {brand}
              <button
                type="button"
                aria-label="Close admin menu"
                onClick={() => setMobileMenuOpen(false)}
                className="label flex h-10 items-center gap-1.5 text-white"
              >
                Close <X className="size-4" />
              </button>
            </div>
            <div className="no-scrollbar flex-1 overflow-y-auto px-2 py-2">
              <SidebarNav
                pathname={pathname || ""}
                badges={badges}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>
            <div className="border-t border-white/10">
              {accountLinks(() => setMobileMenuOpen(false))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
