"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  };

  const handleBulkAction = () => {
    if (selectedProducts.size === 0) {
      // Bulk Create - open empty editor
      router.push("/admin/products/bulk-edit");
    } else {
      // Bulk Edit - open with selected products
      const ids = Array.from(selectedProducts).join(",");
      router.push(`/admin/products/bulk-edit?ids=${ids}`);
    }
  };

  return (
    <div>
      {/* Selection Toolbar */}
      <div className="mb-4 flex items-center gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={
              selectedProducts.size === products.length && products.length > 0
            }
            onChange={toggleSelectAll}
            className="h-5 w-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Select All ({products.length})
          </span>
        </label>

        {selectedProducts.size > 0 && (
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {selectedProducts.size} selected
          </span>
        )}

        <button
          onClick={handleBulkAction}
          className={`ml-auto inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            selectedProducts.size === 0
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {selectedProducts.size === 0 ? (
            <>
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Bulk Create
            </>
          ) : (
            <>
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Bulk Edit ({selectedProducts.size})
            </>
          )}
        </button>

        {selectedProducts.size > 0 && (
          <button
            onClick={() => setSelectedProducts(new Set())}
            className="text-sm text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Products Table with Selection */}
      <ProductsTable
        products={products}
        selectedProducts={selectedProducts}
        onToggleProduct={toggleProduct}
      />
    </div>
  );
}
