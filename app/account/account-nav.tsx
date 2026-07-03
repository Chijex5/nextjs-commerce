"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/orders", label: "Orders" },
];

export default function AccountNav() {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        .ac-nav-shell {
          position: sticky;
          top: 5.5rem;
        }

        .ac-nav {
          border: 1px solid rgba(var(--brand-fg-rgb),0.09);
          background: rgba(var(--brand-bg-rgb),0.75);
          overflow: hidden;
        }

        .ac-nav-top {
          padding: 0.9rem 1rem;
          border-bottom: 1px solid rgba(var(--brand-fg-rgb),0.09);
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--brand-terra);
        }

        .ac-nav-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .ac-nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          text-decoration: none;
          padding: 0.95rem 1rem;
          border-bottom: 1px solid rgba(var(--brand-fg-rgb),0.09);
          color: var(--brand-sand);
          transition: background 0.2s ease, color 0.2s ease, padding 0.2s ease;
          font-size: 0.8rem;
        }

        .ac-nav-link:last-child {
          border-bottom: none;
        }

        .ac-nav-link:hover {
          background: rgba(var(--brand-fg-rgb),0.03);
          color: var(--brand-cream);
          padding-left: 1.2rem;
        }

        .ac-nav-link[data-active="true"] {
          background: rgba(var(--brand-terra-rgb),0.11);
          color: var(--brand-cream);
        }

        .ac-nav-arrow {
          font-size: 0.68rem;
          color: rgba(var(--brand-fg-rgb),0.45);
        }

        .ac-nav-link[data-active="true"] .ac-nav-arrow {
          color: var(--brand-terra);
        }

        @media (max-width: 1024px) {
          .ac-nav-shell {
            position: static;
            top: auto;
          }

          .ac-nav-list {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .ac-nav-link {
            border-bottom: none;
            border-right: 1px solid rgba(var(--brand-fg-rgb),0.09);
            justify-content: center;
            padding: 0.85rem 0.75rem;
          }

          .ac-nav-link:last-child {
            border-right: none;
          }

          .ac-nav-arrow {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .ac-nav-list {
            grid-template-columns: 1fr;
          }

          .ac-nav-link {
            border-right: none;
            border-bottom: 1px solid rgba(var(--brand-fg-rgb),0.09);
            justify-content: space-between;
          }

          .ac-nav-link:last-child {
            border-bottom: none;
          }

          .ac-nav-arrow {
            display: inline;
          }
        }
      `}</style>

      <aside className="ac-nav-shell">
        <nav className="ac-nav" aria-label="Account sections">
          <p className="ac-nav-top">Account navigation</p>
          <ul className="ac-nav-list">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/account" && pathname.startsWith(link.href));

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    data-active={isActive}
                    className="ac-nav-link"
                  >
                    <span>{link.label}</span>
                    <span className="ac-nav-arrow">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
