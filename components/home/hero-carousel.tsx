"use client";

import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import Price from "components/price";
import type { Product } from "lib/database";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const HERO_ROTATE_MS = 5000;

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

  const previewItems = items
    .map((product, index) => ({ product, index }))
    .filter((item) => item.index !== activeIndex)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <Link href={`/product/${activeProduct.handle}`} className="group block">
        <div className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="relative aspect-[4/5] sm:aspect-[5/6]">
            {items.map((product, index) => (
              <Image
                key={product.id}
                src={product.featuredImage?.url ?? ""}
                alt={product.featuredImage?.altText || product.title}
                fill
                sizes="(min-width: 1280px) 42vw, (min-width: 1024px) 45vw, (min-width: 640px) 70vw, 90vw"
                className={clsx(
                  "object-cover transition-opacity duration-700",
                  index === activeIndex ? "opacity-100" : "opacity-0",
                )}
                priority={index === 0}
              />
            ))}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                Featured product
              </p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeProduct.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
                  }}
                  exit={{
                    opacity: 0,
                    y: -4,
                    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
                  }}
                >
                  <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                    {activeProduct.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-white">
                    <Price
                      amount={activeProduct.priceRange.maxVariantPrice.amount}
                      currencyCode={
                        activeProduct.priceRange.maxVariantPrice.currencyCode
                      }
                      currencyCodeClassName="hidden"
                      className="text-base font-semibold text-white"
                    />
                    <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur">
                      Shop now
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Link>

      {previewItems.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {previewItems.map(({ product, index }) => (
            <button
              key={product.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group text-left"
              aria-label={`Show ${product.title}`}
            >
              <div
                className={clsx(
                  "relative aspect-[4/5] overflow-hidden rounded-2xl border bg-neutral-100 transition-all duration-300 dark:bg-neutral-900",
                  index === activeIndex
                    ? "border-neutral-900 shadow-sm dark:border-neutral-200"
                    : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600",
                )}
              >
                <Image
                  src={product.featuredImage?.url ?? ""}
                  alt={product.featuredImage?.altText || product.title}
                  fill
                  sizes="(min-width: 1024px) 10vw, (min-width: 640px) 18vw, 30vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {items.length > 1 ? (
        <div className="flex items-center gap-2">
          {items.map((product, index) => (
            <button
              key={product.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={clsx(
                "h-2 w-8 rounded-full transition-colors",
                index === activeIndex
                  ? "bg-neutral-900 dark:bg-white"
                  : "bg-neutral-300 dark:bg-neutral-700",
              )}
              aria-label={`Show ${product.title}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
