"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import CartModal from "components/cart/modal";
import LogoSquare from "components/logo-square";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const brandName = siteName ?? "D'FOOTPRINT";

  const fallbackMenu: NavbarMenuItem[] = [
    { title: "Shop", path: "/products" },
    { title: "Custom Orders", path: "/custom-orders" },
  ];
  const menuItems = menu.length ? menu : fallbackMenu;

  const isActivePath = (path: string) =>
    path === "/"
      ? pathname === "/"
      : pathname === path || pathname.startsWith(`${path}/`);

  /* Shrink nav on scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`

        :root {
          --dp-ink:    #0A0704;
          --dp-cream:  #F2E8D5;
          --dp-sand:   #C9B99A;
          --dp-muted:  #6A5A48;
          --dp-ember:  #BF5A28;
          --dp-border: rgba(242,232,213,0.09);
        }

        .dp-nav-wordmark {
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 0.1em;
        }
        .dp-nav-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--dp-muted);
          text-decoration: none;
          padding: 0.4rem 0;
          position: relative;
          transition: color 0.2s;
        }
        .dp-nav-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 1px;
          background: var(--dp-ember);
          transition: width 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .dp-nav-link:hover { color: var(--dp-cream); }
        .dp-nav-link:hover::after { width: 100%; }
        .dp-nav-link.active { color: var(--dp-cream); }
        .dp-nav-link.active::after { width: 100%; background: var(--dp-ember); }

        .dp-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 2.25rem; height: 2.25rem;
          border: 1px solid var(--dp-border);
          background: transparent;
          color: var(--dp-muted);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .dp-icon-btn:hover {
          border-color: rgba(242,232,213,0.3);
          color: var(--dp-cream);
          background: rgba(242,232,213,0.05);
        }

        .dp-search-input {
          width: 100%;
          background: rgba(242,232,213,0.05);
          border: none;
          border-bottom: 1px solid var(--dp-border);
          color: var(--dp-cream);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          padding: 0.5rem 0;
          outline: none;
          transition: border-color 0.2s;
        }
        .dp-search-input::placeholder { color: var(--dp-muted); }
        .dp-search-input:focus { border-bottom-color: var(--dp-ember); }

        /* Search expand overlay */
        @keyframes dp-search-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dp-search-expand {
          animation: dp-search-in 0.22s cubic-bezier(0.16,1,0.3,1) both;
        }

        /* Ember dot for active */
        .dp-active-dot {
          display: inline-block;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: var(--dp-ember);
          margin-left: 6px;
          vertical-align: middle;
        }
      `}</style>

      <nav
        aria-label="Main"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "var(--dp-ink)",
          borderBottom: "1px solid var(--dp-border)",
          transition: "padding 0.3s cubic-bezier(0.16,1,0.3,1)",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        {/* ── DESKTOP ───────────────────────────────────────────── */}
        <div
          className="mx-auto hidden w-full md:flex items-center"
          style={{
            maxWidth: 1800,
            padding: scrolled ? "0.7rem clamp(1.5rem,4vw,4rem)" : "1rem clamp(1.5rem,4vw,4rem)",
            gap: "2.5rem",
            transition: "padding 0.3s",
          }}
        >
          {/* Logo + Wordmark */}
          <Link
            href="/"
            prefetch={true}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <LogoSquare forceStyle />
            <span
              className="dp-nav-wordmark"
              style={{
                fontSize: "1.15rem",
                color: "var(--dp-cream)",
              }}
            >
              {brandName}
            </span>
          </Link>

          {/* Vertical rule */}
          <span
            style={{
              width: 1,
              height: "1.25rem",
              background: "var(--dp-border)",
              flexShrink: 0,
            }}
          />

          {/* Nav links */}
          {menuItems.length > 0 && (
            <ul
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2rem",
                listStyle: "none",
                margin: 0,
                padding: 0,
              }}
            >
              {menuItems.map((item) => {
                const active = isActivePath(item.path);
                return (
                  <li key={item.title}>
                    <Link
                      href={item.path}
                      prefetch={true}
                      aria-current={active ? "page" : undefined}
                      className={clsx("dp-nav-link", active && "active")}
                    >
                      {item.title}
                      {active && <span className="dp-active-dot" aria-hidden="true" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Right side actions */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {/* Search — inline expandable */}
            {isSearchOpen ? (
              <div
                className="dp-search-expand"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  width: "min(380px, 30vw)",
                }}
              >
                <Suspense fallback={<SearchSkeleton />}>
                  <Search />
                </Suspense>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="dp-icon-btn"
                  aria-label="Close search"
                  style={{ flexShrink: 0 }}
                >
                  <XMarkIcon style={{ width: "1rem", height: "1rem" }} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="dp-icon-btn"
                aria-label="Search"
              >
                <MagnifyingGlassIcon style={{ width: "1rem", height: "1rem" }} />
              </button>
            )}

            {/* Vertical rule */}
            <span
              style={{
                width: 1,
                height: "1.25rem",
                background: "var(--dp-border)",
                margin: "0 0.25rem",
                flexShrink: 0,
              }}
            />

            <UserAccountIcon />
            <CartModal />
          </div>
        </div>

        {/* ── MOBILE ────────────────────────────────────────────── */}
        <div
          className="md:hidden"
          style={{
            maxWidth: 1800,
            margin: "0 auto",
            padding: "0.75rem 1rem",
          }}
        >
          {isSearchOpen ? (
            /* Mobile search bar */
            <div
              className="dp-search-expand"
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <div style={{ flex: 1 }}>
                <Suspense fallback={<SearchSkeleton />}>
                  <Search />
                </Suspense>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--dp-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.2s",
                  padding: "0.25rem 0",
                  flexShrink: 0,
                }}
                aria-label="Close search"
              >
                Cancel
              </button>
            </div>
          ) : (
            /* Mobile default row */
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
              }}
            >
              {/* Hamburger */}
              <Suspense fallback={null}>
                <MobileMenu menu={menuItems} />
              </Suspense>

              {/* Center: Logo + Name */}
              <Link
                href="/"
                prefetch={true}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  textDecoration: "none",
                  flex: 1,
                  justifyContent: "center",
                  minWidth: 0,
                }}
              >
                <LogoSquare forceStyle />
                <span
                  className="dp-nav-wordmark"
                  style={{
                    fontSize: "1rem",
                    color: "var(--dp-cream)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {brandName}
                </span>
              </Link>

              {/* Right actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="dp-icon-btn"
                  aria-label="Search"
                >
                  <MagnifyingGlassIcon style={{ width: "1rem", height: "1rem" }} />
                </button>
                <UserAccountIcon />
                <CartModal />
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}