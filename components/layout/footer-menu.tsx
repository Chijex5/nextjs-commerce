"use client";

import { Menu } from "lib/shopify/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function FooterMenuItem({ item }: { item: Menu }) {
  const pathname = usePathname();
  const [active, setActive] = useState(pathname === item.path);

  useEffect(() => {
    setActive(pathname === item.path);
  }, [pathname, item.path]);

  return (
    <li>
      <Link
        href={item.path}
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "0.78rem",
          color: active ? "var(--dp-cream)" : "var(--dp-muted)",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.2rem 0",
          position: "relative",
          transition: "color 0.2s",
        }}
        className="dp-footer-link"
      >
        {active && (
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--dp-ember)",
              flexShrink: 0,
            }}
          />
        )}
        {item.title}
      </Link>
    </li>
  );
}

export default function FooterMenu({ menu }: { menu: Menu[] }) {
  if (!menu.length) return null;

  return (
    <nav>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.65rem",
        }}
      >
        {menu.map((item: Menu) => (
          <FooterMenuItem key={item.title} item={item} />
        ))}
      </ul>
    </nav>
  );
}