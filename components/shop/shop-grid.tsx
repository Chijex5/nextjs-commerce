"use client";

import clsx from "clsx";
import { ProductCard } from "components/product/product-card";
import type { ShopPage, ShopQuery } from "lib/data/shop";
import type { CardProduct } from "lib/data/types";
import { useCallback, useEffect, useRef, useState } from "react";

type Density = "comfy" | "dense";

/**
 * Product grid with infinite scroll and a density toggle (2 ↔ 1 column on
 * phones, 3 ↔ 5 on desktop). The choice is remembered on this device.
 */
export function ShopGrid({
  initial,
  query,
}: {
  initial: ShopPage;
  query: ShopQuery;
}) {
  const [products, setProducts] = useState<CardProduct[]>(initial.products);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [density, setDensity] = useState<Density>("comfy");
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("shop-density");
      if (saved === "dense" || saved === "comfy") setDensity(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const choose = (d: Density) => {
    setDensity(d);
    try {
      localStorage.setItem("shop-density", d);
    } catch {
      /* storage unavailable */
    }
  };

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ offset: String(products.length) });
      if (query.q) params.set("q", query.q);
      if (query.sort) params.set("sort", query.sort);
      if (query.collection) params.set("collection", query.collection);
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error(String(res.status));
      const page: ShopPage = await res.json();
      setProducts((cur) => {
        const seen = new Set(cur.map((p) => p.id));
        return [...cur, ...page.products.filter((p) => !seen.has(p.id))];
      });
      setHasMore(page.hasMore);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, products.length, query]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || error) return;
    const io = new IntersectionObserver(
      ([e]) => e?.isIntersecting && void loadMore(),
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore, error]);

  return (
    <div>
      <div className="label mb-5 flex items-center justify-between text-fg-3">
        <span>
          {products.length}
          {hasMore ? "+" : ""} {products.length === 1 ? "design" : "designs"}
        </span>
        <span className="flex items-center gap-3">
          View
          {(["comfy", "dense"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => choose(d)}
              aria-pressed={density === d}
              className={clsx(
                "transition-colors",
                density === d ? "text-fg underline underline-offset-4" : "",
              )}
            >
              {d === "comfy" ? "Large" : "Small"}
            </button>
          ))}
        </span>
      </div>

      <ul
        className={clsx(
          "grid gap-x-3 gap-y-10 sm:gap-x-4",
          density === "comfy"
            ? "grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
            : "grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
        )}
      >
        {products.map((product, i) => (
          <li key={product.id} className="animate-fade-in">
            <ProductCard
              product={product}
              index={i}
              priority={i < 4}
              sizes={
                density === "comfy"
                  ? "(min-width:1536px) 25vw, (min-width:1024px) 33vw, 50vw"
                  : "(min-width:1024px) 17vw, (min-width:768px) 25vw, 33vw"
              }
            />
          </li>
        ))}
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <li key={`s${i}`} aria-hidden>
                <div className="aspect-[4/5] animate-pulse bg-plate" />
                <div className="mt-3 h-3 w-2/3 animate-pulse bg-plate" />
              </li>
            ))
          : null}
      </ul>

      <div ref={sentinel} className="h-px" />
      {error ? (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            className="label link-underline"
          >
            Couldn&apos;t load more — try again
          </button>
        </div>
      ) : null}
      {!hasMore && products.length > 8 ? (
        <p className="label mt-16 text-center text-fg-3">
          That&apos;s everything — for now.
        </p>
      ) : null}
    </div>
  );
}
