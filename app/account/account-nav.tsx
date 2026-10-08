"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/orders", label: "Orders" },
];

/** Tabs under the account title — swipeable on phones. */
export default function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="mt-8 border-y border-line">
      <ul className="rail label flex gap-8 overflow-x-auto px-4 sm:px-8 md:px-12">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex h-12 items-center border-b-2 transition-colors",
                  active
                    ? "border-fg text-fg"
                    : "border-transparent text-fg-3 hover:text-fg",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
