"use client";

import clsx from "clsx";
import type { Product } from "lib/database";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const ROTATE_MS = 7000;

/**
 * Full-bleed background crossfade — no card chrome, no text, no price.
 * The hero section composes its own typography on top of this.
 */
export default function HeroCarousel({ products }: { products: Product[] }) {
  const items = useMemo(
    () => products.filter((product) => product.featuredImage?.url),
    [products],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [items.length]);

  if (!items.length) return null;

  return (
    <div className="absolute inset-0">
      {items.map((product, index) => (
        <Image
          key={product.id}
          src={product.featuredImage?.url ?? ""}
          alt=""
          fill
          sizes="100vw"
          className={clsx(
            "object-cover transition-opacity duration-[1800ms] ease-out",
            index === activeIndex ? "opacity-100" : "opacity-0",
          )}
          style={{ filter: "brightness(0.62) saturate(0.92)" }}
          priority={index === 0}
        />
      ))}

      {items.length > 1 ? (
        <div
          className="absolute z-10 flex items-center gap-2"
          style={{ right: "clamp(1.5rem, 4vw, 4rem)", bottom: "2rem" }}
        >
          {items.map((product, index) => (
            <button
              key={product.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show frame ${index + 1}`}
              style={{
                height: 1,
                width: index === activeIndex ? 28 : 12,
                background:
                  index === activeIndex
                    ? "rgba(242,232,213,0.9)"
                    : "rgba(242,232,213,0.3)",
                transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
