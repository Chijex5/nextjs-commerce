"use client";

import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Bars3Icon, UserIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useUserSession } from "hooks/useUserSession";
import { Menu } from "lib/shopify/types";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

export default function MobileMenu({ menu }: { menu: Menu[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useUserSession();
  const fallbackMenu: Menu[] = [
    { title: "Shop", path: "/products" },
    { title: "Custom Orders", path: "/custom-orders" },
  ];
  const menuItems = menu.length ? menu : fallbackMenu;
  const isActivePath = (path: string) =>
    path === "/"
      ? pathname === "/"
      : pathname === path || pathname.startsWith(`${path}/`);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  return (
    <>
      <style>{`
        .dp-mobile-trigger {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border: 1px solid var(--dp-border, rgba(242,232,213,0.09));
          background: transparent;
          color: var(--dp-muted, #6A5A48);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .dp-mobile-trigger:hover {
          border-color: rgba(242,232,213,0.3);
          color: var(--dp-cream, #F2E8D5);
          background: rgba(242,232,213,0.05);
        }

        .dp-mobile-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          width: 100%;
          padding: 0.72rem 0;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.76rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--dp-muted, #6A5A48);
          border-bottom: 1px solid var(--dp-border, rgba(242,232,213,0.09));
          transition: color 0.2s;
        }
        .dp-mobile-link:hover {
          color: var(--dp-cream, #F2E8D5);
        }
        .dp-mobile-link.active {
          color: var(--dp-cream, #F2E8D5);
        }
        .dp-mobile-dot {
          display: inline-block;
          width: 0.36rem;
          height: 0.36rem;
          border-radius: 999px;
          background: var(--dp-ember, #BF5A28);
          flex-shrink: 0;
        }

        .dp-mobile-panel-enter {
          animation: dp-mobile-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes dp-mobile-in {
          from {
            opacity: 0;
            transform: translateX(-22px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open mobile menu"
        className="dp-mobile-trigger md:hidden"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      <Transition show={isOpen}>
        <Dialog onClose={() => setIsOpen(false)} className="relative z-50">
          <TransitionChild
            as={Fragment}
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed inset-0 bg-black/45 backdrop-blur-[1px]"
              aria-hidden="true"
            />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="transition-transform duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel
              className="dp-mobile-panel-enter fixed inset-y-0 left-0 flex w-[88%] max-w-sm flex-col justify-between border-r p-5"
              style={{
                borderColor: "var(--dp-border, rgba(242,232,213,0.09))",
                background: "var(--dp-charcoal, #191209)",
                color: "var(--dp-cream, #F2E8D5)",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              <div>
                <div className="mb-8 flex items-center justify-between">
                  <p
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 500,
                      letterSpacing: "0.26em",
                      textTransform: "uppercase",
                      color: "var(--dp-ember, #BF5A28)",
                    }}
                  >
                    Menu
                  </p>
                  <button
                    type="button"
                    className="dp-mobile-trigger"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close mobile menu"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div
                  style={{
                    height: 1,
                    width: "100%",
                    marginBottom: "0.4rem",
                    background:
                      "linear-gradient(90deg, var(--dp-ember, #BF5A28) 0%, var(--dp-gold, #C0892A) 50%, transparent 100%)",
                  }}
                />

                <ul className="space-y-0">
                  {menuItems.map((item: Menu) => {
                    const isActive = isActivePath(item.path);
                    return (
                      <li key={item.title}>
                        <Link
                          href={item.path}
                          prefetch={true}
                          onClick={() => setIsOpen(false)}
                          aria-current={isActive ? "page" : undefined}
                          className={clsx(
                            "dp-mobile-link",
                            isActive && "active",
                          )}
                        >
                          <span>{item.title}</span>
                          {isActive && (
                            <span
                              className="dp-mobile-dot"
                              aria-hidden="true"
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <Link
                      href="/orders"
                      prefetch={true}
                      onClick={() => setIsOpen(false)}
                      aria-current={
                        isActivePath("/orders") ? "page" : undefined
                      }
                      className={clsx(
                        "dp-mobile-link",
                        isActivePath("/orders") && "active",
                      )}
                    >
                      <span>Orders</span>
                      {isActivePath("/orders") && (
                        <span className="dp-mobile-dot" aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={session ? "/account" : "/auth/login"}
                      prefetch={true}
                      onClick={() => setIsOpen(false)}
                      aria-current={
                        isActivePath(session ? "/account" : "/auth/login")
                          ? "page"
                          : undefined
                      }
                      className={clsx(
                        "dp-mobile-link",
                        isActivePath(session ? "/account" : "/auth/login") &&
                          "active",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        {session ? "My Account" : "Login"}
                      </span>
                      {isActivePath(session ? "/account" : "/auth/login") && (
                        <span className="dp-mobile-dot" aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                </ul>
              </div>

              <div
                style={{
                  borderTop:
                    "1px solid var(--dp-border, rgba(242,232,213,0.09))",
                  paddingTop: "1rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.76rem",
                    lineHeight: 1.65,
                    color: "var(--dp-muted, #6A5A48)",
                    margin: 0,
                  }}
                >
                  Handcrafted footwear from Lagos, Nigeria.
                </p>
              </div>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  );
}
