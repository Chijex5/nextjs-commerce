"use client";

import {
  generateSeoDescription,
  generateSeoTitle,
  generateSlug,
} from "@/lib/admin-utils";
import {
  PRODUCT_IMAGE_HEIGHT,
  PRODUCT_IMAGE_WIDTH,
} from "@/lib/image-constants";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bold,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Sliders,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

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

interface BulkProductEditorProps {
  selectedIds: string[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_COLUMNS: Column[] = [
  { key: "title", label: "Title", width: "240px", type: "text" },
  { key: "price", label: "Base Price (NGN)", width: "160px", type: "number" },
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
    label: "SEO Desc",
    width: "240px",
    type: "text",
    optional: true,
  },
];

const BULK_DELETE_CONCURRENCY = 8;
const BULK_SAVE_CONCURRENCY = 4;

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
) {
  if (items.length === 0) return;

  let nextIndex = 0;
  let failure: Error | null = null;

  const runner = async () => {
    while (!failure) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) break;

      try {
        await worker(items[currentIndex]!, currentIndex);
      } catch (error) {
        failure =
          error instanceof Error ? error : new Error("Bulk operation failed");
      }
    }
  };

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runner()));

  if (failure) {
    throw failure;
  }
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const buildSizesFromRange = (sizeFrom: string, sizeTo: string): string[] => {
  const from = parseInt(sizeFrom, 10);
  const to = parseInt(sizeTo, 10);
  if (Number.isNaN(from) || Number.isNaN(to) || from > to) return [];
  const sizes: string[] = [];
  for (let i = from; i <= to; i++) sizes.push(i.toString());
  return sizes;
};

const getSizesFromOptions = (options: any[]) => {
  const opt = options?.find((o) =>
    String(o.name || "")
      .toLowerCase()
      .includes("size"),
  );
  return (Array.isArray(opt?.values) ? opt.values : []).map((v: string) =>
    v.toString(),
  );
};

const getColorsFromOptions = (options: any[]) => {
  const opt = options?.find((o) =>
    String(o.name || "")
      .toLowerCase()
      .includes("color"),
  );
  return (Array.isArray(opt?.values) ? opt.values : []).map((v: string) =>
    v.toString(),
  );
};

const colorPricesToRules = (prices?: Record<string, number>) => {
  if (!prices) return [];
  return Object.entries(prices).map(([color, price]) => ({
    color,
    price: price.toString(),
  }));
};

const createEmptyRow = (): ProductRow => ({
  id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
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

// ─── FieldInput ─────────────────────────────────────────────────────────────────

function FieldInput({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {label}
        </label>
        {hint && (
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 transition placeholder-neutral-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/20 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:bg-neutral-800";

// ─── SectionHeader ──────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  action,
}: {
  icon: React.ElementType;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          {label}
        </span>
      </div>
      {action}
    </div>
  );
}

// ─── DescriptionModal ───────────────────────────────────────────────────────────

function DescriptionModal({
  html,
  onClose,
  onSave,
}: {
  html: string;
  onClose: () => void;
  onSave: (html: string, text: string) => void;
}) {
  const [localHtml, setLocalHtml] = useState(html || "");
  const [localText, setLocalText] = useState(stripHtml(html || ""));

  const editor = useEditor({
    extensions: [StarterKit],
    content: html || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[200px] px-4 py-4 text-sm text-neutral-800 focus:outline-none dark:prose-invert dark:text-neutral-100",
      },
    },
    onUpdate: ({ editor: e }) => {
      setLocalHtml(e.getHTML());
      setLocalText(e.getText());
    },
  });

  const toolbarButtons = [
    {
      icon: Bold,
      label: "Bold",
      action: () => editor?.chain().focus().toggleBold().run(),
      active: () => !!editor?.isActive("bold"),
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => editor?.chain().focus().toggleItalic().run(),
      active: () => !!editor?.isActive("italic"),
    },
    {
      icon: List,
      label: "Bullets",
      action: () => editor?.chain().focus().toggleBulletList().run(),
      active: () => !!editor?.isActive("bulletList"),
    },
    {
      icon: ListOrdered,
      label: "Numbered",
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      active: () => !!editor?.isActive("orderedList"),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Rich Text
            </p>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Edit Description
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-700 dark:border-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-hidden">
          <div className="flex items-center gap-1 border-b border-neutral-100 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
            {toolbarButtons.map(({ icon: Icon, label, action, active }) => (
              <button
                key={label}
                type="button"
                title={label}
                onClick={action}
                className={`flex h-7 w-7 items-center justify-center rounded-md transition ${active() ? "bg-slate-700 text-white" : "text-neutral-500 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700"}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
          <div className="min-h-[200px] bg-white dark:bg-neutral-950">
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              <div className="px-4 py-4 text-sm text-neutral-400">Loading…</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <span className="text-xs text-neutral-400">
            {localText.length} characters
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(localHtml, localText)}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
            >
              <Check className="h-3.5 w-3.5" />
              Save description
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CollectionsModal ───────────────────────────────────────────────────────────

function CollectionsModal({
  collections,
  selected,
  onClose,
  onSave,
}: {
  collections: Collection[];
  selected: string[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const [local, setLocal] = useState(selected);
  const [search, setSearch] = useState("");

  const filtered = collections.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Assign to Collections
          </h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {local.length} selected
          </span>
        </div>

        <div className="border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search collections…"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 pl-8 pr-3 text-sm text-neutral-900 focus:border-slate-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-neutral-400">
              No collections found
            </div>
          ) : (
            filtered.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded border transition ${local.includes(c.id) ? "border-slate-600 bg-slate-700" : "border-neutral-300 dark:border-neutral-600"}`}
                >
                  {local.includes(c.id) && (
                    <Check className="h-2.5 w-2.5 text-white" />
                  )}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={local.includes(c.id)}
                  onChange={(e) =>
                    setLocal(
                      e.target.checked
                        ? [...local, c.id]
                        : local.filter((id) => id !== c.id),
                    )
                  }
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-200">
                  {c.title}
                </span>
              </label>
            ))
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(local)}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PriceRuleRow ───────────────────────────────────────────────────────────────

function PriceRuleRow({
  labelA,
  labelB,
  valueA,
  valueB,
  onChangeA,
  onChangeB,
  onRemove,
}: {
  labelA: string;
  labelB: string;
  valueA: string;
  valueB: string;
  onChangeA: (v: string) => void;
  onChangeB: (v: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={valueA}
        onChange={(e) => onChangeA(e.target.value)}
        placeholder={labelA}
        className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-800 focus:border-slate-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      />
      <input
        type="number"
        value={valueB}
        onChange={(e) => onChangeB(e.target.value)}
        placeholder={labelB}
        className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-800 focus:border-slate-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      />
      <button
        type="button"
        onClick={onRemove}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-100 text-red-400 transition hover:border-red-300 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── TableCell ──────────────────────────────────────────────────────────────────

const TableCell = memo(function TableCell({
  product,
  column,
  isEditing,
  onStartEdit,
  onEndEdit,
  onCellChange,
  onOpenDescription,
  onOpenCollections,
}: {
  product: ProductRow;
  column: Column;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onCellChange: (value: any) => void;
  onOpenDescription: () => void;
  onOpenCollections: () => void;
}) {
  const value = product[column.key];

  if (column.type === "checkbox") {
    return (
      <div className="flex justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCellChange(!(value as boolean));
          }}
          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition ${
            value
              ? "border-emerald-500 bg-emerald-500"
              : "border-neutral-300 dark:border-neutral-600"
          }`}
        >
          {value && <Check className="h-3 w-3 text-white" />}
        </button>
      </div>
    );
  }

  if (column.type === "collections") {
    const count = ((value as string[]) || []).length;
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenCollections();
        }}
        className="flex w-full items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-600 transition hover:border-slate-300 hover:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
      >
        <Tag className="h-3 w-3 shrink-0" />
        {count > 0 ? `${count} collection${count > 1 ? "s" : ""}` : "Assign"}
      </button>
    );
  }

  if (column.type === "richtext") {
    const preview = stripHtml(product.descriptionHtml || product.description);
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenDescription();
        }}
        className="flex w-full items-center gap-1.5 truncate rounded-lg px-1 py-1 text-left text-xs text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Pencil className="h-3 w-3 shrink-0 opacity-40" />
        <span className="truncate">
          {preview || <em className="text-neutral-400">Click to write…</em>}
        </span>
      </button>
    );
  }

  if (isEditing) {
    return (
      <input
        type={column.type === "number" ? "number" : "text"}
        defaultValue={value as string}
        onChange={(e) => onCellChange(e.target.value)}
        onBlur={onEndEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") onEndEdit();
        }}
        autoFocus
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-lg border border-slate-400 bg-white px-2 py-1 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-slate-400/20 dark:border-slate-500 dark:bg-neutral-800 dark:text-neutral-100"
      />
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onStartEdit();
      }}
      className="cursor-text truncate rounded-lg px-2 py-1 text-sm text-neutral-800 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      {(value as string) || (
        <span className="text-neutral-300 dark:text-neutral-600">—</span>
      )}
    </div>
  );
});

// ─── ImageGrid ──────────────────────────────────────────────────────────────────

function ImageGrid({
  productId,
  images,
  onUpload,
  onRemove,
  onSetFeatured,
  onMove,
}: {
  productId: string;
  images: ImageUpload[];
  onUpload: (id: string, files: FileList | null) => void;
  onRemove: (id: string, index: number) => void;
  onSetFeatured: (id: string, index: number) => void;
  onMove: (id: string, from: number, to: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img, index) => (
            <div
              key={img.url + index}
              className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700"
            >
              <img
                src={img.url}
                alt=""
                className="h-full w-full object-cover"
              />
              {img.isFeatured && (
                <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  <Star className="h-2.5 w-2.5" fill="currentColor" /> Featured
                </span>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.isFeatured && (
                  <button
                    onClick={() => onSetFeatured(productId, index)}
                    className="rounded-lg bg-amber-400 px-2.5 py-1 text-[10px] font-bold text-amber-900 hover:bg-amber-300"
                  >
                    Set featured
                  </button>
                )}
                <div className="flex gap-1">
                  {index > 0 && (
                    <button
                      onClick={() => onMove(productId, index, index - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-white/80 text-neutral-800 hover:bg-white"
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </button>
                  )}
                  {index < images.length - 1 && (
                    <button
                      onClick={() => onMove(productId, index, index + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-white/80 text-neutral-800 hover:bg-white"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={() => onRemove(productId, index)}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500 text-white hover:bg-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length < 5 && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 py-3 text-sm text-neutral-400 transition hover:border-slate-400 hover:text-slate-600 dark:border-neutral-700 dark:hover:border-slate-500"
          >
            <Plus className="h-4 w-4" />
            Upload images ({images.length}/5)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onUpload(productId, e.target.files)}
          />
        </>
      )}

      {images.length === 0 && (
        <p className="text-center text-xs text-red-400">
          At least 1 image required to save
        </p>
      )}
    </div>
  );
}

// ─── DetailPanel ─────────────────────────────────────────────────────────────────

function DetailPanel({
  product,
  collections,
  onClose,
  onUpdate,
  onCellChange,
  onOpenDescription,
  onUploadImages,
  onRemoveImage,
  onSetFeatured,
  onMoveImage,
  onAddVariant,
  onUpdateVariant,
  onDeleteVariant,
}: {
  product: ProductRow;
  collections: Collection[];
  onClose: () => void;
  onUpdate: (updates: Partial<ProductRow>) => void;
  onCellChange: (col: keyof ProductRow, value: any) => void;
  onOpenDescription: () => void;
  onUploadImages: (id: string, files: FileList | null) => void;
  onRemoveImage: (id: string, index: number) => void;
  onSetFeatured: (id: string, index: number) => void;
  onMoveImage: (id: string, from: number, to: number) => void;
  onAddVariant: () => void;
  onUpdateVariant: (
    variantId: string,
    field: keyof ProductVariant,
    value: any,
  ) => void;
  onDeleteVariant: (variantId: string) => void;
}) {
  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[500px] flex-col border-l border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
      {/* Panel Header */}
      <div className="flex items-start justify-between border-b border-neutral-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4 dark:border-neutral-800 dark:from-slate-950/40 dark:to-neutral-950">
        <div className="min-w-0 flex-1 pr-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {product.isNew ? "New product" : "Editing"}
          </p>
          <h3 className="mt-0.5 truncate text-base font-bold text-neutral-900 dark:text-neutral-100">
            {product.title || "Untitled product"}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            {product.isNew && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                NEW
              </span>
            )}
            {product.isModified && !product.isNew && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                UNSAVED
              </span>
            )}
            <span className="text-[10px] text-neutral-400">
              {product.images.length}/5 images
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 transition hover:border-neutral-300 hover:text-neutral-700 dark:border-neutral-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {/* ── Core Details ── */}
          <section className="space-y-4 p-5">
            <SectionHeader icon={Package} label="Core Details" />

            <FieldInput label="Title">
              <input
                type="text"
                value={product.title}
                onChange={(e) => onCellChange("title", e.target.value)}
                placeholder="e.g. Classic Oxford Shoes"
                className={inputCls}
              />
            </FieldInput>

            <FieldInput label="Handle" hint="auto-generated from title">
              <input
                type="text"
                value={product.handle}
                onChange={(e) => onCellChange("handle", e.target.value)}
                placeholder="classic-oxford-shoes"
                className={inputCls}
              />
            </FieldInput>

            <FieldInput label="Description">
              <div
                onClick={onOpenDescription}
                className="cursor-pointer rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-500 transition hover:border-slate-300 hover:bg-white dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400"
              >
                {stripHtml(product.descriptionHtml || product.description) || (
                  <span className="flex items-center gap-1.5 italic">
                    <Pencil className="h-3.5 w-3.5" />
                    Click to write a rich description…
                  </span>
                )}
              </div>
            </FieldInput>

            <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5 dark:border-neutral-700">
              <div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Available for sale
                </p>
                <p className="text-xs text-neutral-400">
                  {product.availableForSale
                    ? "Visible to customers"
                    : "Hidden from store"}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onCellChange("availableForSale", !product.availableForSale)
                }
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${product.availableForSale ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"}`}
                role="switch"
                aria-checked={product.availableForSale}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${product.availableForSale ? "translate-x-4" : "translate-x-0"}`}
                />
              </button>
            </div>
          </section>

          {/* ── Images ── */}
          <section className="space-y-4 p-5">
            <SectionHeader icon={ImageIcon} label="Images" />
            <ImageGrid
              productId={product.id}
              images={product.images}
              onUpload={onUploadImages}
              onRemove={onRemoveImage}
              onSetFeatured={onSetFeatured}
              onMove={onMoveImage}
            />
          </section>

          {/* ── Pricing & Variants ── */}
          <section className="space-y-4 p-5">
            <SectionHeader icon={Sliders} label="Pricing & Variants" />

            <FieldInput
              label="Base Price (NGN)"
              hint="used when generating variants"
            >
              <input
                type="number"
                value={product.price}
                onChange={(e) => onCellChange("price", e.target.value)}
                placeholder="12000"
                className={inputCls}
              />
            </FieldInput>

            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Size from">
                <input
                  type="number"
                  value={product.sizeFrom}
                  onChange={(e) => onUpdate({ sizeFrom: e.target.value })}
                  className={inputCls}
                />
              </FieldInput>
              <FieldInput label="Size to">
                <input
                  type="number"
                  value={product.sizeTo}
                  onChange={(e) => onUpdate({ sizeTo: e.target.value })}
                  className={inputCls}
                />
              </FieldInput>
            </div>

            <FieldInput label="Colors" hint="comma separated">
              <input
                type="text"
                value={product.colors}
                onChange={(e) => onUpdate({ colors: e.target.value })}
                placeholder="Black, Brown, Navy"
                className={inputCls}
              />
            </FieldInput>

            {/* Regenerate toggle */}
            <div
              className={`flex items-start gap-3 rounded-lg border px-3 py-3 transition ${product.generateVariants ? "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30" : "border-neutral-200 dark:border-neutral-700"}`}
            >
              <button
                type="button"
                onClick={() =>
                  onUpdate({ generateVariants: !product.generateVariants })
                }
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition ${product.generateVariants ? "border-slate-600 bg-slate-700" : "border-neutral-300 dark:border-neutral-600"}`}
              >
                {product.generateVariants && (
                  <Check className="h-2.5 w-2.5 text-white" />
                )}
              </button>
              <div>
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Regenerate variants from size & color
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  All existing variants will be replaced on save
                </p>
              </div>
            </div>

            {/* Size price tiers */}
            <FieldInput
              label="Size-based price tiers"
              hint="highest matching tier wins"
            >
              <div className="space-y-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
                {product.sizePriceRules.length === 0 && (
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    e.g. from size 40 → ₦13,000 · from size 43 → ₦15,000
                  </p>
                )}
                {product.sizePriceRules.map((rule, index) => (
                  <PriceRuleRow
                    key={index}
                    labelA="From size"
                    labelB="Price (NGN)"
                    valueA={rule.from}
                    valueB={rule.price}
                    onChangeA={(v) => {
                      const next = [...product.sizePriceRules];
                      next[index] = { ...next[index]!, from: v };
                      onUpdate({ sizePriceRules: next });
                    }}
                    onChangeB={(v) => {
                      const next = [...product.sizePriceRules];
                      next[index] = { ...next[index]!, price: v };
                      onUpdate({ sizePriceRules: next });
                    }}
                    onRemove={() =>
                      onUpdate({
                        sizePriceRules: product.sizePriceRules.filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                  />
                ))}
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      sizePriceRules: [
                        ...product.sizePriceRules,
                        { from: "", price: "" },
                      ],
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-xs text-neutral-500 transition hover:border-slate-400 hover:text-slate-600 dark:border-neutral-700"
                >
                  <Plus className="h-3 w-3" /> Add size tier
                </button>
              </div>
            </FieldInput>

            {/* Large size override */}
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Large size from" hint="single-tier fallback">
                <input
                  type="number"
                  value={product.largeSizeFrom}
                  onChange={(e) => onUpdate({ largeSizeFrom: e.target.value })}
                  className={inputCls}
                />
              </FieldInput>
              <FieldInput label="Large size price">
                <input
                  type="number"
                  value={product.largeSizePrice}
                  onChange={(e) => onUpdate({ largeSizePrice: e.target.value })}
                  className={inputCls}
                />
              </FieldInput>
            </div>

            {/* Color price rules */}
            <FieldInput label="Color-specific prices">
              <div className="space-y-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
                {product.colorPriceRules.length === 0 && (
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    Override price for specific colors
                  </p>
                )}
                {product.colorPriceRules.map((rule, index) => (
                  <PriceRuleRow
                    key={index}
                    labelA="Color name"
                    labelB="Price (NGN)"
                    valueA={rule.color}
                    valueB={rule.price}
                    onChangeA={(v) => {
                      const next = [...product.colorPriceRules];
                      next[index] = { ...next[index]!, color: v };
                      onUpdate({ colorPriceRules: next });
                    }}
                    onChangeB={(v) => {
                      const next = [...product.colorPriceRules];
                      next[index] = { ...next[index]!, price: v };
                      onUpdate({ colorPriceRules: next });
                    }}
                    onRemove={() =>
                      onUpdate({
                        colorPriceRules: product.colorPriceRules.filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                  />
                ))}
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      colorPriceRules: [
                        ...product.colorPriceRules,
                        { color: "", price: "" },
                      ],
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-xs text-neutral-500 transition hover:border-slate-400 hover:text-slate-600 dark:border-neutral-700"
                >
                  <Plus className="h-3 w-3" /> Add color price
                </button>
              </div>
            </FieldInput>

            {/* Manual variants */}
            {!product.generateVariants && (
              <FieldInput label="Manual variants">
                <div className="space-y-2">
                  {product.variants
                    .filter((v) => !v.isDeleted)
                    .map((variant) => (
                      <div
                        key={variant.id}
                        className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700"
                      >
                        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-800/50">
                          <input
                            type="text"
                            value={variant.title}
                            onChange={(e) =>
                              onUpdateVariant(
                                variant.id,
                                "title",
                                e.target.value,
                              )
                            }
                            className="bg-transparent text-xs font-medium text-neutral-700 focus:outline-none dark:text-neutral-300"
                          />
                          <button
                            onClick={() => onDeleteVariant(variant.id)}
                            className="text-neutral-300 transition hover:text-red-500 dark:text-neutral-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2">
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) =>
                              onUpdateVariant(
                                variant.id,
                                "price",
                                e.target.value,
                              )
                            }
                            placeholder="Price"
                            className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800 focus:border-slate-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                          />
                          <label className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                            <input
                              type="checkbox"
                              checked={variant.availableForSale}
                              onChange={(e) =>
                                onUpdateVariant(
                                  variant.id,
                                  "availableForSale",
                                  e.target.checked,
                                )
                              }
                              className="rounded"
                            />
                            Available
                          </label>
                        </div>
                      </div>
                    ))}
                  <button
                    onClick={onAddVariant}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 py-2 text-xs text-neutral-500 transition hover:border-slate-400 dark:border-neutral-700"
                  >
                    <Plus className="h-3 w-3" /> Add variant
                  </button>
                </div>
              </FieldInput>
            )}
          </section>

          {/* ── Tags & Collections ── */}
          <section className="space-y-4 p-5">
            <SectionHeader icon={Tag} label="Tags & Collections" />

            <FieldInput label="Tags" hint="comma separated">
              <input
                type="text"
                value={product.tags}
                onChange={(e) => onCellChange("tags", e.target.value)}
                placeholder="shoes, leather, formal"
                className={inputCls}
              />
            </FieldInput>

            <FieldInput label="Collections">
              <div className="max-h-36 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
                {collections.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-neutral-400">
                    No collections available
                  </div>
                ) : (
                  collections.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2.5 border-b border-neutral-100 px-3 py-2 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded border transition ${product.collections.includes(c.id) ? "border-slate-600 bg-slate-700" : "border-neutral-300 dark:border-neutral-600"}`}
                      >
                        {product.collections.includes(c.id) && (
                          <Check className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={product.collections.includes(c.id)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...product.collections, c.id]
                            : product.collections.filter((id) => id !== c.id);
                          onUpdate({ collections: next });
                        }}
                      />
                      <span className="text-xs text-neutral-700 dark:text-neutral-300">
                        {c.title}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </FieldInput>
          </section>

          {/* ── SEO ── */}
          <section className="space-y-4 p-5">
            <SectionHeader icon={Search} label="SEO" />

            <FieldInput label="SEO Title">
              <input
                type="text"
                value={product.seoTitle}
                onChange={(e) => onCellChange("seoTitle", e.target.value)}
                placeholder="Auto-generated from title"
                className={inputCls}
              />
            </FieldInput>

            <FieldInput label="SEO Description">
              <textarea
                rows={3}
                value={product.seoDescription}
                onChange={(e) => onCellChange("seoDescription", e.target.value)}
                placeholder="Auto-generated from description"
                className={`${inputCls} resize-none`}
              />
            </FieldInput>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function BulkProductEditor() {
  const searchParams = useSearchParams();
  const selectedIdsParam = searchParams.get("ids") || "";
  const selectedIds = useMemo(
    () =>
      selectedIdsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    [selectedIdsParam],
  );
  const selectedIdsKey = useMemo(() => selectedIds.join(","), [selectedIds]);
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
  const [descriptionModal, setDescriptionModal] = useState<{
    rowId: string;
    html: string;
  } | null>(null);
  const [collectionsModal, setCollectionsModal] = useState<{
    rowId: string;
    selected: string[];
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const columnMenuRef = useRef<HTMLDivElement>(null);

  const activeProduct = useMemo(
    () => products.find((p) => p.id === activeProductId) || null,
    [products, activeProductId],
  );

  // ─ Data fetching ─

  const mapApiProductToRow = useCallback((product: any): ProductRow => {
    const sizes = getSizesFromOptions(product.options || []);
    const colors = getColorsFromOptions(product.options || []);
    const sizeNumbers = sizes
      .map((v: string) => parseInt(v, 10))
      .filter((v: number) => !Number.isNaN(v));
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
        product.variants?.map((v: any) => ({
          id: v.id,
          title: v.title,
          price: v.price.toString(),
          availableForSale: v.availableForSale,
          selectedOptions: v.selectedOptions || [],
          isNew: false,
          isModified: false,
          isDeleted: false,
        })) || [],
      images:
        product.images?.map((img: any, i: number) => ({
          url: img.url,
          position: img.position ?? i,
          isFeatured: img.isFeatured ?? i === 0,
          width: img.width ?? PRODUCT_IMAGE_WIDTH,
          height: img.height ?? PRODUCT_IMAGE_HEIGHT,
        })) || [],
      sizeFrom: sizeNumbers.length ? Math.min(...sizeNumbers).toString() : "",
      sizeTo: sizeNumbers.length ? Math.max(...sizeNumbers).toString() : "",
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
  }, []);

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (selectedIds.length === 0) return;
    fetchSelectedProducts();
  }, [selectedIdsKey]);

  useEffect(() => {
    if (selectedIds.length > 0) return;

    if (isCreateMode) {
      setProducts((prev) => (prev.length > 0 ? prev : [createEmptyRow()]));
      setLoading(false);
      return;
    }

    fetchProducts();
  }, [selectedIdsKey, currentPage, searchTerm, isCreateMode]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(e.target as Node)
      ) {
        setShowColumnsMenu(false);
      }
    };
    if (showColumnsMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showColumnsMenu]);

  const fetchSelectedProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/products?ids=${encodeURIComponent(selectedIdsKey)}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to load selected products: ${response.status} ${errorText}`,
        );
      }

      const data = await response.json();
      const mappedProducts = (data.products || []).map(mapApiProductToRow);

      setProducts(mappedProducts);
      setTotalPages(1);

      if (Array.isArray(data.missingIds) && data.missingIds.length > 0) {
        toast.warning(
          `${data.missingIds.length} selected product(s) were not found and were skipped.`,
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load selected products",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        perPage: "50",
        ...(searchTerm && { search: searchTerm }),
      });
      const res = await fetch(`/api/admin/products?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts((data.products || []).map(mapApiProductToRow));
      setTotalPages(Math.ceil((data.total || 0) / 50));
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await fetch("/api/admin/collections?perPage=100");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCollections(data.collections || []);
    } catch {
      /* silent */
    }
  };

  // ─ Product mutations ─

  const updateProduct = useCallback(
    (rowId: string, updates: Partial<ProductRow>) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id !== rowId
            ? p
            : { ...p, ...updates, isModified: p.isNew ? false : true },
        ),
      );
    },
    [],
  );

  const updateCell = useCallback(
    (rowId: string, column: keyof ProductRow, value: any) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== rowId) return p;
          const updated: ProductRow = {
            ...p,
            [column]: value,
            isModified: !p.isNew,
          };

          if (column === "title") {
            if (p.handle === "" || p.handle === generateSlug(p.title))
              updated.handle = generateSlug(value);
            if (p.seoTitle === "" || p.seoTitle === generateSeoTitle(p.title))
              updated.seoTitle = generateSeoTitle(value);
          }
          if (column === "description" && !p.seoDescription) {
            updated.seoDescription = generateSeoDescription(value);
          }
          return updated;
        }),
      );
    },
    [],
  );

  const addNewRow = () => {
    const row = createEmptyRow();
    setProducts((prev) => [row, ...prev]);
    setActiveProductId(row.id);
  };

  const duplicateRows = () => {
    if (selectedRows.size === 0) {
      toast.error("Select rows to duplicate");
      return;
    }
    const duped = products
      .filter((p) => selectedRows.has(p.id))
      .map((p) => ({
        ...p,
        id: `dup-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: p.title ? `${p.title} (Copy)` : "",
        handle: p.handle ? `${p.handle}-copy` : "",
        isNew: true,
        isModified: false,
        isDeleted: false,
      }));
    setProducts((prev) => [...duped, ...prev]);
    setSelectedRows(new Set());
    toast.success(`${duped.length} product(s) duplicated`);
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
  };

  const applyBulkAvailability = (value: boolean) => {
    if (selectedRows.size === 0) {
      toast.error("Select rows first");
      return;
    }
    setProducts((prev) =>
      prev.map((p) =>
        selectedRows.has(p.id)
          ? { ...p, availableForSale: value, isModified: !p.isNew }
          : p,
      ),
    );
    toast.success(`Applied to ${selectedRows.size} product(s)`);
  };

  const toggleRow = (rowId: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(rowId) ? next.delete(rowId) : next.add(rowId);
      return next;
    });
  };

  const toggleAllRows = () => {
    const visible = products.filter((p) => !p.isDeleted);
    if (selectedRows.size === visible.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(visible.map((p) => p.id)));
    }
  };

  // ─ Variant mutations ─

  const addVariant = (productId: string) => {
    const v: ProductVariant = {
      id: `temp-${crypto.randomUUID()}`,
      title: "New Variant",
      price: "0",
      availableForSale: true,
      selectedOptions: [],
      isNew: true,
      isModified: false,
      isDeleted: false,
    };
    setProducts((prev) =>
      prev.map((p) =>
        p.id !== productId
          ? p
          : { ...p, variants: [...p.variants, v], isModified: !p.isNew },
      ),
    );
  };

  const updateVariant = (
    productId: string,
    variantId: string,
    field: keyof ProductVariant,
    value: any,
  ) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id !== productId
          ? p
          : {
              ...p,
              variants: p.variants.map((v) =>
                v.id !== variantId
                  ? v
                  : { ...v, [field]: value, isModified: !v.isNew },
              ),
              isModified: !p.isNew,
            },
      ),
    );
  };

  const deleteVariant = (productId: string, variantId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id !== productId
          ? p
          : {
              ...p,
              variants: p.variants.map((v) =>
                v.id !== variantId ? v : { ...v, isDeleted: true },
              ),
              isModified: !p.isNew,
            },
      ),
    );
  };

  // ─ Image mutations ─

  const handleImageUpload = async (rowId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const product = products.find((p) => p.id === rowId);
    if (!product) return;
    if (product.images.length + files.length > 5) {
      toast.error("Maximum 5 images per product");
      return;
    }

    const uploaded: ImageUpload[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} too large (max 5MB)`);
        continue;
      }
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        toast.error("Upload failed");
        continue;
      }
      const data = await res.json();
      uploaded.push({
        url: data.url,
        position: product.images.length + uploaded.length,
        isFeatured: product.images.length === 0 && uploaded.length === 0,
        width: data.width ?? PRODUCT_IMAGE_WIDTH,
        height: data.height ?? PRODUCT_IMAGE_HEIGHT,
      });
    }
    if (uploaded.length > 0) {
      updateProduct(rowId, { images: [...product.images, ...uploaded] });
      toast.success(`${uploaded.length} image(s) uploaded`);
    }
  };

  const removeImage = (rowId: string, index: number) => {
    const product = products.find((p) => p.id === rowId);
    if (!product) return;
    const next = product.images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, position: i, isFeatured: i === 0 }));
    updateProduct(rowId, { images: next });
  };

  const setFeaturedImage = (rowId: string, index: number) => {
    const product = products.find((p) => p.id === rowId);
    if (!product) return;
    updateProduct(rowId, {
      images: product.images.map((img, i) => ({
        ...img,
        isFeatured: i === index,
      })),
    });
  };

  const moveImage = (rowId: string, from: number, to: number) => {
    const product = products.find((p) => p.id === rowId);
    if (!product) return;
    const next = [...product.images];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    updateProduct(rowId, {
      images: next.map((img, i) => ({ ...img, position: i })),
    });
  };

  // ─ Save ─

  const saveAllChanges = async () => {
    const toSave = products.filter(
      (p) => (p.isNew || p.isModified) && !p.isDeleted,
    );
    const toDelete = products.filter((p) => p.isDeleted && !p.isNew);

    if (toSave.length === 0 && toDelete.length === 0) {
      toast.error("No changes to save");
      return;
    }

    for (const p of toSave) {
      if (!p.title.trim()) {
        toast.error("Product title is required");
        return;
      }
      if (!p.handle.trim()) {
        toast.error(`Handle required for: ${p.title}`);
        return;
      }
      if (!p.price || Number(p.price) <= 0) {
        toast.error(`Base price required for: ${p.title}`);
        return;
      }
      if (p.images.length < 1) {
        toast.error(`At least 1 image required for: ${p.title}`);
        return;
      }
      if (p.isNew && !p.generateVariants) {
        toast.error(`New products must generate variants: ${p.title}`);
        return;
      }
      if (p.generateVariants || p.isNew) {
        const sizes = buildSizesFromRange(p.sizeFrom, p.sizeTo);
        const colors = p.colors
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
        if (!sizes.length || !colors.length) {
          toast.error(`Size/color required for: ${p.title}`);
          return;
        }
      }
    }

    if (
      !confirm(
        `Save ${toSave.length} product(s) and delete ${toDelete.length}?`,
      )
    )
      return;

    setSaving(true);
    try {
      await runWithConcurrency(toDelete, BULK_DELETE_CONCURRENCY, async (p) => {
        const res = await fetch(`/api/admin/products/${p.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed to delete: ${p.title}`);
        }
      });

      await runWithConcurrency(toSave, BULK_SAVE_CONCURRENCY, async (p) => {
        const colorPrices =
          p.colorPriceRules.length > 0
            ? p.colorPriceRules.reduce(
                (acc, rule) => {
                  const price = parseFloat(rule.price);
                  if (!Number.isNaN(price) && rule.color.trim())
                    acc[rule.color.trim().toLowerCase()] = price;
                  return acc;
                },
                {} as Record<string, number>,
              )
            : null;

        const sizePriceRules = p.sizePriceRules
          .map((r) => ({
            from: parseInt(r.from, 10),
            price: parseFloat(r.price),
          }))
          .filter(
            (r) =>
              !Number.isNaN(r.from) && !Number.isNaN(r.price) && r.from > 0,
          );

        const payload: any = {
          title: p.title,
          handle: p.handle,
          description: p.description,
          descriptionHtml: p.descriptionHtml || p.description,
          availableForSale: p.availableForSale,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          tags: p.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          collectionIds: p.collections,
          images: p.images,
          basePrice: parseFloat(p.price) || 0,
        };

        if (p.generateVariants || p.isNew) {
          payload.sizes = buildSizesFromRange(p.sizeFrom, p.sizeTo);
          payload.colors = p.colors
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);
          payload.largeSizeFrom = p.largeSizeFrom
            ? parseInt(p.largeSizeFrom, 10)
            : null;
          payload.largeSizePrice = p.largeSizePrice
            ? parseFloat(p.largeSizePrice)
            : null;
          payload.colorPrices = colorPrices;
          payload.sizePriceRules =
            sizePriceRules.length > 0 ? sizePriceRules : null;
        }

        const url = p.isNew
          ? "/api/admin/products"
          : `/api/admin/products/${p.id}`;
        const res = await fetch(url, {
          method: p.isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed: ${p.title}`);
        }

        if (!p.isNew && !p.generateVariants) {
          const hasVariantChanges = p.variants.some(
            (v) => v.isNew || v.isModified || v.isDeleted,
          );
          if (hasVariantChanges) {
            const vRes = await fetch(`/api/admin/products/${p.id}/variants`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ variants: p.variants }),
            });
            if (!vRes.ok) {
              const err = await vRes.json().catch(() => ({}));
              throw new Error(err.error || "Variant update failed");
            }
          }
        }
      });

      toast.success(`Saved ${toSave.length} · deleted ${toDelete.length}`);
      isCreateMode ? setProducts([createEmptyRow()]) : fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ─ Derived state ─

  const modifiedCount = products.filter(
    (p) => (p.isNew || p.isModified) && !p.isDeleted,
  ).length;
  const deletedCount = products.filter((p) => p.isDeleted).length;
  const visibleProducts = products.filter((p) => !p.isDeleted);

  const validationIssues = visibleProducts
    .map((p) => {
      const issues: string[] = [];
      if (!p.title.trim()) issues.push("Missing title");
      if (!p.price || Number(p.price) <= 0) issues.push("Missing price");
      if (!p.handle.trim()) issues.push("Missing handle");
      if (p.images.length < 1) issues.push("No images");
      return { id: p.id, title: p.title, issues };
    })
    .filter((item) => item.issues.length > 0);

  // ─ Render ─

  const visibleCols = DEFAULT_COLUMNS.filter((col) =>
    visibleColumns.has(col.key),
  );

  return (
    <div className="flex h-full min-w-0 flex-col gap-0 overflow-x-hidden">
      {/* ── Sticky toolbar ── */}
      <div className="sticky top-0 z-20 border-b w-full border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        {/* Primary bar */}
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-neutral-900 dark:text-neutral-100">
              {isCreateMode
                ? "Bulk Create"
                : selectedIds.length > 0
                  ? "Editing Selection"
                  : "Bulk Editor"}
            </h2>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              {isCreateMode
                ? "Build multiple products row by row, save all at once."
                : selectedIds.length > 0
                  ? `${selectedIds.length} products loaded for editing`
                  : `${visibleProducts.length} products · page ${currentPage} of ${totalPages}`}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {(modifiedCount > 0 || deletedCount > 0) && (
              <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400 sm:block">
                {modifiedCount} changed
                {deletedCount > 0 ? ` · ${deletedCount} to delete` : ""}
              </span>
            )}

            <button
              onClick={addNewRow}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add row
            </button>

            {!isCreateMode && (
              <button
                onClick={duplicateRows}
                disabled={selectedRows.size === 0}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Duplicate</span>
              </button>
            )}

            {!isCreateMode && (
              <button
                onClick={deleteSelected}
                disabled={selectedRows.size === 0}
                className="flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-sm text-red-500 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-40 dark:border-red-900/30 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Delete</span>
              </button>
            )}

            <button
              onClick={saveAllChanges}
              disabled={saving || (modifiedCount === 0 && deletedCount === 0)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saving ? "Saving…" : "Save all"}
            </button>

            <Link
              href="/admin/products"
              className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-500 transition hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </Link>
          </div>
        </div>

        {/* Secondary bar */}
        <div className="flex items-center gap-2 border-t border-neutral-100 px-5 py-2 dark:border-neutral-800/60">
          {!isCreateMode && (
            <>
              <button
                onClick={() => applyBulkAvailability(true)}
                disabled={selectedRows.size === 0}
                className="flex items-center gap-1.5 rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-300"
              >
                <Eye className="h-3 w-3" /> Set available
              </button>
              <button
                onClick={() => applyBulkAvailability(false)}
                disabled={selectedRows.size === 0}
                className="flex items-center gap-1.5 rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-300"
              >
                <EyeOff className="h-3 w-3" /> Set unavailable
              </button>
              <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
            </>
          )}

          {/* Column picker */}
          <div className="relative" ref={columnMenuRef}>
            <button
              onClick={() => setShowColumnsMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
            >
              <Settings2 className="h-3 w-3" /> Columns
              <ChevronDown
                className={`h-3 w-3 transition-transform ${showColumnsMenu ? "rotate-180" : ""}`}
              />
            </button>
            {showColumnsMenu && (
              <div className="absolute left-0 top-full z-30 mt-1.5 min-w-[200px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                <div className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    Toggle columns
                  </p>
                </div>
                {DEFAULT_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border transition ${visibleColumns.has(col.key) ? "border-slate-600 bg-slate-700" : "border-neutral-300 dark:border-neutral-600"}`}
                    >
                      {visibleColumns.has(col.key) && (
                        <Check className="h-2.5 w-2.5 text-white" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={visibleColumns.has(col.key)}
                      onChange={() => {
                        setVisibleColumns((prev) => {
                          const next = new Set(prev);
                          next.has(col.key)
                            ? next.delete(col.key)
                            : next.add(col.key);
                          return next;
                        });
                      }}
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-200">
                      {col.label}
                      {col.optional && (
                        <span className="ml-1 text-[10px] text-neutral-400">
                          opt
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Search (non-create mode) */}
          {!isCreateMode && selectedIds.length === 0 && (
            <div className="relative ml-auto">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                placeholder="Search products…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 pl-7 pr-3 text-xs text-neutral-800 focus:border-slate-400 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex min-h-0 min-w-0 flex-1 overflow-x-hidden">
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-col transition-all ${activeProduct ? "pr-[500px]" : ""}`}
        >
          {/* Summary / validation strip */}
          {(validationIssues.length > 0 || modifiedCount > 0) && (
            <div className="flex items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-5 py-2 dark:border-neutral-800 dark:bg-neutral-900/50">
              {modifiedCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <RefreshCw className="h-3 w-3" />
                  {modifiedCount} unsaved change{modifiedCount > 1 ? "s" : ""}
                </span>
              )}
              {validationIssues.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  {validationIssues.length} row
                  {validationIssues.length > 1 ? "s" : ""} need attention —{" "}
                  {validationIssues.slice(0, 2).map((i) => (
                    <button
                      key={i.id}
                      onClick={() => setActiveProductId(i.id)}
                      className="underline underline-offset-2 hover:text-red-700"
                    >
                      {i.title || "Untitled"}
                    </button>
                  ))}
                  {validationIssues.length > 2 &&
                    ` +${validationIssues.length - 2} more`}
                </span>
              )}
            </div>
          )}

          {/* Table */}
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm text-neutral-400">Loading products…</p>
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24">
                <Package className="h-10 w-10 text-neutral-200 dark:text-neutral-700" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                    No products yet
                  </p>
                  <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                    Click "Add row" to create your first product.
                  </p>
                </div>
              </div>
            ) : (
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900">
                  <tr>
                    <th className="w-10 border-b border-r border-neutral-200 px-3 py-2.5 dark:border-neutral-800">
                      <button
                        onClick={toggleAllRows}
                        className={`flex h-4 w-4 items-center justify-center rounded border-2 transition ${selectedRows.size === visibleProducts.length && visibleProducts.length > 0 ? "border-slate-600 bg-slate-700" : "border-neutral-300 dark:border-neutral-600"}`}
                      >
                        {selectedRows.size === visibleProducts.length &&
                          visibleProducts.length > 0 && (
                            <Check className="h-2.5 w-2.5 text-white" />
                          )}
                      </button>
                    </th>
                    <th className="border-b border-r border-neutral-200 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
                      #
                    </th>
                    {visibleCols.map((col) => (
                      <th
                        key={col.key}
                        style={{ minWidth: col.width, maxWidth: col.width }}
                        className="border-b border-r border-neutral-200 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-400 last:border-r-0 dark:border-neutral-800 dark:text-neutral-500"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="w-24 border-b border-neutral-200 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
                      Status
                    </th>
                    <th className="w-20 border-b border-neutral-200 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
                      Images
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product, rowIndex) => {
                    const isActive = activeProductId === product.id;
                    const isSelected = selectedRows.has(product.id);
                    return (
                      <tr
                        key={product.id}
                        onClick={() =>
                          setActiveProductId(isActive ? null : product.id)
                        }
                        className={`group cursor-pointer transition-colors ${
                          isActive
                            ? "bg-slate-50 dark:bg-slate-900/40"
                            : isSelected
                              ? "bg-blue-50/50 dark:bg-blue-950/20"
                              : "bg-white hover:bg-neutral-50/80 dark:bg-neutral-950 dark:hover:bg-neutral-900/60"
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="border-b border-r border-neutral-100 px-3 py-2.5 dark:border-neutral-800/60"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => toggleRow(product.id)}
                            className={`flex h-4 w-4 items-center justify-center rounded border-2 transition ${isSelected ? "border-slate-600 bg-slate-700" : "border-neutral-300 dark:border-neutral-600"}`}
                          >
                            {isSelected && (
                              <Check className="h-2.5 w-2.5 text-white" />
                            )}
                          </button>
                        </td>

                        {/* Row number + indicator */}
                        <td className="border-b border-r border-neutral-100 px-3 py-2.5 dark:border-neutral-800/60">
                          <div className="flex items-center gap-2">
                            {product.isNew && (
                              <div
                                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                                title="New"
                              />
                            )}
                            {product.isModified && !product.isNew && (
                              <div
                                className="h-1.5 w-1.5 rounded-full bg-amber-500"
                                title="Modified"
                              />
                            )}
                            {!product.isNew && !product.isModified && (
                              <div className="h-1.5 w-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                            )}
                            <span className="font-mono text-xs text-neutral-400">
                              {rowIndex + 1}
                            </span>
                          </div>
                        </td>

                        {/* Data cells */}
                        {visibleCols.map((col) => (
                          <td
                            key={col.key}
                            style={{ minWidth: col.width, maxWidth: col.width }}
                            className="border-b border-r border-neutral-100 px-2 py-1.5 last:border-r-0 dark:border-neutral-800/60"
                          >
                            <TableCell
                              product={product}
                              column={col}
                              isEditing={
                                editingCell?.rowId === product.id &&
                                editingCell?.column === col.key
                              }
                              onStartEdit={() =>
                                setEditingCell({
                                  rowId: product.id,
                                  column: col.key,
                                })
                              }
                              onEndEdit={() => setEditingCell(null)}
                              onCellChange={(value) =>
                                updateCell(product.id, col.key, value)
                              }
                              onOpenDescription={() =>
                                setDescriptionModal({
                                  rowId: product.id,
                                  html:
                                    product.descriptionHtml ||
                                    product.description,
                                })
                              }
                              onOpenCollections={() =>
                                setCollectionsModal({
                                  rowId: product.id,
                                  selected: product.collections,
                                })
                              }
                            />
                          </td>
                        ))}

                        {/* Status */}
                        <td className="border-b border-neutral-100 px-3 py-2.5 text-center dark:border-neutral-800/60">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              product.availableForSale
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                            }`}
                          >
                            {product.availableForSale ? (
                              <Eye className="h-2.5 w-2.5" />
                            ) : (
                              <EyeOff className="h-2.5 w-2.5" />
                            )}
                            {product.availableForSale ? "Live" : "Hidden"}
                          </span>
                        </td>

                        {/* Images */}
                        <td className="border-b border-neutral-100 px-3 py-2.5 text-center dark:border-neutral-800/60">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              product.images.length === 0
                                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                            }`}
                          >
                            {product.images.length}/5
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!isCreateMode && totalPages > 1 && selectedIds.length === 0 && (
            <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-3 dark:border-neutral-800">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <span className="text-xs text-neutral-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      {activeProduct && (
        <DetailPanel
          product={activeProduct}
          collections={collections}
          onClose={() => setActiveProductId(null)}
          onUpdate={(updates) => updateProduct(activeProduct.id, updates)}
          onCellChange={(col, value) =>
            updateCell(activeProduct.id, col, value)
          }
          onOpenDescription={() =>
            setDescriptionModal({
              rowId: activeProduct.id,
              html: activeProduct.descriptionHtml || activeProduct.description,
            })
          }
          onUploadImages={handleImageUpload}
          onRemoveImage={removeImage}
          onSetFeatured={setFeaturedImage}
          onMoveImage={moveImage}
          onAddVariant={() => addVariant(activeProduct.id)}
          onUpdateVariant={(variantId, field, value) =>
            updateVariant(activeProduct.id, variantId, field, value)
          }
          onDeleteVariant={(variantId) =>
            deleteVariant(activeProduct.id, variantId)
          }
        />
      )}

      {/* ── Modals ── */}
      {descriptionModal && (
        <DescriptionModal
          html={descriptionModal.html}
          onClose={() => setDescriptionModal(null)}
          onSave={(html, text) => {
            const current = products.find(
              (p) => p.id === descriptionModal.rowId,
            );
            updateProduct(descriptionModal.rowId, {
              descriptionHtml: html,
              description: text,
              seoDescription:
                current?.seoDescription || generateSeoDescription(html),
            });
            setDescriptionModal(null);
          }}
        />
      )}

      {collectionsModal && (
        <CollectionsModal
          collections={collections}
          selected={collectionsModal.selected}
          onClose={() => setCollectionsModal(null)}
          onSave={(ids) => {
            updateProduct(collectionsModal.rowId, { collections: ids });
            setCollectionsModal(null);
          }}
        />
      )}
    </div>
  );
}
