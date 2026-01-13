"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface Collection {
  id: string;
  title: string;
}

interface ProductVariant {
  id: string;
  title: string;
  price: string;
  availableForSale: boolean;
  selectedOptions: Array<{ name: string; value: string }>;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
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
  variants: ProductVariant[];
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
  isExpanded?: boolean;
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

interface BulkProductEditorProps {
  selectedIds?: string[];
}

export default function BulkProductEditor({
  selectedIds = [],
}: BulkProductEditorProps) {
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
  const [showVariantsModal, setShowVariantsModal] = useState<{
    productId: string;
    variants: ProductVariant[];
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("BulkProductEditor useEffect triggered");
    console.log("selectedIds:", selectedIds);
    console.log("selectedIds.length:", selectedIds.length);

    if (selectedIds.length > 0) {
      console.log("Calling fetchSelectedProducts with IDs:", selectedIds);
      fetchSelectedProducts();
    } else {
      console.log("Calling fetchProducts (no selected IDs)");
      fetchProducts();
    }
    fetchCollections();
  }, [selectedIds, currentPage, searchTerm]);

  const fetchSelectedProducts = async () => {
    try {
      console.log("fetchSelectedProducts started");
      console.log("selectedIds in fetch function:", selectedIds);
      setLoading(true);

      // Fetch each selected product by ID
      const promises = selectedIds.map((id) => {
        console.log(`Fetching product with ID: ${id}`);
        return fetch(`/api/admin/products/${id}`).then((res) => {
          console.log(`Response for ${id}:`, res.status);
          return res.json();
        });
      });

      const results = await Promise.all(promises);
      console.log("Fetch results:", results);

      // API returns product directly, not wrapped in {product: ...}
      const productsData = results.filter(Boolean);
      console.log("Products data after filtering:", productsData);
      console.log("Number of products loaded:", productsData.length);

      const mappedProducts = productsData.map((p: any) => ({
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
        variants:
          p.variants?.map((v: any) => ({
            id: v.id,
            title: v.title,
            price: v.price.toString(),
            availableForSale: v.availableForSale,
            selectedOptions: v.selectedOptions || [],
            isNew: false,
            isModified: false,
            isDeleted: false,
          })) || [],
        isNew: false,
        isModified: false,
        isDeleted: false,
        isExpanded: false,
      }));

      console.log("Mapped products:", mappedProducts);
      setProducts(mappedProducts);
      setTotalPages(1); // Only one page when showing selected products
      console.log("Products state should be updated");
    } catch (error) {
      console.error("Error fetching selected products:", error);
      toast.error("Failed to load selected products");
    } finally {
      setLoading(false);
      console.log("Loading set to false");
    }
  };

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
          variants:
            p.variants?.map((v: any) => ({
              id: v.id,
              title: v.title,
              price: v.price.toString(),
              availableForSale: v.availableForSale,
              selectedOptions: v.selectedOptions || [],
              isNew: false,
              isModified: false,
              isDeleted: false,
            })) || [],
          isNew: false,
          isModified: false,
          isDeleted: false,
          isExpanded: false,
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
      variants: [
        {
          id: `new-variant-${crypto.randomUUID()}`,
          title: "Default",
          price: "0",
          availableForSale: true,
          selectedOptions: [],
          isNew: true,
          isModified: false,
          isDeleted: false,
        },
      ],
      isNew: true,
      isModified: false,
      isDeleted: false,
      isExpanded: false,
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

  const toggleExpand = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, isExpanded: !p.isExpanded } : p,
      ),
    );
  };

  const openVariantsModal = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setShowVariantsModal({
        productId,
        variants: [...product.variants],
      });
    }
  };

  const updateVariant = (
    productId: string,
    variantId: string,
    field: keyof ProductVariant,
    value: any,
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            variants: p.variants.map((v) =>
              v.id === variantId
                ? { ...v, [field]: value, isModified: !v.isNew }
                : v,
            ),
            isModified: !p.isNew,
          };
        }
        return p;
      }),
    );
  };

  const addVariant = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newVariant: ProductVariant = {
            id: `new-variant-${crypto.randomUUID()}`,
            title: "New Variant",
            price: p.price || "0",
            availableForSale: true,
            selectedOptions: [],
            isNew: true,
            isModified: false,
            isDeleted: false,
          };
          return {
            ...p,
            variants: [...p.variants, newVariant],
            isModified: !p.isNew,
          };
        }
        return p;
      }),
    );
    toast.success("Variant added");
  };

  const deleteVariant = (productId: string, variantId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            variants: p.variants.map((v) =>
              v.id === variantId ? { ...v, isDeleted: true } : v,
            ),
            isModified: !p.isNew,
          };
        }
        return p;
      }),
    );
    toast.success("Variant marked for deletion");
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
          const response = await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const createdProduct = await response.json();
            // Create variants for new product if any exist
            const variantChanges = product.variants.some(
              (v) => v.isNew || v.isModified || v.isDeleted,
            );
            if (variantChanges && createdProduct.id) {
              await fetch(`/api/admin/products/${createdProduct.id}/variants`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ variants: product.variants }),
              });
            }
          }
        } else {
          await fetch(`/api/admin/products/${product.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          // Update variants if they have changes
          const variantChanges = product.variants.some(
            (v) => v.isNew || v.isModified || v.isDeleted,
          );
          if (variantChanges) {
            await fetch(`/api/admin/products/${product.id}/variants`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ variants: product.variants }),
            });
          }
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
                  <th className="w-10 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"></th>
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
                  <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Variants
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {products
                  .filter((p) => !p.isDeleted)
                  .map((product) => (
                    <>
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
                        <td className="px-3 py-2">
                          <button
                            onClick={() => toggleExpand(product.id)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            title="Toggle variants"
                          >
                            {product.isExpanded ? "▼" : "▶"}
                          </button>
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
                        <td className="px-3 py-2 text-xs">
                          <button
                            onClick={() => openVariantsModal(product.id)}
                            className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800"
                          >
                            {
                              product.variants.filter((v) => !v.isDeleted)
                                .length
                            }{" "}
                            variant(s)
                          </button>
                        </td>
                      </tr>
                      {product.isExpanded &&
                        product.variants
                          .filter((v) => !v.isDeleted)
                          .map((variant) => (
                            <tr
                              key={variant.id}
                              className="bg-gray-50 dark:bg-gray-800/50 border-l-4 border-purple-400"
                            >
                              <td className="px-3 py-2"></td>
                              <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                                ↳
                              </td>
                              <td
                                colSpan={
                                  DEFAULT_COLUMNS.filter((col) =>
                                    visibleColumns.has(col.key),
                                  ).length
                                }
                                className="px-3 py-2"
                              >
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex-1">
                                    <label className="text-xs text-gray-500 dark:text-gray-400">
                                      Title:
                                    </label>
                                    <input
                                      type="text"
                                      value={variant.title}
                                      onChange={(e) =>
                                        updateVariant(
                                          product.id,
                                          variant.id,
                                          "title",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                    />
                                  </div>
                                  <div className="w-32">
                                    <label className="text-xs text-gray-500 dark:text-gray-400">
                                      Price (₦):
                                    </label>
                                    <input
                                      type="number"
                                      value={variant.price}
                                      onChange={(e) =>
                                        updateVariant(
                                          product.id,
                                          variant.id,
                                          "price",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-500 dark:text-gray-400">
                                      Available:
                                    </label>
                                    <input
                                      type="checkbox"
                                      checked={variant.availableForSale}
                                      onChange={(e) =>
                                        updateVariant(
                                          product.id,
                                          variant.id,
                                          "availableForSale",
                                          e.target.checked,
                                        )
                                      }
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                  </div>
                                  <button
                                    onClick={() =>
                                      deleteVariant(product.id, variant.id)
                                    }
                                    className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 text-xs"
                                    title="Delete variant"
                                  >
                                    Delete
                                  </button>
                                  {variant.isNew && (
                                    <span className="text-xs text-green-600 dark:text-green-400">
                                      New
                                    </span>
                                  )}
                                  {variant.isModified && !variant.isNew && (
                                    <span className="text-xs text-amber-600 dark:text-amber-400">
                                      Modified
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2"></td>
                              <td className="px-3 py-2"></td>
                            </tr>
                          ))}
                      {product.isExpanded && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2"></td>
                          <td
                            colSpan={
                              DEFAULT_COLUMNS.filter((col) =>
                                visibleColumns.has(col.key),
                              ).length + 3
                            }
                            className="px-3 py-2"
                          >
                            <button
                              onClick={() => addVariant(product.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                            >
                              + Add Variant
                            </button>
                          </td>
                        </tr>
                      )}
                    </>
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

      {/* Variants Modal */}
      {showVariantsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              Manage Variants
            </h3>
            <div className="space-y-3">
              {showVariantsModal.variants
                .filter((v) => !v.isDeleted)
                .map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={variant.title}
                        onChange={(e) => {
                          setShowVariantsModal({
                            ...showVariantsModal,
                            variants: showVariantsModal.variants.map((v) =>
                              v.id === variant.id
                                ? {
                                    ...v,
                                    title: e.target.value,
                                    isModified: !v.isNew,
                                  }
                                : v,
                            ),
                          });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div className="w-32">
                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        Price (₦)
                      </label>
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => {
                          setShowVariantsModal({
                            ...showVariantsModal,
                            variants: showVariantsModal.variants.map((v) =>
                              v.id === variant.id
                                ? {
                                    ...v,
                                    price: e.target.value,
                                    isModified: !v.isNew,
                                  }
                                : v,
                            ),
                          });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        Available
                      </label>
                      <input
                        type="checkbox"
                        checked={variant.availableForSale}
                        onChange={(e) => {
                          setShowVariantsModal({
                            ...showVariantsModal,
                            variants: showVariantsModal.variants.map((v) =>
                              v.id === variant.id
                                ? {
                                    ...v,
                                    availableForSale: e.target.checked,
                                    isModified: !v.isNew,
                                  }
                                : v,
                            ),
                          });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setShowVariantsModal({
                          ...showVariantsModal,
                          variants: showVariantsModal.variants.map((v) =>
                            v.id === variant.id ? { ...v, isDeleted: true } : v,
                          ),
                        });
                      }}
                      className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 text-xs"
                      title="Delete variant"
                    >
                      Delete
                    </button>
                    {variant.isNew && (
                      <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">
                        New
                      </span>
                    )}
                    {variant.isModified && !variant.isNew && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        Modified
                      </span>
                    )}
                  </div>
                ))}
              <button
                onClick={() => {
                  const newVariant: ProductVariant = {
                    id: `new-variant-${crypto.randomUUID()}`,
                    title: "New Variant",
                    price: "0",
                    availableForSale: true,
                    selectedOptions: [],
                    isNew: true,
                    isModified: false,
                    isDeleted: false,
                  };
                  setShowVariantsModal({
                    ...showVariantsModal,
                    variants: [...showVariantsModal.variants, newVariant],
                  });
                }}
                className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                + Add Variant
              </button>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowVariantsModal(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setProducts((prev) =>
                    prev.map((p) =>
                      p.id === showVariantsModal.productId
                        ? {
                            ...p,
                            variants: showVariantsModal.variants,
                            isModified: !p.isNew,
                          }
                        : p,
                    ),
                  );
                  setShowVariantsModal(null);
                  toast.success("Variants updated");
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
