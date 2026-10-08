import clsx from "clsx";
import { buttonClass } from "components/ui/button";
import { sorting } from "lib/constants";
import type { ShopPage, ShopQuery } from "lib/data/shop";
import type { ShopCollection } from "lib/data/types";
import Link from "next/link";
import type { ReactNode } from "react";
import { ShopControls, type ShopLink } from "./shop-controls";
import { ShopGrid } from "./shop-grid";

const SORT_LABELS: Record<string, string> = {
  "": "Featured",
  "trending-desc": "Best sellers",
  "latest-desc": "Newest",
  "price-asc": "Price, low–high",
  "price-desc": "Price, high–low",
};

/**
 * Shared layout for /products, /search and /search/[collection]: big title,
 * swipeable collection chips, sort links (desktop) or a sort & filter sheet
 * (phones), then the infinite product grid.
 */
export function ShopView({
  eyebrow,
  title,
  intro,
  page,
  query,
  collections,
  basePath,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  page: ShopPage;
  query: ShopQuery;
  collections: ShopCollection[];
  /** Path the sort links point at (keeps q and collection). */
  basePath: string;
}) {
  const withParams = (path: string, sort?: string | null) => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (sort) params.set("sort", sort);
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  };

  const sorts: ShopLink[] = sorting.map((s) => ({
    label: SORT_LABELS[s.slug ?? ""] ?? s.title,
    href: withParams(basePath, s.slug),
    active: (query.sort ?? null) === s.slug,
  }));

  const collectionLinks: ShopLink[] = [
    {
      label: "All",
      href: withParams(query.q ? "/search" : "/products", query.sort),
      active: !query.collection,
    },
    ...collections.map((c) => ({
      label: c.title,
      href: withParams(c.path, query.sort),
      active: query.collection === c.handle,
    })),
  ];

  return (
    <section className="bg-canvas pb-32 text-fg md:pb-28">
      <header className="px-4 pb-8 pt-10 sm:px-8 sm:pt-14 md:px-12">
        <p className="label mb-5 text-fg-3">{eyebrow}</p>
        <h1 className="display break-words text-[clamp(3.6rem,15vw,12rem)]">
          {title}
        </h1>
        {intro ? (
          <p className="mt-6 max-w-[52ch] text-fg-2 sm:text-lg">{intro}</p>
        ) : null}
      </header>

      <div className="mb-8 flex items-center justify-between gap-6 border-y border-line">
        <ul className="rail label flex snap-x gap-2 overflow-x-auto px-4 py-3 sm:px-8 md:px-12">
          {collectionLinks.map((c) => (
            <li key={c.href} className="shrink-0 snap-start">
              <Link
                href={c.href}
                scroll={false}
                aria-current={c.active ? "page" : undefined}
                className={clsx(
                  "flex h-9 items-center border px-4 transition-colors",
                  c.active
                    ? "border-fg bg-fg text-canvas"
                    : "border-line hover:border-fg",
                )}
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="label hidden shrink-0 items-center gap-5 pr-12 md:flex">
          <li className="text-fg-3">Sort</li>
          {sorts.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                scroll={false}
                className={clsx(
                  "transition-opacity",
                  s.active
                    ? "underline underline-offset-4"
                    : "opacity-60 hover:opacity-100",
                )}
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-4 sm:px-8 md:px-12">
        {page.products.length ? (
          <ShopGrid
            key={`${query.q}|${query.sort}|${query.collection}`}
            initial={page}
            query={query}
          />
        ) : (
          <EmptyState term={query.q} />
        )}
      </div>

      {page.products.length ? (
        <ShopControls sorts={sorts} collections={collectionLinks} />
      ) : null}
    </section>
  );
}

function EmptyState({ term }: { term?: string }) {
  return (
    <div className="grid gap-10 border-t border-fg py-14 lg:grid-cols-2">
      <div>
        <p className="display text-[clamp(2.6rem,8vw,6rem)]">
          {term ? <>Nothing for &ldquo;{term}&rdquo;.</> : "Nothing here yet."}
        </p>
        <p className="mt-4 max-w-[40ch] text-fg-2">
          Try another word, or browse everything we&apos;ve made.
        </p>
        <Link href="/products" className={buttonClass("outline", "lg", "mt-8")}>
          Browse all designs
        </Link>
      </div>
      <div className="bg-fg p-8 text-canvas sm:p-10">
        <p className="label opacity-60">Can&apos;t find it?</p>
        <p className="display mt-4 text-[clamp(2.2rem,5vw,3.75rem)]">
          We can make it.
        </p>
        <p className="mt-4 max-w-[38ch] opacity-75">
          Send us a photo or describe the pair you want — we&apos;ll tell you
          what&apos;s possible and the price before anything is made.
        </p>
        <Link
          href="/custom-orders"
          className="mt-8 inline-flex h-12 items-center bg-canvas px-6 text-sm font-semibold uppercase tracking-wide text-fg transition-transform active:scale-[0.97]"
        >
          Start a custom order
        </Link>
      </div>
    </div>
  );
}
