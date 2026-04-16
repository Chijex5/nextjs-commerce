"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  title: string;
  handle: string;
  availableForSale: boolean;
  images: { url: string; altText: string | null }[];
  variants: { price: any; currencyCode: string }[];
  productCollections?: { collection: { id: string; title: string } }[];
  _count: { variants: number };
};

function ProductImage({
  product,
  size = "sm",
}: {
  product: Product;
  size?: "sm" | "lg";
}) {
  const dim = size === "sm" ? 40 : 64;
  const cls = size === "sm" ? "h-10 w-10" : "h-16 w-16";

  return (
    <div
      className={`${cls} flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800`}
    >
      {product.images[0] ? (
        <Image
          src={product.images[0].url}
          alt={product.images[0].altText || product.title}
          width={dim}
          height={dim}
          className={`${cls} object-cover`}
        />
      ) : (
        <div className={`flex ${cls} items-center justify-center`}>
          <svg
            className="h-5 w-5 text-neutral-300 dark:text-neutral-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        active
          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          : "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-green-500" : "bg-red-500"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function CollectionChips({
  collections,
}: {
  collections: { collection: { id: string; title: string } }[];
}) {
  if (!collections || collections.length === 0) {
    return <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {collections.slice(0, 2).map((pc) => (
        <span
          key={pc.collection.id}
          className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
        >
          {pc.collection.title}
        </span>
      ))}
      {collections.length > 2 && (
        <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-400 dark:bg-neutral-800">
          +{collections.length - 2}
        </span>
      )}
    </div>
  );
}

export default function ProductsTable({
  products,
  selectedProducts,
  onToggleProduct,
}: {
  products: Product[];
  selectedProducts?: Set<string>;
  onToggleProduct?: (id: string) => void;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const res = await fetch(`/api/admin/products/duplicate/${id}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Failed to duplicate product");
    } finally {
      setDuplicatingId(null);
    }
  };

  // ── Empty State ──
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-white py-20 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <svg
            className="h-7 w-7 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          No products found
        </h3>
        <p className="mt-1 text-sm text-neutral-400">
          Add your first product to get started.
        </p>
        <Link
          href="/admin/products/new"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Product
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop Table ── */}
      <div className="hidden overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:block">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800">
              {selectedProducts !== undefined && (
                <th className="w-10 px-4 py-3" />
              )}
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
                Product
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
                Collections
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
                Price
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
                Variants
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {products.map((product) => (
              <tr
                key={product.id}
                className={`group transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60 ${
                  selectedProducts?.has(product.id)
                    ? "bg-neutral-50 dark:bg-neutral-800/40"
                    : ""
                }`}
              >
                {selectedProducts !== undefined && onToggleProduct && (
                  <td className="w-10 px-4 py-3.5">
                    <div
                      className={`flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded border transition-colors ${
                        selectedProducts.has(product.id)
                          ? "border-neutral-900 bg-neutral-900 dark:border-neutral-100 dark:bg-neutral-100"
                          : "border-neutral-300 bg-white group-hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-800"
                      }`}
                      onClick={() => onToggleProduct(product.id)}
                    >
                      {selectedProducts.has(product.id) && (
                        <svg
                          className="h-2.5 w-2.5 text-white dark:text-neutral-900"
                          fill="none"
                          viewBox="0 0 12 12"
                          strokeWidth="2.5"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 6l3 3 6-6" />
                        </svg>
                      )}
                    </div>
                  </td>
                )}

                {/* Product */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <ProductImage product={product} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {product.title}
                      </p>
                      <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">
                        /{product.handle}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-5 py-3.5">
                  <StatusBadge active={product.availableForSale} />
                </td>

                {/* Collections */}
                <td className="px-5 py-3.5">
                  <CollectionChips
                    collections={product.productCollections || []}
                  />
                </td>

                {/* Price */}
                <td className="px-5 py-3.5">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {product.variants[0]
                      ? `${product.variants[0].currencyCode} ${Number(product.variants[0].price).toLocaleString()}`
                      : <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                  </span>
                </td>

                {/* Variants */}
                <td className="px-5 py-3.5">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {product._count.variants}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDuplicate(product.id)}
                      disabled={duplicatingId === product.id}
                      className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-40 dark:hover:text-neutral-100"
                    >
                      {duplicatingId === product.id ? "…" : "Duplicate"}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.title)}
                      disabled={deletingId === product.id}
                      className="text-xs font-medium text-red-500 transition-colors hover:text-red-700 disabled:opacity-40 dark:text-red-400 dark:hover:text-red-300"
                    >
                      {deletingId === product.id ? "…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile / Tablet Cards ── */}
      <div className="space-y-3 lg:hidden">
        {products.map((product) => (
          <div
            key={product.id}
            className={`overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-neutral-900 ${
              selectedProducts?.has(product.id)
                ? "border-neutral-400 dark:border-neutral-500"
                : "border-neutral-200 dark:border-neutral-800"
            }`}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                {selectedProducts !== undefined && onToggleProduct && (
                  <div
                    className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded border transition-colors ${
                      selectedProducts.has(product.id)
                        ? "border-neutral-900 bg-neutral-900 dark:border-neutral-100 dark:bg-neutral-100"
                        : "border-neutral-300 dark:border-neutral-600"
                    }`}
                    onClick={() => onToggleProduct(product.id)}
                  >
                    {selectedProducts.has(product.id) && (
                      <svg
                        className="h-2.5 w-2.5 text-white dark:text-neutral-900"
                        fill="none"
                        viewBox="0 0 12 12"
                        strokeWidth="2.5"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 6l3 3 6-6" />
                      </svg>
                    )}
                  </div>
                )}

                <ProductImage product={product} size="lg" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {product.title}
                      </p>
                      <p className="truncate text-xs text-neutral-400">
                        /{product.handle}
                      </p>
                    </div>
                    <StatusBadge active={product.availableForSale} />
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    {product.variants[0] && (
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {product.variants[0].currencyCode}{" "}
                        {Number(product.variants[0].price).toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs text-neutral-400">
                      {product._count.variants} variant{product._count.variants !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {product.productCollections &&
                    product.productCollections.length > 0 && (
                      <div className="mt-2">
                        <CollectionChips
                          collections={product.productCollections}
                        />
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="flex items-center gap-1 border-t border-neutral-100 bg-neutral-50 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-800/50">
              <Link
                href={`/admin/products/${product.id}/edit`}
                className="flex-1 rounded-lg px-3 py-1.5 text-center text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Edit
              </Link>
              <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
              <button
                onClick={() => handleDuplicate(product.id)}
                disabled={duplicatingId === product.id}
                className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                {duplicatingId === product.id ? "Duplicating…" : "Duplicate"}
              </button>
              <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
              <button
                onClick={() => handleDelete(product.id, product.title)}
                disabled={deletingId === product.id}
                className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {deletingId === product.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}