"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";
import {
  generateSeoDescription,
  generateSeoTitle,
  generateSlug,
} from "@/lib/admin-utils";
import {
  PRODUCT_IMAGE_HEIGHT,
  PRODUCT_IMAGE_WIDTH,
} from "@/lib/image-constants";

interface Collection {
  id: string;
  title: string;
}

interface ImageUpload {
  url: string;
  position: number;
  isFeatured: boolean;
  width: number;
  height: number;
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
  descriptionHtml: string;
  price: string;
  availableForSale: boolean;
  tags: string;
  collections: string[];
  seoTitle: string;
  seoDescription: string;
  variants: ProductVariant[];
  images: ImageUpload[];
  sizeFrom: string;
  sizeTo: string;
  colors: string;
  sizePriceRules: Array<{ from: string; price: string }>;
  largeSizeFrom: string;
  largeSizePrice: string;
  colorPriceRules: Array<{ color: string; price: string }>;
  generateVariants: boolean;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

interface Column {
  key: keyof ProductRow;
  label: string;
  width: string;
  type: "text" | "number" | "checkbox" | "collections" | "tags" | "richtext";
  optional?: boolean;
}

const DEFAULT_COLUMNS: Column[] = [
  { key: "title", label: "Title", width: "240px", type: "text" },
  {
    key: "price",
    label: "Base Price (NGN)",
    width: "160px",
    type: "number",
  },
  {
    key: "description",
    label: "Description",
    width: "260px",
    type: "richtext",
    optional: true,
  },
  { key: "handle", label: "Handle", width: "200px", type: "text" },
  {
    key: "availableForSale",
    label: "Available",
    width: "120px",
    type: "checkbox",
  },
  {
    key: "collections",
    label: "Collections",
    width: "220px",
    type: "collections",
    optional: true,
  },
  { key: "tags", label: "Tags", width: "200px", type: "tags" },
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
    width: "260px",
    type: "text",
    optional: true,
  },
];

interface BulkProductEditorProps {
  selectedIds?: string[];
}

const createEmptyRow = (): ProductRow => ({
  id: `new-${Date.now()}`,
  title: "",
  handle: "",
  description: "",
  descriptionHtml: "",
  price: "",
  availableForSale: true,
  tags: "",
  collections: [],
  seoTitle: "",
  seoDescription: "",
  variants: [
    {
      id: `temp-variant-${crypto.randomUUID()}`,
      title: "Default",
      price: "0",
      availableForSale: true,
      selectedOptions: [],
      isNew: true,
      isModified: false,
      isDeleted: false,
    },
  ],
  images: [],
  sizeFrom: "38",
  sizeTo: "44",
  colors: "Black, Brown, Navy",
  sizePriceRules: [],
  largeSizeFrom: "",
  largeSizePrice: "",
  colorPriceRules: [],
  generateVariants: true,
  isNew: true,
  isModified: false,
  isDeleted: false,
});

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const getSizesFromOptions = (options: any[]) => {
  const sizeOption = options?.find((option) =>
    String(option.name || "")
      .toLowerCase()
      .includes("size"),
  );
  const values = Array.isArray(sizeOption?.values) ? sizeOption.values : [];
  return values.map((v: string) => v.toString());
};

const getColorsFromOptions = (options: any[]) => {
  const colorOption = options?.find((option) =>
    String(option.name || "")
      .toLowerCase()
      .includes("color"),
  );
  const values = Array.isArray(colorOption?.values) ? colorOption.values : [];
  return values.map((v: string) => v.toString());
};

const colorPricesToRules = (prices?: Record<string, number>) => {
  if (!prices) return [];
  return Object.entries(prices).map(([color, price]) => ({
    color,
    price: price.toString(),
  }));
};

const buildSizesFromRange = (sizeFrom: string, sizeTo: string) => {
  const from = parseInt(sizeFrom, 10);
  const to = parseInt(sizeTo, 10);
  if (Number.isNaN(from) || Number.isNaN(to) || from > to)
    return [] as string[];
  const sizes: string[] = [];
  for (let i = from; i <= to; i += 1) {
    sizes.push(i.toString());
  }
  return sizes;
};

function DescriptionEditorModal({
  value,
  onClose,
  onSave,
}: {
  value: { rowId: string; html: string };
  onClose: () => void;
  onSave: (html: string, text: string) => void;
}) {
  const [html, setHtml] = useState(value.html || "");
  const [text, setText] = useState(stripHtml(value.html || ""));

  const editor = useEditor({
    extensions: [StarterKit],
    content: value.html || "",
    editorProps: {
      attributes: {
        class:
          "prose max-w-none rounded-md border border-neutral-300 bg-white px-3 py-3 text-sm focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100",
      },
    },
    onUpdate: ({ editor: tiptap }) => {
      setHtml(tiptap.getHTML());
      setText(tiptap.getText());
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Edit Description
          </h3>
          <button
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Close
          </button>
        </div>
        <div className="rounded-md border border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            Tip: Use formatting to build rich product descriptions.
          </div>
          <EditorContent editor={editor} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {text.length} characters
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(html, text)}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Save Description
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BulkProductEditor({
  selectedIds = [],
}: BulkProductEditorProps) {
  const isCreateMode = selectedIds.length === 0;

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof ProductRow>>(
    new Set(["title", "price", "description"]),
  );
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    column: keyof ProductRow;
  } | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState<{
    rowId: string;
    html: string;
  } | null>(null);
  const [showCollectionsModal, setShowCollectionsModal] = useState<{
    rowId: string;
    selected: string[];
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  const activeProduct = useMemo(
    () => products.find((product) => product.id === activeProductId) || null,
    [products, activeProductId],
  );

  useEffect(() => {
    if (selectedIds.length > 0) {
      fetchSelectedProducts();
      return;
    }

    if (isCreateMode) {
      setProducts((prev) => (prev.length > 0 ? prev : [createEmptyRow()]));
      setLoading(false);
      return;
    }

    fetchProducts();
  }, [selectedIds, currentPage, searchTerm, isCreateMode]);

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!columnMenuRef.current) return;
      if (!columnMenuRef.current.contains(event.target as Node)) {
        setShowColumnsMenu(false);
      }
    };

    if (showColumnsMenu) {
      document.addEventListener("mousedown", handleClick);
    }

    return () => document.removeEventListener("mousedown", handleClick);
  }, [showColumnsMenu]);

  const mapApiProductToRow = (product: any): ProductRow => {
    const sizes = getSizesFromOptions(product.options || []);
    const colors = getColorsFromOptions(product.options || []);
    const sizeNumbers = sizes
      .map((value: string) => parseInt(value, 10))
      .filter((value: number) => !Number.isNaN(value));
    const sizeFrom = sizeNumbers.length
      ? Math.min(...sizeNumbers).toString()
      : "";
    const sizeTo = sizeNumbers.length
      ? Math.max(...sizeNumbers).toString()
      : "";

    return {
      id: product.id,
      title: product.title || "",
      handle: product.handle || "",
      description: product.description || "",
      descriptionHtml: product.descriptionHtml || product.description || "",
      price: product.variants?.[0]?.price?.toString() || "0",
      availableForSale: product.availableForSale ?? true,
      tags: product.tags?.join(", ") || "",
      collections:
        product.productCollections?.map((pc: any) => pc.collection.id) || [],
      seoTitle: product.seoTitle || "",
      seoDescription: product.seoDescription || "",
      variants:
        product.variants?.map((variant: any) => ({
          id: variant.id,
          title: variant.title,
          price: variant.price.toString(),
          availableForSale: variant.availableForSale,
          selectedOptions: variant.selectedOptions || [],
          isNew: false,
          isModified: false,
          isDeleted: false,
        })) || [],
      images:
        product.images?.map((img: any, index: number) => ({
          url: img.url,
          position: img.position ?? index,
          isFeatured: img.isFeatured ?? index === 0,
          width: img.width ?? PRODUCT_IMAGE_WIDTH,
          height: img.height ?? PRODUCT_IMAGE_HEIGHT,
        })) || [],
      sizeFrom,
      sizeTo,
      colors: colors.join(", "),
      sizePriceRules: [],
      largeSizeFrom: "",
      largeSizePrice: "",
      colorPriceRules: colorPricesToRules(product.colorPrices),
      generateVariants: false,
      isNew: false,
      isModified: false,
      isDeleted: false,
    };
  };

  const fetchSelectedProducts = async () => {
    try {
      setLoading(true);

      const promises = selectedIds.map((id) => {
        return fetch(`/api/admin/products/${id}`).then((res) => res.json());
      });

      const results = await Promise.all(promises);
      const productsData = results.filter(Boolean);
      const mappedProducts = productsData.map(mapApiProductToRow);

      setProducts(mappedProducts);
      setTotalPages(1);
    } catch (error) {
      console.error("Error fetching selected products:", error);
      toast.error("Failed to load selected products");
    } finally {
      setLoading(false);
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

      setProducts(productsData.map(mapApiProductToRow));
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

  const updateProduct = (rowId: string, updates: Partial<ProductRow>) => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== rowId) return product;
        const next = { ...product, ...updates };
        return {
          ...next,
          isModified: product.isNew ? false : true,
        };
      }),
    );
  };

  const addNewRow = () => {
    const newRow = createEmptyRow();
    setProducts((prev) => [newRow, ...prev]);
    setActiveProductId(newRow.id);
    toast.success("New row added");
  };

  const duplicateRows = () => {
    if (selectedRows.size === 0) {
      toast.error("Select rows to duplicate");
      return;
    }

    const duplicated = products
      .filter((product) => selectedRows.has(product.id))
      .map((product) => ({
        ...product,
        id: `dup-${Date.now()}-${Math.random()}`,
        title: product.title ? `${product.title} (Copy)` : "",
        handle: product.handle ? `${product.handle}-copy-${Date.now()}` : "",
        isNew: true,
        isModified: false,
        isDeleted: false,
      }));

    setProducts((prev) => [...duplicated, ...prev]);
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
      prev.map((product) =>
        selectedRows.has(product.id)
          ? { ...product, isDeleted: true }
          : product,
      ),
    );
    setSelectedRows(new Set());
    toast.success("Marked for deletion");
  };

  const updateCell = (rowId: string, column: keyof ProductRow, value: any) => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== rowId) return product;

        const updated: ProductRow = {
          ...product,
          [column]: value,
          isModified: !product.isNew,
        };

        if (column === "title") {
          const previousSlug = generateSlug(product.title);
          const nextSlug = generateSlug(value);
          if (product.handle === "" || product.handle === previousSlug) {
            updated.handle = nextSlug;
          }

          const previousSeoTitle = generateSeoTitle(product.title);
          if (
            product.seoTitle === "" ||
            product.seoTitle === previousSeoTitle
          ) {
            updated.seoTitle = generateSeoTitle(value);
          }
        }

        if (column === "description") {
          if (!product.seoDescription) {
            updated.seoDescription = generateSeoDescription(value);
          }
        }

        return updated;
      }),
    );
  };

  const toggleRowSelection = (rowId: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
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

  const updateVariant = (
    productId: string,
    variantId: string,
    field: keyof ProductVariant,
    value: any,
  ) => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;
        return {
          ...product,
          variants: product.variants.map((variant) =>
            variant.id === variantId
              ? { ...variant, [field]: value, isModified: !variant.isNew }
              : variant,
          ),
          isModified: !product.isNew,
        };
      }),
    );
  };

  const addVariant = (productId: string) => {
    const newVariant: ProductVariant = {
      id: `temp-variant-${crypto.randomUUID()}`,
      title: "New Variant",
      price: "0",
      availableForSale: true,
      selectedOptions: [],
      isNew: true,
      isModified: false,
      isDeleted: false,
    };

    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              variants: [...product.variants, newVariant],
              isModified: !product.isNew,
            }
          : product,
      ),
    );
    toast.success("Variant added");
  };

  const deleteVariant = (productId: string, variantId: string) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              variants: product.variants.map((variant) =>
                variant.id === variantId
                  ? { ...variant, isDeleted: true }
                  : variant,
              ),
              isModified: !product.isNew,
            }
          : product,
      ),
    );
    toast.success("Variant marked for deletion");
  };

  const toggleColumnVisibility = (column: keyof ProductRow) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(column)) {
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  };

  const handleImageUpload = async (rowId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const product = products.find((item) => item.id === rowId);
    if (!product) return;

    if (product.images.length + files.length > 5) {
      toast.error("Maximum 5 images allowed per product");
      return;
    }

    try {
      const uploadedImages: ImageUpload[] = [];

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        if (!file) continue;

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Image ${file.name} is too large (max 5MB)`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        uploadedImages.push({
          url: data.url,
          position: product.images.length + uploadedImages.length,
          isFeatured:
            product.images.length === 0 && uploadedImages.length === 0,
          width: data.width ?? PRODUCT_IMAGE_WIDTH,
          height: data.height ?? PRODUCT_IMAGE_HEIGHT,
        });
      }

      if (uploadedImages.length > 0) {
        updateProduct(rowId, {
          images: [...product.images, ...uploadedImages],
        });
        toast.success(`${uploadedImages.length} image(s) uploaded`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    }
  };

  const removeImage = (rowId: string, index: number) => {
    const product = products.find((item) => item.id === rowId);
    if (!product) return;

    const nextImages = product.images.filter((_, i) => i !== index);
    nextImages.forEach((image, i) => {
      image.position = i;
      image.isFeatured = i === 0;
    });

    updateProduct(rowId, { images: nextImages });
  };

  const setFeaturedImage = (rowId: string, index: number) => {
    const product = products.find((item) => item.id === rowId);
    if (!product) return;

    updateProduct(rowId, {
      images: product.images.map((image, i) => ({
        ...image,
        isFeatured: i === index,
      })),
    });
  };

  const moveImage = (rowId: string, fromIndex: number, toIndex: number) => {
    const product = products.find((item) => item.id === rowId);
    if (!product) return;

    const nextImages = [...product.images];
    const [movedImage] = nextImages.splice(fromIndex, 1);
    if (!movedImage) return;
    nextImages.splice(toIndex, 0, movedImage);
    nextImages.forEach((image, index) => {
      image.position = index;
    });

    updateProduct(rowId, { images: nextImages });
  };

  const handleApplyBulkAvailability = (value: boolean) => {
    if (selectedRows.size === 0) {
      toast.error("Select rows first");
      return;
    }

    setProducts((prev) =>
      prev.map((product) =>
        selectedRows.has(product.id)
          ? { ...product, availableForSale: value, isModified: !product.isNew }
          : product,
      ),
    );

    toast.success(`Applied to ${selectedRows.size} product(s)`);
    setSelectedRows(new Set());
  };

  const saveAllChanges = async () => {
    const modifiedProducts = products.filter(
      (product) => (product.isNew || product.isModified) && !product.isDeleted,
    );
    const deletedProducts = products.filter(
      (product) => product.isDeleted && !product.isNew,
    );

    if (modifiedProducts.length === 0 && deletedProducts.length === 0) {
      toast.error("No changes to save");
      return;
    }

    for (const product of modifiedProducts) {
      if (!product.title.trim()) {
        toast.error("Product title is required");
        return;
      }
      if (!product.handle.trim()) {
        toast.error(`Product handle is required for ${product.title}`);
        return;
      }
      if (!product.price || Number(product.price) <= 0) {
        toast.error(`Base price is required for ${product.title}`);
        return;
      }
      if (product.images.length < 1) {
        toast.error(`At least one image is required for ${product.title}`);
        return;
      }
      if (product.isNew && !product.generateVariants) {
        toast.error(`New products must generate variants for ${product.title}`);
        return;
      }

      if (product.generateVariants || product.isNew) {
        const sizeValues = buildSizesFromRange(
          product.sizeFrom,
          product.sizeTo,
        );
        const colorValues = product.colors
          .split(",")
          .map((color) => color.trim())
          .filter(Boolean);

        if (sizeValues.length === 0 || colorValues.length === 0) {
          toast.error(
            `Size range and colors are required for ${product.title}`,
          );
          return;
        }
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

      for (const product of deletedProducts) {
        await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      }

      for (const product of modifiedProducts) {
        const basePayload = {
          title: product.title,
          handle: product.handle,
          description: product.description,
          descriptionHtml: product.descriptionHtml || product.description,
          availableForSale: product.availableForSale,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          tags: product.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          collectionIds: product.collections,
          images: product.images,
        };

        const colorPrices =
          product.colorPriceRules.length > 0
            ? product.colorPriceRules.reduce(
                (acc, rule) => {
                  const price = parseFloat(rule.price);
                  if (!Number.isNaN(price) && rule.color.trim()) {
                    acc[rule.color.trim().toLowerCase()] = price;
                  }
                  return acc;
                },
                {} as Record<string, number>,
              )
            : null;

        const payload: any = {
          ...basePayload,
          basePrice: parseFloat(product.price) || 0,
        };

        const sizePriceRules = product.sizePriceRules
          .map((rule) => ({
            from: parseInt(rule.from, 10),
            price: parseFloat(rule.price),
          }))
          .filter(
            (rule) =>
              !Number.isNaN(rule.from) &&
              !Number.isNaN(rule.price) &&
              rule.from > 0,
          );

        if (product.generateVariants || product.isNew) {
          payload.sizes = buildSizesFromRange(product.sizeFrom, product.sizeTo);
          payload.colors = product.colors
            .split(",")
            .map((color) => color.trim())
            .filter(Boolean);
          payload.largeSizeFrom = product.largeSizeFrom
            ? parseInt(product.largeSizeFrom, 10)
            : null;
          payload.largeSizePrice = product.largeSizePrice
            ? parseFloat(product.largeSizePrice)
            : null;
          payload.colorPrices = colorPrices;
          payload.sizePriceRules =
            sizePriceRules.length > 0 ? sizePriceRules : null;
        }

        const url = product.isNew
          ? "/api/admin/products"
          : `/api/admin/products/${product.id}`;
        const method = product.isNew ? "POST" : "PUT";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to save ${product.title}`);
        }

        if (!product.isNew && !product.generateVariants) {
          const variantChanges = product.variants.some(
            (variant) =>
              variant.isNew || variant.isModified || variant.isDeleted,
          );

          if (variantChanges) {
            const variantResponse = await fetch(
              `/api/admin/products/${product.id}/variants`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ variants: product.variants }),
              },
            );

            if (!variantResponse.ok) {
              const error = await variantResponse.json();
              throw new Error(
                error.error || `Failed to update variants for ${product.title}`,
              );
            }
          }
        }
      }

      toast.success(
        `Saved ${modifiedProducts.length} product(s), deleted ${deletedProducts.length}`,
      );

      if (!isCreateMode) {
        fetchProducts();
      } else {
        setProducts([createEmptyRow()]);
      }
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const modifiedCount = products.filter(
    (product) => (product.isNew || product.isModified) && !product.isDeleted,
  ).length;
  const deletedCount = products.filter((product) => product.isDeleted).length;

  const validationIssues = products
    .filter((product) => !product.isDeleted)
    .map((product) => {
      const issues = [] as string[];
      if (!product.title.trim()) issues.push("Missing title");
      if (!product.price || Number(product.price) <= 0)
        issues.push("Missing base price");
      if (!product.handle.trim()) issues.push("Missing handle");
      if (product.images.length < 1) issues.push("No images");
      return { id: product.id, title: product.title, issues };
    })
    .filter((item) => item.issues.length > 0);

  const renderCell = (product: ProductRow, column: Column) => {
    const isEditing =
      editingCell?.rowId === product.id && editingCell?.column === column.key;
    const value = product[column.key];

    if (column.type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={value as boolean}
          onChange={(event) =>
            updateCell(product.id, column.key, event.target.checked)
          }
          className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
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
          className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-left text-xs text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
        >
          {selectedCollections.length > 0
            ? `${selectedCollections.length} selected`
            : "Select collections"}
        </button>
      );
    }

    if (column.type === "richtext") {
      return (
        <button
          onClick={() =>
            setShowDescriptionModal({
              rowId: product.id,
              html: product.descriptionHtml || product.description,
            })
          }
          className="w-full truncate rounded-md px-2 py-1 text-left text-xs text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          {stripHtml(product.descriptionHtml || product.description) ||
            "Click to edit"}
        </button>
      );
    }

    if (isEditing) {
      const inputType = column.type === "tags" ? "text" : column.type;
      return (
        <input
          type={inputType}
          value={value as string}
          onChange={(event) =>
            updateCell(product.id, column.key, event.target.value)
          }
          onBlur={() => setEditingCell(null)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "Escape") {
              setEditingCell(null);
            }
          }}
          autoFocus
          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      );
    }

    return (
      <div
        onClick={() =>
          setEditingCell({ rowId: product.id, column: column.key })
        }
        className="truncate rounded-md px-2 py-1 text-sm text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
      >
        {(value as string) || <span className="text-neutral-400">Empty</span>}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 rounded-xl border border-neutral-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {isCreateMode
                ? "Bulk Create Workspace"
                : selectedIds.length > 0
                  ? "Bulk Edit Selected"
                  : "Bulk Edit Catalog"}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {isCreateMode
                ? "Start from a clean row and build multiple products fast."
                : "Select rows to edit details in the side panel."}
            </p>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {(modifiedCount > 0 || deletedCount > 0) && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                {modifiedCount} changed, {deletedCount} to delete
              </span>
            )}

            <button
              onClick={addNewRow}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Add Row
            </button>

            {!isCreateMode && (
              <button
                onClick={duplicateRows}
                disabled={selectedRows.size === 0}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Duplicate
              </button>
            )}

            {!isCreateMode && (
              <button
                onClick={deleteSelected}
                disabled={selectedRows.size === 0}
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            )}

            <button
              onClick={saveAllChanges}
              disabled={saving || (modifiedCount === 0 && deletedCount === 0)}
              className="rounded-md bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <Link
              href="/admin/products"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Back
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!isCreateMode && (
            <button
              onClick={() => handleApplyBulkAvailability(true)}
              disabled={selectedRows.size === 0}
              className="rounded-md bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Set Available
            </button>
          )}
          {!isCreateMode && (
            <button
              onClick={() => handleApplyBulkAvailability(false)}
              disabled={selectedRows.size === 0}
              className="rounded-md bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Set Unavailable
            </button>
          )}

          <div className="group relative">
            <button
              onClick={() => setShowColumnsMenu((prev) => !prev)}
              className="rounded-md bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Columns
            </button>
            <div
              ref={columnMenuRef}
              className={`absolute left-0 mt-2 min-w-[220px] rounded-md border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 ${
                showColumnsMenu ? "block" : "hidden"
              }`}
            >
              {DEFAULT_COLUMNS.map((column) => (
                <label
                  key={column.key}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(column.key)}
                    onChange={() => toggleColumnVisibility(column.key)}
                    className="rounded"
                  />
                  {column.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!isCreateMode && selectedIds.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <input
            type="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div ref={containerRef} className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-900 border-t-transparent"></div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Loading products...
                  </p>
                </div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                  <tr>
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={
                          selectedRows.size ===
                            products.filter((product) => !product.isDeleted)
                              .length && products.length > 0
                        }
                        onChange={selectAllRows}
                        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                      />
                    </th>
                    <th className="w-10 px-3 py-3"></th>
                    {DEFAULT_COLUMNS.filter((col) =>
                      visibleColumns.has(col.key),
                    ).map((col) => (
                      <th
                        key={col.key}
                        style={{ minWidth: col.width, maxWidth: col.width }}
                        className="px-3 py-3"
                      >
                        {col.label}
                        {col.optional && (
                          <span className="ml-1 text-neutral-400">(opt)</span>
                        )}
                      </th>
                    ))}
                    <th className="w-32 px-3 py-3">Status</th>
                    <th className="w-32 px-3 py-3">Images</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white text-sm text-neutral-800 dark:divide-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
                  {products
                    .filter((product) => !product.isDeleted)
                    .map((product) => (
                      <tr
                        key={product.id}
                        className={`cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                          selectedRows.has(product.id)
                            ? "bg-neutral-100 dark:bg-neutral-800"
                            : ""
                        } ${
                          product.isNew ? "border-l-4 border-green-500" : ""
                        } ${
                          product.isModified && !product.isNew
                            ? "border-l-4 border-amber-500"
                            : ""
                        }`}
                        onClick={() => setActiveProductId(product.id)}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(product.id)}
                            onChange={(event) => {
                              event.stopPropagation();
                              toggleRowSelection(product.id);
                            }}
                            className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                          />
                        </td>
                        <td className="px-3 py-3 text-xs text-neutral-500">
                          {activeProductId === product.id ? "Active" : ""}
                        </td>
                        {DEFAULT_COLUMNS.filter((col) =>
                          visibleColumns.has(col.key),
                        ).map((col) => (
                          <td
                            key={col.key}
                            style={{ minWidth: col.width, maxWidth: col.width }}
                            className="px-3 py-3"
                          >
                            {renderCell(product, col)}
                          </td>
                        ))}
                        <td className="px-3 py-3 text-xs">
                          {product.isNew && (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                              New
                            </span>
                          )}
                          {product.isModified && !product.isNew && (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                              Edited
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <span className="rounded-full bg-neutral-100 px-2 py-1 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                            {product.images.length} / 5
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Summary
            </h3>
            <div className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
              <div className="flex items-center justify-between">
                <span>Total rows</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {products.filter((product) => !product.isDeleted).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Changes</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {modifiedCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>To delete</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {deletedCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Needs attention</span>
                <span className="font-medium text-red-600">
                  {validationIssues.length}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Validation
            </h3>
            {validationIssues.length === 0 ? (
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                All visible rows pass required checks.
              </p>
            ) : (
              <div className="mt-2 space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                {validationIssues.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveProductId(item.id)}
                    className="w-full rounded-md border border-neutral-200 px-2 py-2 text-left hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {item.title || "Untitled product"}
                    </div>
                    <div className="text-neutral-500 dark:text-neutral-400">
                      {item.issues.join(", ")}
                    </div>
                  </button>
                ))}
                {validationIssues.length > 5 && (
                  <p className="text-[11px] text-neutral-400">
                    {validationIssues.length - 5} more issues hidden
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isCreateMode && totalPages > 1 && selectedIds.length === 0 && (
        <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <button
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={currentPage === totalPages}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Next
          </button>
        </div>
      )}

      {showDescriptionModal && (
        <DescriptionEditorModal
          value={showDescriptionModal}
          onClose={() => setShowDescriptionModal(null)}
          onSave={(html, text) => {
            const currentProduct = products.find(
              (product) => product.id === showDescriptionModal.rowId,
            );
            updateProduct(showDescriptionModal.rowId, {
              descriptionHtml: html,
              description: text,
              seoDescription:
                currentProduct?.seoDescription || generateSeoDescription(html),
            });
            setShowDescriptionModal(null);
          }}
        />
      )}

      {showCollectionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Select Collections
            </h3>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {collections.map((collection) => (
                <label
                  key={collection.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  <input
                    type="checkbox"
                    checked={showCollectionsModal.selected.includes(
                      collection.id,
                    )}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...showCollectionsModal.selected, collection.id]
                        : showCollectionsModal.selected.filter(
                            (id) => id !== collection.id,
                          );
                      setShowCollectionsModal({
                        ...showCollectionsModal,
                        selected: next,
                      });
                    }}
                    className="rounded"
                  />
                  {collection.title}
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowCollectionsModal(null)}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateProduct(showCollectionsModal.rowId, {
                    collections: showCollectionsModal.selected,
                  });
                  setShowCollectionsModal(null);
                }}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {activeProduct && (
        <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[520px] flex-col border-l border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {activeProduct.title || "Untitled Product"}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Manage details, images, and variants
              </p>
            </div>
            <button
              onClick={() => setActiveProductId(null)}
              className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Close
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Core Details
              </h4>
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">
                  Title
                </label>
                <input
                  type="text"
                  value={activeProduct.title}
                  onChange={(event) =>
                    updateCell(activeProduct.id, "title", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">
                  Handle
                </label>
                <input
                  type="text"
                  value={activeProduct.handle}
                  onChange={(event) =>
                    updateCell(activeProduct.id, "handle", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-500 dark:text-neutral-400">
                    Description
                  </label>
                  <button
                    onClick={() =>
                      setShowDescriptionModal({
                        rowId: activeProduct.id,
                        html:
                          activeProduct.descriptionHtml ||
                          activeProduct.description,
                      })
                    }
                    className="text-xs font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-200 dark:hover:text-neutral-100"
                  >
                    Edit rich text
                  </button>
                </div>
                <div className="mt-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                  {stripHtml(
                    activeProduct.descriptionHtml ||
                      activeProduct.description ||
                      "",
                  ) || "No description yet. Click edit to add one."}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="available"
                  type="checkbox"
                  checked={activeProduct.availableForSale}
                  onChange={(event) =>
                    updateCell(
                      activeProduct.id,
                      "availableForSale",
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                />
                <label
                  htmlFor="available"
                  className="text-xs text-neutral-600 dark:text-neutral-300"
                >
                  Available for sale
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Pricing & Variants
              </h4>
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">
                  Base Price (NGN)
                </label>
                <input
                  type="number"
                  value={activeProduct.price}
                  onChange={(event) =>
                    updateCell(activeProduct.id, "price", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                Base price is used when generating variants from size and color.
              </div>

              <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={activeProduct.generateVariants}
                  onChange={(event) =>
                    updateProduct(activeProduct.id, {
                      generateVariants: event.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                />
                Regenerate variants from size and color
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 dark:text-neutral-400">
                    Size from
                  </label>
                  <input
                    type="number"
                    value={activeProduct.sizeFrom}
                    onChange={(event) =>
                      updateProduct(activeProduct.id, {
                        sizeFrom: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 dark:text-neutral-400">
                    Size to
                  </label>
                  <input
                    type="number"
                    value={activeProduct.sizeTo}
                    onChange={(event) =>
                      updateProduct(activeProduct.id, {
                        sizeTo: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">
                  Colors (comma separated)
                </label>
                <input
                  type="text"
                  value={activeProduct.colors}
                  onChange={(event) =>
                    updateProduct(activeProduct.id, {
                      colors: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-neutral-500 dark:text-neutral-400">
                  Size-based pricing tiers
                </label>
                <div className="space-y-2 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
                  {activeProduct.sizePriceRules.length === 0 && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Add one or more size tiers (e.g., 40+ = 13000, 43+ =
                      15000). Highest matching tier wins.
                    </p>
                  )}
                  {activeProduct.sizePriceRules.map((rule, index) => (
                    <div key={`${rule.from}-${index}`} className="flex gap-2">
                      <input
                        type="number"
                        value={rule.from}
                        onChange={(event) => {
                          const next = [...activeProduct.sizePriceRules];
                          const currentRule = next[index] ?? {
                            from: "",
                            price: "",
                          };
                          next[index] = {
                            ...currentRule,
                            from: event.target.value,
                          };
                          updateProduct(activeProduct.id, {
                            sizePriceRules: next,
                          });
                        }}
                        placeholder="From size"
                        className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      />
                      <input
                        type="number"
                        value={rule.price}
                        onChange={(event) => {
                          const next = [...activeProduct.sizePriceRules];
                          const currentRule = next[index] ?? {
                            from: "",
                            price: "",
                          };
                          next[index] = {
                            ...currentRule,
                            price: event.target.value,
                          };
                          updateProduct(activeProduct.id, {
                            sizePriceRules: next,
                          });
                        }}
                        placeholder="Price"
                        className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = activeProduct.sizePriceRules.filter(
                            (_, idx) => idx !== index,
                          );
                          updateProduct(activeProduct.id, {
                            sizePriceRules: next,
                          });
                        }}
                        className="rounded-md border border-red-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateProduct(activeProduct.id, {
                        sizePriceRules: [
                          ...activeProduct.sizePriceRules,
                          { from: "", price: "" },
                        ],
                      })
                    }
                    className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    + Add size tier
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 dark:text-neutral-400">
                    Large size from
                  </label>
                  <input
                    type="number"
                    value={activeProduct.largeSizeFrom}
                    onChange={(event) =>
                      updateProduct(activeProduct.id, {
                        largeSizeFrom: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 dark:text-neutral-400">
                    Large size price
                  </label>
                  <input
                    type="number"
                    value={activeProduct.largeSizePrice}
                    onChange={(event) =>
                      updateProduct(activeProduct.id, {
                        largeSizePrice: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Single-tier fallback. Size tiers override this when set.
              </p>

              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">
                  Color-specific prices
                </label>
                <div className="mt-2 space-y-2 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
                  {activeProduct.colorPriceRules.length === 0 && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Add color-based pricing rules. Leave blank if not needed.
                    </p>
                  )}
                  {activeProduct.colorPriceRules.map((rule, index) => (
                    <div key={`${rule.color}-${index}`} className="flex gap-2">
                      <input
                        type="text"
                        value={rule.color}
                        onChange={(event) => {
                          const next = [...activeProduct.colorPriceRules];
                          const currentRule = next[index] ?? {
                            color: "",
                            price: "",
                          };
                          next[index] = {
                            ...currentRule,
                            color: event.target.value,
                          };
                          updateProduct(activeProduct.id, {
                            colorPriceRules: next,
                          });
                        }}
                        placeholder="Color"
                        className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      />
                      <input
                        type="number"
                        value={rule.price}
                        onChange={(event) => {
                          const next = [...activeProduct.colorPriceRules];
                          const currentRule = next[index] ?? {
                            color: "",
                            price: "",
                          };
                          next[index] = {
                            ...currentRule,
                            price: event.target.value,
                          };
                          updateProduct(activeProduct.id, {
                            colorPriceRules: next,
                          });
                        }}
                        placeholder="Price"
                        className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = activeProduct.colorPriceRules.filter(
                            (_, idx) => idx !== index,
                          );
                          updateProduct(activeProduct.id, {
                            colorPriceRules: next,
                          });
                        }}
                        className="rounded-md border border-red-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateProduct(activeProduct.id, {
                        colorPriceRules: [
                          ...activeProduct.colorPriceRules,
                          { color: "", price: "" },
                        ],
                      })
                    }
                    className="mt-2 rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    + Add color price
                  </button>
                </div>
              </div>

              {!activeProduct.generateVariants && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                      Manual Variants
                    </h5>
                    <button
                      onClick={() => addVariant(activeProduct.id)}
                      className="rounded-md bg-neutral-900 px-2 py-1 text-xs text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                      Add Variant
                    </button>
                  </div>
                  <div className="space-y-2">
                    {activeProduct.variants
                      .filter((variant) => !variant.isDeleted)
                      .map((variant) => (
                        <div
                          key={variant.id}
                          className="rounded-md border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900"
                        >
                          <input
                            type="text"
                            value={variant.title}
                            onChange={(event) =>
                              updateVariant(
                                activeProduct.id,
                                variant.id,
                                "title",
                                event.target.value,
                              )
                            }
                            className="mb-2 w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={variant.price}
                              onChange={(event) =>
                                updateVariant(
                                  activeProduct.id,
                                  variant.id,
                                  "price",
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                            />
                            <label className="flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                              <input
                                type="checkbox"
                                checked={variant.availableForSale}
                                onChange={(event) =>
                                  updateVariant(
                                    activeProduct.id,
                                    variant.id,
                                    "availableForSale",
                                    event.target.checked,
                                  )
                                }
                                className="h-3 w-3 rounded border-neutral-300 text-neutral-900"
                              />
                              Available
                            </label>
                            <button
                              onClick={() =>
                                deleteVariant(activeProduct.id, variant.id)
                              }
                              className="rounded-md border border-red-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Images ({activeProduct.images.length}/5)
              </h4>
              {activeProduct.images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {activeProduct.images.map((image, index) => (
                    <div
                      key={image.url + index}
                      className="group relative overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800"
                    >
                      <img
                        src={image.url}
                        alt={`Product image ${index + 1}`}
                        className="h-24 w-full object-cover"
                      />
                      {image.isFeatured && (
                        <span className="absolute left-2 top-2 rounded bg-yellow-400 px-2 py-0.5 text-[10px] font-semibold text-neutral-900">
                          Featured
                        </span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        {!image.isFeatured && (
                          <button
                            type="button"
                            onClick={() =>
                              setFeaturedImage(activeProduct.id, index)
                            }
                            className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-neutral-900"
                          >
                            Feature
                          </button>
                        )}
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              moveImage(activeProduct.id, index, index - 1)
                            }
                            className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-neutral-900"
                          >
                            Left
                          </button>
                        )}
                        {index < activeProduct.images.length - 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              moveImage(activeProduct.id, index, index + 1)
                            }
                            className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-neutral-900"
                          >
                            Right
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(activeProduct.id, index)}
                          className="rounded bg-red-600 px-2 py-1 text-[10px] font-semibold text-white"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeProduct.images.length < 5 && (
                <div>
                  <label className="text-xs text-neutral-500 dark:text-neutral-400">
                    Upload images (min 1, max 5)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      handleImageUpload(activeProduct.id, event.target.files)
                    }
                    className="mt-2 block w-full text-xs text-neutral-500 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-neutral-800 dark:file:bg-neutral-100 dark:file:text-neutral-900"
                  />
                </div>
              )}

              {activeProduct.images.length === 0 && (
                <p className="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  Upload at least one image to save this product.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Tags & Collections
              </h4>
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={activeProduct.tags}
                  onChange={(event) =>
                    updateCell(activeProduct.id, "tags", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">
                  Collections
                </label>
                <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-md border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900">
                  {collections.length === 0 ? (
                    <p className="text-xs text-neutral-500">
                      No collections available.
                    </p>
                  ) : (
                    collections.map((collection) => (
                      <label
                        key={collection.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      >
                        <input
                          type="checkbox"
                          checked={activeProduct.collections.includes(
                            collection.id,
                          )}
                          onChange={(event) => {
                            const next = event.target.checked
                              ? [...activeProduct.collections, collection.id]
                              : activeProduct.collections.filter(
                                  (id) => id !== collection.id,
                                );
                            updateProduct(activeProduct.id, {
                              collections: next,
                            });
                          }}
                          className="rounded"
                        />
                        {collection.title}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                SEO
              </h4>
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={activeProduct.seoTitle}
                  onChange={(event) =>
                    updateCell(activeProduct.id, "seoTitle", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">
                  SEO Description
                </label>
                <textarea
                  value={activeProduct.seoDescription}
                  onChange={(event) =>
                    updateCell(
                      activeProduct.id,
                      "seoDescription",
                      event.target.value,
                    )
                  }
                  rows={3}
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
