"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ProductsTable from "./ProductsTable";

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

export default function ProductsListWithSelection({
  products,
}: {
  products: Product[];
}) {
  const router = useRouter();
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  );

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedProducts((prev) => {
      if (prev.size === products.length) {
        return new Set();
      }
      return new Set(products.map((p) => p.id));
    });
  };

  const handleBulkAction = () => {
    if (selectedProducts.size === 0) {
      router.push("/admin/products/bulk-edit");
    } else {
      const ids = Array.from(selectedProducts).join(",");
      router.push(`/admin/products/bulk-edit?ids=${encodeURIComponent(ids)}`);
    }
  };

  const allSelected =
    selectedProducts.size === products.length && products.length > 0;
  const someSelected = selectedProducts.size > 0;

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {/* Select All Checkbox */}
        <label className="flex cursor-pointer items-center gap-2.5">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="peer sr-only"
            />
            <div
              className={`flex h-4.5 h-[18px] w-[18px] items-center justify-center rounded border transition-colors ${
                allSelected
                  ? "border-neutral-900 bg-neutral-900 dark:border-neutral-100 dark:bg-neutral-100"
                  : "border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800"
              }`}
            >
              {allSelected && (
                <svg
                  className="h-2.5 w-2.5 text-white dark:text-neutral-900"
                  fill="none"
                  viewBox="0 0 12 12"
                  strokeWidth="2.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M1.5 6l3 3 6-6"
                  />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {allSelected ? "Deselect all" : `Select all (${products.length})`}
          </span>
        </label>

        {/* Selection count pill */}
        {someSelected && (
          <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
            {selectedProducts.size} selected
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Clear */}
        {someSelected && (
          <button
            onClick={() => setSelectedProducts(new Set())}
            className="text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            Clear
          </button>
        )}

        {/* Action button */}
        <button
          onClick={handleBulkAction}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            someSelected
              ? "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
              : "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          }`}
        >
          {someSelected ? (
            <>
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              Bulk Edit ({selectedProducts.size})
            </>
          ) : (
            <>
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Bulk Create
            </>
          )}
        </button>
      </div>

      {/* ── Products Table ── */}
      <ProductsTable
        products={products}
        selectedProducts={selectedProducts}
        onToggleProduct={toggleProduct}
      />
    </div>
  );
}
