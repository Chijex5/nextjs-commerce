"use client";

import clsx from "clsx";
import { EmptyState, StatusPill } from "components/admin/ui";
import { money } from "lib/admin/format";
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

export type ProductRow = {
  id: string;
  title: string;
  handle: string;
  active: boolean;
  image: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  variants: number;
  collections: string[];
  sold30d: number;
  revenue30d: number;
  issues: string[];
  updatedAt: string;
};

function priceLabel(p: ProductRow) {
  if (p.minPrice === null) return "—";
  if (p.maxPrice !== null && p.maxPrice !== p.minPrice)
    return `${money(p.minPrice)} – ${money(p.maxPrice)}`;
  return money(p.minPrice);
}

export function ProductsList({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const refresh = () => startTransition(() => router.refresh());
  const allSelected = products.length > 0 && selected.size === products.length;
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function setAvailability(ids: string[], active: boolean) {
    setBusy(active ? "show" : "hide");
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/admin/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ availableForSale: active }),
        }).then((r) => {
          if (!r.ok) throw new Error();
        }),
      ),
    );
    setBusy(null);
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed) toast.error(`${failed} product(s) couldn't be updated.`);
    else
      toast.success(
        `${ids.length} ${ids.length === 1 ? "product" : "products"} ${active ? "now in the shop" : "hidden from the shop"}.`,
      );
    setSelected(new Set());
    refresh();
  }

  async function duplicate(id: string) {
    setBusy(`dup-${id}`);
    const res = await fetch(`/api/admin/products/duplicate/${id}`, {
      method: "POST",
    });
    setBusy(null);
    if (!res.ok) return toast.error("Couldn't duplicate the product.");
    const data = await res.json().catch(() => null);
    toast.success("Duplicated. Opening the copy.");
    if (data?.product?.id)
      router.push(`/admin/products/${data.product.id}/edit`);
    else refresh();
  }

  async function remove(p: ProductRow) {
    if (
      !window.confirm(
        `Delete "${p.title}"? This can't be undone. Past orders keep their line items.`,
      )
    )
      return;
    setBusy(`del-${p.id}`);
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: "DELETE",
    });
    setBusy(null);
    if (!res.ok) return toast.error("Couldn't delete the product.");
    toast.success(`Deleted "${p.title}".`);
    refresh();
  }

  if (products.length === 0) {
    return (
      <div className="border border-line px-5">
        <EmptyState title="No products match">
          Try a different search, view or collection.
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      {selected.size > 0 ? (
        <div className="sticky top-14 z-30 mb-px flex flex-wrap items-center gap-2 border border-fg bg-fg px-3 py-2 text-canvas lg:top-16">
          <span className="mr-2 text-sm font-medium tabular-nums">
            {selected.size} selected
          </span>
          <BarButton
            onClick={() => setAvailability([...selected], true)}
            disabled={!!busy}
          >
            <Eye className="size-3.5" /> Show in shop
          </BarButton>
          <BarButton
            onClick={() => setAvailability([...selected], false)}
            disabled={!!busy}
          >
            <EyeOff className="size-3.5" /> Hide
          </BarButton>
          <Link
            href={`/admin/products/bulk-edit?ids=${encodeURIComponent([...selected].join(","))}`}
            className="flex h-8 items-center gap-1.5 border border-canvas/40 px-3 font-mono text-[11px] uppercase tracking-wide hover:bg-canvas hover:text-fg"
          >
            <Pencil className="size-3.5" /> Bulk edit
          </Link>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto flex h-8 items-center gap-1 px-2 font-mono text-[11px] uppercase tracking-wide opacity-80 hover:opacity-100"
          >
            <X className="size-3.5" /> Clear
          </button>
        </div>
      ) : null}

      <div className="border border-line">
        <div className="products-grid hidden items-center gap-3 border-b border-line py-2.5 pl-4 pr-2 text-left text-fg-3 md:grid">
          <input
            type="checkbox"
            aria-label="Select all products on this page"
            checked={allSelected}
            onChange={() =>
              setSelected(
                allSelected ? new Set() : new Set(products.map((p) => p.id)),
              )
            }
            className="size-4"
          />
          <span className="label">Product</span>
          <span className="label">Status</span>
          <span className="label">Price</span>
          <span className="label">Collections</span>
          <span className="label text-right">Sold · 30d</span>
          <span />
        </div>

        <ul className="divide-y divide-line">
          {products.map((p) => (
            <li
              key={p.id}
              className={clsx(
                "products-grid group relative grid items-center gap-3 py-3 pl-4 pr-2 transition-colors",
                selected.has(p.id) ? "bg-plate" : "hover:bg-plate/60",
              )}
            >
              <input
                type="checkbox"
                aria-label={`Select ${p.title}`}
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
                className="relative z-10 size-4"
              />

              <div className="flex min-w-0 items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden bg-plate">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="block truncate text-sm font-medium text-fg after:absolute after:inset-0"
                  >
                    {p.title}
                  </Link>
                  <p className="truncate text-xs text-fg-3">
                    {p.issues.length ? (
                      <span className="text-amber-700 dark:text-amber-400">
                        {p.issues.join(" · ")}
                      </span>
                    ) : (
                      <>
                        {p.variants} {p.variants === 1 ? "variant" : "variants"}
                        <span className="md:hidden"> · {priceLabel(p)}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="relative z-10 hidden md:block">
                <button
                  type="button"
                  onClick={() => setAvailability([p.id], !p.active)}
                  disabled={!!busy}
                  title={
                    p.active
                      ? "Click to hide from the shop"
                      : "Click to show in the shop"
                  }
                  className="disabled:opacity-50"
                >
                  <StatusPill tone={p.active ? "positive" : "neutral"}>
                    {p.active ? "Active" : "Hidden"}
                  </StatusPill>
                </button>
              </div>

              <span className="hidden truncate text-sm tabular-nums text-fg-2 md:block">
                {priceLabel(p)}
              </span>

              <span className="hidden truncate text-xs text-fg-3 md:block">
                {p.collections.length ? p.collections.join(", ") : "—"}
              </span>

              <div className="hidden text-right md:block">
                <p className="text-sm font-medium tabular-nums">
                  {p.sold30d ? `${p.sold30d} pairs` : "—"}
                </p>
                {p.revenue30d ? (
                  <p className="text-xs text-fg-3 tabular-nums">
                    {money(p.revenue30d)}
                  </p>
                ) : null}
              </div>

              <RowMenu
                product={p}
                busy={busy}
                onToggle={() => setAvailability([p.id], !p.active)}
                onDuplicate={() => duplicate(p.id)}
                onDelete={() => remove(p)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function BarButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="flex h-8 items-center gap-1.5 border border-canvas/40 px-3 font-mono text-[11px] uppercase tracking-wide hover:bg-canvas hover:text-fg disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function RowMenu({
  product,
  busy,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  product: ProductRow;
  busy: string | null;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === "Escape"
          : !ref.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item =
    "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-fg hover:text-canvas disabled:opacity-50";

  return (
    <div ref={ref} className="relative z-20 justify-self-end">
      <button
        type="button"
        aria-label={`Actions for ${product.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 place-items-center text-fg-3 hover:bg-plate hover:text-fg"
      >
        {busy?.endsWith(product.id) ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <MoreHorizontal className="size-4" />
        )}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-52 border border-line bg-canvas py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          <Link
            role="menuitem"
            href={`/admin/products/${product.id}/edit`}
            className={item}
          >
            <Pencil className="size-4" /> Edit
          </Link>
          <a
            role="menuitem"
            href={`/product/${product.handle}`}
            target="_blank"
            rel="noreferrer"
            className={item}
          >
            <ExternalLink className="size-4" /> View in shop
          </a>
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={() => {
              setOpen(false);
              onToggle();
            }}
          >
            {product.active ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
            {product.active ? "Hide from shop" : "Show in shop"}
          </button>
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
          >
            <Copy className="size-4" /> Duplicate
          </button>
          <button
            role="menuitem"
            type="button"
            className={clsx(
              item,
              "text-red-700 hover:!bg-red-600 hover:!text-white dark:text-red-400",
            )}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="size-4" /> Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
