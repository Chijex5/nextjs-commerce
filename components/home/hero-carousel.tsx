"use client";

import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import Price from "components/price";
import type { Product } from "lib/database";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const HERO_ROTATE_MS = 6000;

export default function HeroCarousel({ products }: { products: Product[] }) {
  const items = useMemo(
    () => products.filter((product) => product.featuredImage?.url),
    [products],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, items.length]);

  useEffect(() => {
    if (items.length <= 1) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, HERO_ROTATE_MS);

    return () => window.clearInterval(intervalId);
  }, [items.length]);

  if (!items.length) return null;

  const activeProduct = items[activeIndex];
  if (!activeProduct) return null;

  return (
    <div className="h-full w-full">
      <Link
        href={`/product/${activeProduct.handle}`}
        className="group relative block h-full w-full overflow-hidden"
        style={{ background: "var(--dp-charcoal)" }}
      >
        {items.map((product, index) => (
          <Image
            key={product.id}
            src={product.featuredImage?.url ?? ""}
            alt={product.featuredImage?.altText || product.title}
            fill
            sizes="(min-width: 1024px) 48vw, 100vw"
            className={clsx(
              "object-cover transition-opacity duration-[1400ms] ease-out",
              index === activeIndex ? "opacity-100" : "opacity-0",
            )}
            style={{ filter: "brightness(0.94) saturate(0.96)" }}
            priority={index === 0}
          />
        ))}

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(6,4,2,0.86) 0%, rgba(6,4,2,0.08) 42%, transparent 65%)",
          }}
        />

        <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
          <p
            className="dp-label"
            style={{ color: "rgba(242,232,213,0.55)", marginBottom: "0.6rem" }}
          >
            {String(activeIndex + 1).padStart(2, "0")} /{" "}
            {String(items.length).padStart(2, "0")} — Featured
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeProduct.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
              }}
              exit={{
                opacity: 0,
                y: -6,
                transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
              }}
            >
              <h3
                className="dp-serif"
                style={{
                  fontSize: "clamp(1.4rem, 2.6vw, 2rem)",
                  fontWeight: 500,
                  color: "var(--dp-cream)",
                  lineHeight: 1.15,
                }}
              >
                {activeProduct.title}
              </h3>
              <div className="mt-3 flex items-center gap-4">
                <Price
                  amount={activeProduct.priceRange.maxVariantPrice.amount}
                  currencyCode={
                    activeProduct.priceRange.maxVariantPrice.currencyCode
                  }
                  currencyCodeClassName="hidden"
                  className="dp-sans"
                  style={
                    {
                      fontSize: "0.95rem",
                      color: "var(--dp-gold)",
                    } as React.CSSProperties
                  }
                />
                <span
                  className="dp-sans"
                  style={{
                    fontSize: "0.66rem",
                    fontWeight: 500,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--dp-cream)",
                    borderBottom: "1px solid var(--dp-ember)",
                    paddingBottom: 2,
                  }}
                >
                  View piece
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Link>

      {items.length > 1 ? (
        <div className="mt-4 flex items-center gap-2">
          {items.map((product, index) => (
            <button
              key={product.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${product.title}`}
              style={{
                height: 1,
                width: index === activeIndex ? 32 : 16,
                background:
                  index === activeIndex
                    ? "var(--dp-cream)"
                    : "rgba(242,232,213,0.25)",
                transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
