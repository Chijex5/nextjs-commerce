import clsx from "clsx";
import type { HomeProduct } from "lib/data/home";
import Image from "next/image";
import Link from "next/link";
import { PairIllustration, pairStyleFor } from "./pair-illustration";

export function formatNaira({
  amount,
  currencyCode,
}: HomeProduct["price"]): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/**
 * Product tile. Shows the product photo when there is one, otherwise an
 * illustrated plate so the grid never looks broken while photos are pending.
 */
export function ProductCard({
  product,
  index,
  size = "default",
  sizes,
  priority,
}: {
  product: HomeProduct;
  index: number;
  size?: "default" | "feature";
  sizes: string;
  priority?: boolean;
}) {
  const number = String(index + 1).padStart(2, "0");

  return (
    <Link
      href={`/product/${product.handle}`}
      prefetch={false}
      className="group block h-full outline-none active:scale-[0.985] transition-transform duration-200"
    >
      <div
        className={clsx(
          "relative overflow-hidden bg-plate",
          size === "feature"
            ? "aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[560px]"
            : "aspect-[4/5]",
          "ring-accent ring-offset-2 ring-offset-canvas group-focus-visible:ring-2",
        )}
      >
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover transition-transform duration-700 ease-atelier group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-fg">
            <PairIllustration
              style={pairStyleFor(product.handle)}
              className={clsx(
                "transition-transform duration-700 ease-atelier group-hover:-translate-y-1.5 group-hover:rotate-[-2deg]",
                size === "feature" ? "w-[62%]" : "w-[70%]",
              )}
            />
          </div>
        )}

        <span className="absolute left-3 top-3 font-mono text-[11px] tracking-wider text-fg-3 mix-blend-normal">
          No.{number}
        </span>
        {!product.available ? (
          <span className="absolute right-3 top-3 bg-canvas px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-fg">
            Sold out
          </span>
        ) : null}
        <span
          aria-hidden
          className="absolute bottom-3 right-3 grid size-9 translate-y-2 place-items-center rounded-full bg-signal text-ink opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <h3
          className={clsx(
            "line-clamp-2 min-w-0 font-medium text-fg sm:line-clamp-1",
            size === "feature"
              ? "text-base sm:text-lg"
              : "text-sm sm:text-[15px]",
          )}
        >
          {product.title}
        </h3>
        <p className="shrink-0 text-sm tabular-nums text-fg-2">
          {formatNaira(product.price)}
        </p>
      </div>
    </Link>
  );
}
