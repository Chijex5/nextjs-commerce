"use client";

import Price from "components/price";
import type { Product } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type InfiniteProductsGridProps = {
  initialProducts: Product[];
  pageSize: number;
  sortSlug: string | null;
};

function mergeUniqueProducts(
  current: Product[],
  incoming: Product[],
): Product[] {
  if (!incoming.length) return current;

  const seen = new Set(current.map((product) => product.id));
  const next = [...current];

  for (const product of incoming) {
    if (!seen.has(product.id)) {
      seen.add(product.id);
      next.push(product);
    }
  }

  return next;
}

export default function InfiniteProductsGrid({
  initialProducts,
  pageSize,
  sortSlug,
}: InfiniteProductsGridProps) {
  const [products, setProducts] = useState(initialProducts);
  const [hasMore, setHasMore] = useState(initialProducts.length === pageSize);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const query = new URLSearchParams({
        offset: String(products.length),
        limit: String(pageSize),
      });

      if (sortSlug) {
        query.set("sort", sortSlug);
      }

      const response = await fetch(`/api/products?${query.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load more products.");
      }

      const payload: {
        products: Product[];
        hasMore: boolean;
      } = await response.json();

      setProducts((current) => mergeUniqueProducts(current, payload.products));
      setHasMore(Boolean(payload.hasMore));
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to load more products right now.");
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, pageSize, products.length, sortSlug]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          void loadMore();
        }
      },
      {
        root: null,
        rootMargin: "300px 0px",
        threshold: 0,
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <>
      <div className="products-grid">
        {products.map((product) => {
          const minPrice = parseFloat(
            product.priceRange.minVariantPrice.amount,
          );
          const maxPrice = parseFloat(
            product.priceRange.maxVariantPrice.amount,
          );
          const hasPriceRange = minPrice !== maxPrice;

          return (
            <Link
              key={product.id}
              href={`/product/${product.handle}`}
              prefetch={true}
              className="product-card"
            >
              <div className="card-image-wrap">
                {product.featuredImage?.url ? (
                  <Image
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText || product.title}
                    fill
                    sizes="(min-width: 1600px) 16vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  />
                ) : (
                  <div className="card-image-empty">
                    <svg
                      className="card-image-empty-icon"
                      viewBox="0 0 120 80"
                      width="120"
                      height="80"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 60 Q6 70 20 72 L100 72 Q114 72 110 58 L104 44 Q100 36 88 36 L16 36 Q6 40 8 60 Z"
                        fill="#F2E8D5"
                      />
                      <path
                        d="M16 36 Q12 12 36 4 Q56 -2 80 6 Q100 14 108 36 Z"
                        fill="#F2E8D5"
                      />
                    </svg>
                  </div>
                )}
                <button className="card-quick-add" tabIndex={-1}>
                  Quick Add
                </button>
              </div>

              <div className="card-info">
                <h2 className="card-name">{product.title}</h2>
                <div className="card-price-row">
                  {hasPriceRange ? (
                    <>
                      <Price
                        amount={product.priceRange.minVariantPrice.amount}
                        currencyCode={
                          product.priceRange.minVariantPrice.currencyCode
                        }
                        currencyCodeClassName="hidden"
                        className="inline"
                      />
                      <span className="card-price-separator">-</span>
                      <Price
                        amount={product.priceRange.maxVariantPrice.amount}
                        currencyCode={
                          product.priceRange.maxVariantPrice.currencyCode
                        }
                        currencyCodeClassName="hidden"
                        className="inline"
                      />
                    </>
                  ) : (
                    <Price
                      amount={product.priceRange.maxVariantPrice.amount}
                      currencyCode={
                        product.priceRange.maxVariantPrice.currencyCode
                      }
                      currencyCodeClassName="hidden"
                      className="inline"
                    />
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {errorMessage ? (
        <p
          style={{
            marginTop: "20px",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#BF5A28",
          }}
        >
          {errorMessage}
        </p>
      ) : null}

      {isLoading ? (
        <p
          style={{
            marginTop: "20px",
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#6A5A48",
          }}
        >
          Loading more products...
        </p>
      ) : null}

      <div ref={sentinelRef} aria-hidden="true" style={{ height: "1px" }} />
    </>
  );
}
