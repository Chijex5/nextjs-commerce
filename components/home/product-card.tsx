import type { HomeProduct } from "lib/data/home";
import Image from "next/image";
import Link from "next/link";

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

/** Editorial product tile: photo first, one mono caption line underneath. */
export function ProductCard({
  product,
  index,
  sizes,
}: {
  product: HomeProduct;
  index: number;
  sizes: string;
}) {
  return (
    <Link
      href={`/product/${product.handle}`}
      prefetch={false}
      data-cursor="View"
      className="group block outline-none transition-transform duration-200 active:scale-[0.98]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-plate ring-fg ring-offset-2 ring-offset-canvas group-focus-visible:ring-2">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-[1.2s] ease-atelier group-hover:scale-[1.06]"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-mono text-xs uppercase tracking-widest text-fg-3">
            Photo soon
          </span>
        )}
        {!product.available ? (
          <span className="absolute left-0 top-0 bg-fg px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-canvas">
            Sold out
          </span>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 font-mono text-[11px] uppercase leading-snug tracking-[0.06em] sm:text-xs">
        <span className="text-fg-3">{String(index + 1).padStart(3, "0")}</span>
        <span className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-3">
          <span className="line-clamp-2 text-fg">{product.title}</span>
          <span className="shrink-0 text-fg-2">
            {formatNaira(product.price)}
          </span>
        </span>
      </div>
    </Link>
  );
}
