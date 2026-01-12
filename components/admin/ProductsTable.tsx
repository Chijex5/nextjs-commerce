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

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete product");
      }

      router.refresh();
    } catch (error) {
      alert("Failed to delete product");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/duplicate/${id}`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to duplicate product");
      }

      router.refresh();
    } catch (error) {
      alert("Failed to duplicate product");
      console.error(error);
    }
  };

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <svg
          className="mx-auto h-12 w-12 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          No products found
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Get started by creating a new product.
        </p>
        <div className="mt-6">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Add Product
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 md:block">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
          <thead className="bg-neutral-50 dark:bg-neutral-800">
            <tr>
              {selectedProducts !== undefined && (
                <th className="w-12 px-3 py-3"></th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Collections
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Variants
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                {selectedProducts !== undefined && onToggleProduct && (
                  <td className="w-12 px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => onToggleProduct(product.id)}
                      className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.images[0].altText || product.title}
                          width={40}
                          height={40}
                          className="h-10 w-10 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center text-neutral-400">
                          <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {product.title}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {product.handle}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      product.availableForSale
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {product.availableForSale ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {product.productCollections && product.productCollections.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {product.productCollections.slice(0, 2).map((pc) => (
                        <span
                          key={pc.collection.id}
                          className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        >
                          {pc.collection.title}
                        </span>
                      ))}
                      {product.productCollections.length > 2 && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          +{product.productCollections.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-400">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100">
                  {product.variants[0]
                    ? `${product.variants[0].currencyCode} ${Number(product.variants[0].price).toLocaleString()}`
                    : "—"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {product._count.variants}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDuplicate(product.id)}
                      className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.title)}
                      disabled={deletingId === product.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                    >
                      {deletingId === product.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 md:hidden">
        {products.map((product) => (
          <div
            key={product.id}
            className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="p-4">
              <div className="flex items-start gap-4">
                {selectedProducts !== undefined && onToggleProduct && (
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => onToggleProduct(product.id)}
                    className="mt-1 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                )}
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].altText || product.title}
                      width={64}
                      height={64}
                      className="h-16 w-16 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center text-neutral-400">
                      <svg
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {product.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {product.handle}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        product.availableForSale
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {product.availableForSale ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {product._count.variants} variants
                    </span>
                  </div>
                  {product.productCollections && product.productCollections.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.productCollections.map((pc) => (
                        <span
                          key={pc.collection.id}
                          className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        >
                          {pc.collection.title}
                        </span>
                      ))}
                    </div>
                  )}
                  {product.variants[0] && (
                    <p className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {product.variants[0].currencyCode}{" "}
                      {Number(product.variants[0].price).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800">
              <div className="flex gap-3 text-sm">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDuplicate(product.id)}
                  className="font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => handleDelete(product.id, product.title)}
                  disabled={deletingId === product.id}
                  className="font-medium text-red-600 hover:text-red-900 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                >
                  {deletingId === product.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
