"use client";

import { EmptyState } from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import { Sheet } from "components/ui/sheet";
import { money } from "lib/admin/format";
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export type CollectionCard = {
  id: string;
  handle: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  products: number;
  active: number;
  cover: string | null;
  sales30d: number;
};

type Form = Pick<
  CollectionCard,
  "title" | "handle" | "description" | "seoTitle" | "seoDescription"
>;
const EMPTY: Form = {
  title: "",
  handle: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const input =
  "h-11 w-full border border-line bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-fg";

export function CollectionsGrid({
  collections,
}: {
  collections: CollectionCard[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<CollectionCard | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [handleTouched, setHandleTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const open = (c: CollectionCard | "new") => {
    setEditing(c);
    setHandleTouched(c !== "new");
    setForm(
      c === "new"
        ? EMPTY
        : {
            title: c.title,
            handle: c.handle,
            description: c.description,
            seoTitle: c.seoTitle,
            seoDescription: c.seoDescription,
          },
    );
  };

  async function save() {
    if (!form.title.trim() || !form.handle.trim())
      return toast.error("A collection needs a name and a URL handle");
    setBusy(true);
    const isNew = editing === "new";
    const res = await fetch(
      isNew
        ? "/api/admin/collections"
        : `/api/admin/collections/${(editing as CollectionCard).id}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, handle: slugify(form.handle) }),
      },
    );
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      return toast.error(data.error || "Couldn't save the collection");
    toast.success(isNew ? "Collection created" : "Collection saved");
    setEditing(null);
    startTransition(() => router.refresh());
  }

  async function remove(c: CollectionCard) {
    if (
      !window.confirm(
        `Delete “${c.title}”? Its ${c.products} products stay in your catalog; they just leave this collection.`,
      )
    )
      return;
    setBusy(true);
    const res = await fetch(`/api/admin/collections/${c.id}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (!res.ok) return toast.error("Couldn't delete the collection");
    toast.success("Collection deleted");
    setEditing(null);
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => open("new")}
          className={buttonClass("solid", "md")}
        >
          <Plus className="size-4" /> New collection
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="border border-line px-5">
          <EmptyState title="No collections yet">
            Create one, then add products to it from each product's page.
          </EmptyState>
        </div>
      ) : (
        <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((c) => (
            <li key={c.id} className="group flex flex-col bg-canvas">
              <button
                type="button"
                onClick={() => open(c)}
                className="relative aspect-[4/3] w-full overflow-hidden bg-plate text-left"
              >
                {c.cover ? (
                  <Image
                    src={c.cover}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-xs text-fg-3">
                    No product photos yet
                  </span>
                )}
                <span className="absolute left-3 top-3 bg-canvas px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-fg">
                  {c.products} {c.products === 1 ? "product" : "products"}
                </span>
              </button>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-head text-2xl font-extrabold uppercase leading-none [font-stretch:66%]">
                      {c.title}
                    </h2>
                    <p className="mt-1 truncate font-mono text-[11px] text-fg-3">
                      /search/{c.handle}
                    </p>
                  </div>
                  <div className="flex shrink-0">
                    <a
                      href={`/search/${c.handle}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View ${c.title} in the shop`}
                      className="grid size-9 place-items-center text-fg-3 hover:bg-plate hover:text-fg"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => open(c)}
                      aria-label={`Edit ${c.title}`}
                      className="grid size-9 place-items-center text-fg-3 hover:bg-plate hover:text-fg"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </div>
                </div>
                {c.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-fg-2">
                    {c.description}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-fg-3">
                  <span>
                    {c.products
                      ? `${c.active} of ${c.products} in the shop`
                      : "Empty"}
                  </span>
                  <span className="tabular-nums">
                    {c.sales30d
                      ? `${money(c.sales30d)} · 30d`
                      : "No sales · 30d"}
                  </span>
                </div>
                <Link
                  href={`/admin/products?collection=${c.id}`}
                  className="label mt-3 text-fg-3 hover:text-fg"
                >
                  See products →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New collection" : "Edit collection"}
        footer={
          <div className="flex gap-2">
            {editing && editing !== "new" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(editing)}
                className={buttonClass(
                  "outline",
                  "md",
                  "hover:!border-red-600 hover:!bg-red-600 hover:!text-white",
                )}
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={save}
              className={buttonClass("solid", "md", "flex-1")}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {editing === "new" ? "Create collection" : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="label mb-1.5 block text-fg-3">Name</span>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  title: e.target.value,
                  handle: handleTouched ? f.handle : slugify(e.target.value),
                }))
              }
              placeholder="e.g. Wedding season"
              className={input}
            />
          </label>
          <label className="block">
            <span className="label mb-1.5 block text-fg-3">URL handle</span>
            <div className="flex items-center border border-line focus-within:border-fg">
              <span className="pl-3 font-mono text-xs text-fg-3">/search/</span>
              <input
                value={form.handle}
                onChange={(e) => {
                  setHandleTouched(true);
                  setForm((f) => ({ ...f, handle: e.target.value }));
                }}
                className="h-11 w-full bg-transparent px-1 font-mono text-sm outline-none"
              />
            </div>
            {editing !== "new" ? (
              <span className="mt-1 block text-xs text-fg-3">
                Changing this breaks old links to the collection.
              </span>
            ) : null}
          </label>
          <label className="block">
            <span className="label mb-1.5 block text-fg-3">Description</span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="w-full border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-fg"
            />
          </label>
          <details className="border-t border-line pt-4">
            <summary className="label cursor-pointer text-fg-3 hover:text-fg">
              Search engine listing
            </summary>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="label mb-1.5 block text-fg-3">Page title</span>
                <input
                  value={form.seoTitle}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, seoTitle: e.target.value }))
                  }
                  placeholder={form.title}
                  className={input}
                />
              </label>
              <label className="block">
                <span className="label mb-1.5 block text-fg-3">
                  Meta description
                </span>
                <textarea
                  value={form.seoDescription}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, seoDescription: e.target.value }))
                  }
                  rows={2}
                  placeholder={form.description}
                  className="w-full border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-fg"
                />
              </label>
              <div className="border border-line p-3">
                <p className="text-xs text-fg-3">Preview</p>
                <p className="mt-1 truncate text-sm text-[#1a0dab] dark:text-sky-400">
                  {form.seoTitle || form.title || "Collection title"} |
                  D&apos;FOOTPRINT
                </p>
                <p className="truncate text-xs text-emerald-800 dark:text-emerald-500">
                  dfootprint.me/search/{slugify(form.handle) || "handle"}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-fg-2">
                  {form.seoDescription ||
                    form.description ||
                    "Description shown in search results."}
                </p>
              </div>
            </div>
          </details>
        </div>
      </Sheet>
    </>
  );
}
