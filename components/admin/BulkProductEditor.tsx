"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface Collection {
  id: string;
  title: string;
}

interface ProductRow {
  id: string;
  title: string;
  handle: string;
  description: string;
  price: string;
  availableForSale: boolean;
  tags: string;
  collections: string[];
  seoTitle: string;
  seoDescription: string;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

interface Column {
  key: keyof ProductRow;
  label: string;
  width: string;
  type: "text" | "textarea" | "number" | "checkbox" | "collections" | "tags";
  optional?: boolean;
}

const DEFAULT_COLUMNS: Column[] = [
  { key: "title", label: "Title", width: "200px", type: "text" },
  { key: "handle", label: "Handle", width: "150px", type: "text" },
  { key: "price", label: "Price (₦)", width: "120px", type: "number" },
  {
    key: "availableForSale",
    label: "Available",
    width: "100px",
    type: "checkbox",
  },
  {
    key: "collections",
    label: "Collections",
    width: "200px",
    type: "collections",
    optional: true,
  },
  { key: "tags", label: "Tags", width: "180px", type: "tags", optional: true },
  {
    key: "description",
    label: "Description",
    width: "250px",
    type: "textarea",
    optional: true,
  },
  {
    key: "seoTitle",
    label: "SEO Title",
    width: "200px",
    type: "text",
    optional: true,
  },
  {
    key: "seoDescription",
    label: "SEO Description",
    width: "250px",
    type: "textarea",
    optional: true,
  },
];

export default function BulkProductEditor() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof ProductRow>>(
    new Set(["title", "handle", "price", "availableForSale"]),
  );
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    column: keyof ProductRow;
  } | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState<{
    rowId: string;
    value: string;
  } | null>(null);
  const [showCollectionsModal, setShowCollectionsModal] = useState<{
    rowId: string;
    selected: string[];
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchCollections();
  }, [currentPage, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        perPage: "50",
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      const productsData = data.products || [];

      setProducts(
        productsData.map((p: any) => ({
          id: p.id,
          title: p.title || "",
          handle: p.handle || "",
          description: p.description || "",
          price: p.variants?.[0]?.price || "0",
          availableForSale: p.availableForSale ?? true,
          tags: p.tags?.join(", ") || "",
          collections:
            p.productCollections?.map((pc: any) => pc.collection.id) || [],
          seoTitle: p.seoTitle || "",
          seoDescription: p.seoDescription || "",
          isNew: false,
          isModified: false,
          isDeleted: false,
        })),
      );
      setTotalPages(Math.ceil((data.total || 0) / 50));
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/admin/collections?perPage=100");
      if (!response.ok) throw new Error("Failed to fetch collections");
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const addNewRow = () => {
    const newRow: ProductRow = {
      id: `new-${Date.now()}`,
      title: "",
      handle: "",
      description: "",
      price: "0",
      availableForSale: true,
      tags: "",
      collections: [],
      seoTitle: "",
      seoDescription: "",
      isNew: true,
      isModified: false,
      isDeleted: false,
    };
    setProducts([newRow, ...products]);
    toast.success("New row added");
  };

  const duplicateRows = () => {
    if (selectedRows.size === 0) {
      toast.error("Select rows to duplicate");
      return;
    }

    const duplicated = products
      .filter((p) => selectedRows.has(p.id))
      .map((p) => ({
        ...p,
        id: `dup-${Date.now()}-${Math.random()}`,
        title: `${p.title} (Copy)`,
        handle: `${p.handle}-copy-${Date.now()}`,
        isNew: true,
        isModified: false,
      }));

    setProducts([...duplicated, ...products]);
    setSelectedRows(new Set());
    toast.success(`${duplicated.length} row(s) duplicated`);
  };

  const deleteSelected = () => {
    if (selectedRows.size === 0) {
      toast.error("Select rows to delete");
      return;
    }

    if (!confirm(`Delete ${selectedRows.size} selected product(s)?`)) return;

    setProducts((prev) =>
      prev.map((p) => (selectedRows.has(p.id) ? { ...p, isDeleted: true } : p)),
    );
    setSelectedRows(new Set());
    toast.success("Marked for deletion");
  };

  const updateCell = (rowId: string, column: keyof ProductRow, value: any) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === rowId) {
          const updated = { ...p, [column]: value, isModified: !p.isNew };

          // Auto-generate handle from title
          if (column === "title" && !p.handle) {
            updated.handle = value
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "");
          }

          return updated;
        }
        return p;
      }),
    );
  };

  const saveAllChanges = async () => {
    const modifiedProducts = products.filter(
      (p) => (p.isNew || p.isModified) && !p.isDeleted,
    );
    const deletedProducts = products.filter((p) => p.isDeleted && !p.isNew);

    if (modifiedProducts.length === 0 && deletedProducts.length === 0) {
      toast.error("No changes to save");
      return;
    }

    // Validate required fields
    for (const p of modifiedProducts) {
      if (!p.title.trim()) {
        toast.error(
          `Product title is required (row with handle: ${p.handle || "empty"})`,
        );
        return;
      }
      if (!p.handle.trim()) {
        toast.error(`Product handle is required for: ${p.title}`);
        return;
      }
    }

    if (
      !confirm(
        `Save ${modifiedProducts.length} product(s) and delete ${deletedProducts.length} product(s)?`,
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      // Delete products
      for (const product of deletedProducts) {
        await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      }

      // Create/Update products
      for (const product of modifiedProducts) {
        const payload = {
          title: product.title,
          handle: product.handle,
          description: product.description,
          availableForSale: product.availableForSale,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          tags: product.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          collectionIds: product.collections,
          basePrice: parseFloat(product.price) || 0,
        };

        if (product.isNew) {
          await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          await fetch(`/api/admin/products/${product.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      }

      toast.success(
        `Saved ${modifiedProducts.length} product(s), deleted ${deletedProducts.length}`,
      );
      fetchProducts();
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const toggleColumnVisibility = (column: keyof ProductRow) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  };

  const toggleRowSelection = (rowId: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const selectAllRows = () => {
    if (selectedRows.size === products.filter((p) => !p.isDeleted).length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(
        new Set(products.filter((p) => !p.isDeleted).map((p) => p.id)),
      );
    }
  };

  const applyBulkAction = (
    action: "availability" | "collections",
    value: any,
  ) => {
    if (selectedRows.size === 0) {
      toast.error("Select rows first");
      return;
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (selectedRows.has(p.id)) {
          if (action === "availability") {
            return { ...p, availableForSale: value, isModified: !p.isNew };
          } else if (action === "collections") {
            return { ...p, collections: value, isModified: !p.isNew };
          }
        }
        return p;
      }),
    );

    toast.success(`Applied to ${selectedRows.size} product(s)`);
    setSelectedRows(new Set());
  };

  const renderCell = (product: ProductRow, column: Column) => {
    const isEditing =
      editingCell?.rowId === product.id && editingCell?.column === column.key;
    const value = product[column.key];

    if (column.type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={value as boolean}
          onChange={(e) => updateCell(product.id, column.key, e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      );
    }

    if (column.type === "collections") {
      const selectedCollections = (value as string[]) || [];
      return (
        <button
          onClick={() =>
            setShowCollectionsModal({
              rowId: product.id,
              selected: selectedCollections,
            })
          }
          className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 rounded hover:bg-purple-200 dark:hover:bg-purple-800 text-left w-full"
        >
          {selectedCollections.length > 0
            ? `${selectedCollections.length} selected`
            : "Select..."}
        </button>
      );
    }

    if (column.type === "textarea") {
      return (
        <button
          onClick={() =>
            setShowDescriptionModal({
              rowId: product.id,
              value: value as string,
            })
          }
          className="px-2 py-1 text-xs text-left w-full hover:bg-gray-100 dark:hover:bg-gray-700 rounded truncate"
        >
          {(value as string) || "Click to edit..."}
        </button>
      );
    }

    if (isEditing) {
      return (
        <input
          type={column.type}
          value={value as string}
          onChange={(e) => updateCell(product.id, column.key, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setEditingCell(null);
            if (e.key === "Escape") setEditingCell(null);
          }}
          autoFocus
          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none dark:bg-gray-800 dark:text-white"
        />
      );
    }

    return (
      <div
        onClick={() =>
          setEditingCell({ rowId: product.id, column: column.key })
        }
        className="px-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded truncate"
      >
        {(value as string) || <span className="text-gray-400">Empty</span>}
      </div>
    );
  };

  const modifiedCount = products.filter(
    (p) => (p.isNew || p.isModified) && !p.isDeleted,
  ).length;
  const deletedCount = products.filter((p) => p.isDeleted).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-3">
          {/* Actions */}
          <button
            onClick={addNewRow}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
          >
            + Add Row
          </button>

          <button
            onClick={duplicateRows}
            disabled={selectedRows.size === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Duplicate Selected
          </button>

          <button
            onClick={deleteSelected}
            disabled={selectedRows.size === 0}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Delete Selected
          </button>

          <div className="border-l border-gray-300 dark:border-gray-600 h-8"></div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Bulk:
            </span>
            <button
              onClick={() => applyBulkAction("availability", true)}
              disabled={selectedRows.size === 0}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Set Available
            </button>
            <button
              onClick={() => applyBulkAction("availability", false)}
              disabled={selectedRows.size === 0}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Set Unavailable
            </button>
          </div>

          <div className="border-l border-gray-300 dark:border-gray-600 h-8"></div>

          {/* Column Selector */}
          <div className="relative group">
            <button className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
              Columns ▼
            </button>
            <div className="absolute left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg p-2 hidden group-hover:block z-10 min-w-[200px]">
              {DEFAULT_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(col.key)}
                    onChange={() => toggleColumnVisibility(col.key)}
                    className="rounded"
                  />
                  <span className="text-sm">{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {(modifiedCount > 0 || deletedCount > 0) && (
              <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                {modifiedCount} changed, {deletedCount} to delete
              </span>
            )}

            <button
              onClick={saveAllChanges}
              disabled={saving || (modifiedCount === 0 && deletedCount === 0)}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {saving ? "Saving..." : "Save All Changes"}
            </button>

            <Link
              href="/admin/products"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <input
          type="search"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div ref={containerRef} className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading products...
                </p>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                <tr>
                  <th className="w-10 px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedRows.size ===
                          products.filter((p) => !p.isDeleted).length &&
                        products.length > 0
                      }
                      onChange={selectAllRows}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  {DEFAULT_COLUMNS.filter((col) =>
                    visibleColumns.has(col.key),
                  ).map((col) => (
                    <th
                      key={col.key}
                      style={{ minWidth: col.width, maxWidth: col.width }}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {col.label}
                      {col.optional && (
                        <span className="ml-1 text-gray-400">(opt)</span>
                      )}
                    </th>
                  ))}
                  <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {products
                  .filter((p) => !p.isDeleted)
                  .map((product) => (
                    <tr
                      key={product.id}
                      className={`${
                        selectedRows.has(product.id)
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : ""
                      } ${product.isNew ? "bg-green-50 dark:bg-green-900/20" : ""} ${
                        product.isModified
                          ? "bg-amber-50 dark:bg-amber-900/20"
                          : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(product.id)}
                          onChange={() => toggleRowSelection(product.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      {DEFAULT_COLUMNS.filter((col) =>
                        visibleColumns.has(col.key),
                      ).map((col) => (
                        <td
                          key={col.key}
                          style={{ minWidth: col.width, maxWidth: col.width }}
                          className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                        >
                          {renderCell(product, col)}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-xs">
                        {product.isNew && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                            New
                          </span>
                        )}
                        {product.isModified && !product.isNew && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded">
                            Modified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              Edit Description
            </h3>
            <textarea
              value={showDescriptionModal.value}
              onChange={(e) =>
                setShowDescriptionModal({
                  ...showDescriptionModal,
                  value: e.target.value,
                })
              }
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowDescriptionModal(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateCell(
                    showDescriptionModal.rowId,
                    "description",
                    showDescriptionModal.value,
                  );
                  setShowDescriptionModal(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collections Modal */}
      {showCollectionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              Select Collections
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {collections.map((col) => (
                <label
                  key={col.id}
                  className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <input
                    type="checkbox"
                    checked={showCollectionsModal.selected.includes(col.id)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...showCollectionsModal.selected, col.id]
                        : showCollectionsModal.selected.filter(
                            (id) => id !== col.id,
                          );
                      setShowCollectionsModal({
                        ...showCollectionsModal,
                        selected: updated,
                      });
                    }}
                    className="rounded"
                  />
                  <span className="text-sm dark:text-white">{col.title}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowCollectionsModal(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateCell(
                    showCollectionsModal.rowId,
                    "collections",
                    showCollectionsModal.selected,
                  );
                  setShowCollectionsModal(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
