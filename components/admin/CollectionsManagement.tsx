"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import LoadingDots from "components/loading-dots";

interface Collection {
  id: string;
  handle: string;
  title: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    productCollections: number;
  };
}

interface CollectionsManagementProps {
  collections: Collection[];
  currentPage: number;
  totalPages: number;
  total: number;
  perPage: number;
  searchParams: { search?: string };
}

/* ─── Modal ─────────────────────────────────────────────────────────────── */

function Modal({
  heading,
  formData,
  setFormData,
  onSubmit,
  onClose,
  isLoading,
  submitLabel,
}: {
  heading: string;
  formData: { handle: string; title: string; description: string; seoTitle: string; seoDescription: string };
  setFormData: (d: typeof formData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  const field =
    "block w-full border-b border-neutral-300 bg-transparent py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100";
  const label =
    "mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl border border-neutral-900 bg-white shadow-2xl dark:border-neutral-100 dark:bg-neutral-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-8 py-5 dark:border-neutral-800">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
            {heading}
          </span>
          <button
            onClick={onClose}
            className="text-neutral-400 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-8 py-7">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="col-span-2 sm:col-span-1">
              <label className={label}>Title <span className="text-neutral-900 dark:text-neutral-100">*</span></label>
              <input
                required
                type="text"
                placeholder="e.g. Summer Picks"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={field}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className={label}>Handle <span className="text-neutral-900 dark:text-neutral-100">*</span></label>
              <div className="flex items-end gap-1">
                <span className="pb-2.5 text-sm text-neutral-400">/</span>
                <input
                  required
                  type="text"
                  placeholder="summer-picks"
                  value={formData.handle}
                  onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                  className={`${field} flex-1`}
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className={label}>Description</label>
              <textarea
                rows={2}
                placeholder="Short description of this collection"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${field} resize-none`}
              />
            </div>

            <div className="col-span-2 border-t border-neutral-100 pt-5 dark:border-neutral-800">
              <p className={`${label} mb-4`}>SEO</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="col-span-2 sm:col-span-1">
                  <label className={label}>Meta Title</label>
                  <input
                    type="text"
                    placeholder="Overrides title in search"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    className={field}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={label}>Meta Description</label>
                  <input
                    type="text"
                    placeholder="Overrides description in search"
                    value={formData.seoDescription}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    className={field}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex min-w-[148px] items-center justify-center border border-neutral-900 bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-neutral-900 disabled:opacity-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-transparent dark:hover:text-neutral-100"
            >
              {isLoading ? <LoadingDots className="bg-white dark:bg-neutral-900" /> : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Row ────────────────────────────────────────────────────────────────── */

function CollectionRow({
  collection,
  index,
  onEdit,
  onDelete,
}: {
  collection: Collection;
  index: number;
  onEdit: (c: Collection) => void;
  onDelete: (id: string) => void;
}) {
  const pad = String(index + 1).padStart(2, "0");
  const hasProducts = collection._count.productCollections > 0;
  const updated = new Date(collection.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group relative border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-6 px-6 py-5 transition-colors duration-150 group-hover:bg-neutral-900 dark:group-hover:bg-neutral-100">
        {/* Index */}
        <span className="w-8 shrink-0 font-mono text-xs text-neutral-300 transition-colors group-hover:text-neutral-500 dark:text-neutral-600 dark:group-hover:text-neutral-400">
          {pad}
        </span>

        {/* Title + description */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight text-neutral-900 transition-colors group-hover:text-white dark:text-neutral-100 dark:group-hover:text-neutral-900">
            {collection.title}
          </p>
          {collection.description && (
            <p className="mt-0.5 truncate text-xs text-neutral-400 transition-colors group-hover:text-neutral-400 dark:group-hover:text-neutral-500">
              {collection.description}
            </p>
          )}
        </div>

        {/* Handle */}
        <span className="hidden w-40 shrink-0 truncate font-mono text-xs text-neutral-400 transition-colors group-hover:text-neutral-500 dark:group-hover:text-neutral-500 sm:block">
          /{collection.handle}
        </span>

        {/* Product count */}
        <span className="hidden w-24 shrink-0 text-right text-xs text-neutral-500 transition-colors group-hover:text-neutral-400 dark:group-hover:text-neutral-500 md:block">
          {collection._count.productCollections}{" "}
          {collection._count.productCollections === 1 ? "product" : "products"}
        </span>

        {/* Updated */}
        <span className="hidden w-28 shrink-0 text-right text-xs text-neutral-400 transition-colors group-hover:text-neutral-500 dark:group-hover:text-neutral-500 lg:block">
          {updated}
        </span>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(collection)}
            className="rounded px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/30 transition-colors hover:bg-white hover:text-neutral-900 dark:text-neutral-900 dark:ring-neutral-900/30 dark:hover:bg-neutral-900 dark:hover:text-white"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(collection.id)}
            disabled={hasProducts}
            title={hasProducts ? "Remove products first" : "Delete"}
            className="rounded px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-900/50 dark:hover:text-neutral-900"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */

export default function CollectionsManagement({
  collections,
  currentPage,
  totalPages,
  total,
  perPage,
  searchParams,
}: CollectionsManagementProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(false);

  const empty = { handle: "", title: "", description: "", seoTitle: "", seoDescription: "" };
  const [form, setForm] = useState(empty);

  const qs = (page: number) => {
    const p = new URLSearchParams();
    if (searchParams.search) p.set("search", searchParams.search);
    p.set("page", String(page));
    return p.toString();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Collection created");
        setAddOpen(false);
        setForm(empty);
        router.refresh();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to create");
      }
    } catch {
      toast.error("Failed to create");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/collections/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Collection updated");
        setEditOpen(false);
        setSelected(null);
        router.refresh();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this collection? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Collection deleted");
        router.refresh();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const openEdit = (c: Collection) => {
    setSelected(c);
    setForm({
      handle: c.handle,
      title: c.title,
      description: c.description || "",
      seoTitle: c.seoTitle || "",
      seoDescription: c.seoDescription || "",
    });
    setEditOpen(true);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form action="/admin/collections" method="get" className="flex items-center gap-0">
          <input
            type="search"
            name="search"
            defaultValue={searchParams.search}
            placeholder="Search…"
            className="w-56 border-b border-neutral-300 bg-transparent py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
          />
          <button
            type="submit"
            className="ml-4 border-b border-transparent py-2 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-900 hover:text-neutral-900 dark:hover:border-neutral-100 dark:hover:text-neutral-100"
          >
            Search
          </button>
        </form>

        <button
          onClick={() => { setForm(empty); setAddOpen(true); }}
          className="inline-flex items-center gap-2 border border-neutral-900 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-neutral-900 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-transparent dark:hover:text-neutral-100"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Collection
        </button>
      </div>

      {/* Index table */}
      <div className="border border-neutral-200 dark:border-neutral-800">
        {/* Column headers */}
        <div className="flex items-center gap-6 border-b border-neutral-200 bg-neutral-50 px-6 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/60">
          <span className="w-8 shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">#</span>
          <span className="flex-1 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">Collection</span>
          <span className="hidden w-40 shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400 sm:block">Handle</span>
          <span className="hidden w-24 shrink-0 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400 md:block">Products</span>
          <span className="hidden w-28 shrink-0 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400 lg:block">Updated</span>
          <span className="w-28 shrink-0" />
        </div>

        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
            <p className="text-sm font-medium text-neutral-500">No collections found</p>
            <p className="mt-1 text-xs text-neutral-400">
              {searchParams.search
                ? "Try a different search term."
                : "Create your first collection to get started."}
            </p>
            {!searchParams.search && (
              <button
                onClick={() => { setForm(empty); setAddOpen(true); }}
                className="mt-6 border-b border-neutral-900 pb-0.5 text-sm font-medium text-neutral-900 transition-colors hover:border-transparent hover:text-neutral-500 dark:border-neutral-100 dark:text-neutral-100"
              >
                Create collection →
              </button>
            )}
          </div>
        ) : (
          collections.map((c, i) => (
            <CollectionRow
              key={c.id}
              collection={c}
              index={(currentPage - 1) * perPage + i}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, total)} of {total}
          </p>

          <div className="flex items-center gap-1">
            <Link
              href={`/admin/collections?${qs(currentPage - 1)}`}
              aria-disabled={currentPage <= 1}
              className={`flex h-8 w-8 items-center justify-center border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-100 dark:hover:text-neutral-100 ${currentPage <= 1 ? "pointer-events-none opacity-25" : ""}`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </Link>

            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) p = i + 1;
              else if (currentPage <= 4) p = i + 1;
              else if (currentPage >= totalPages - 3) p = totalPages - 6 + i;
              else p = currentPage - 3 + i;

              return (
                <Link
                  key={p}
                  href={`/admin/collections?${qs(p)}`}
                  className={`flex h-8 w-8 items-center justify-center border text-xs font-medium transition-colors ${
                    currentPage === p
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-100 dark:hover:text-neutral-100"
                  }`}
                >
                  {p}
                </Link>
              );
            })}

            <Link
              href={`/admin/collections?${qs(currentPage + 1)}`}
              aria-disabled={currentPage >= totalPages}
              className={`flex h-8 w-8 items-center justify-center border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-100 dark:hover:text-neutral-100 ${currentPage >= totalPages ? "pointer-events-none opacity-25" : ""}`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Modals */}
      {addOpen && (
        <Modal
          heading="New Collection"
          formData={form}
          setFormData={setForm}
          onSubmit={handleAdd}
          onClose={() => setAddOpen(false)}
          isLoading={loading}
          submitLabel="Create Collection"
        />
      )}
      {editOpen && selected && (
        <Modal
          heading="Edit Collection"
          formData={form}
          setFormData={setForm}
          onSubmit={handleEdit}
          onClose={() => setEditOpen(false)}
          isLoading={loading}
          submitLabel="Save Changes"
        />
      )}
    </>
  );
}