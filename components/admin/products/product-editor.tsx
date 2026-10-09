"use client";

import ImageCropModal from "components/admin/ImageCropModal";
import { Panel, StatList, StatRow, StatusPill } from "components/admin/ui";
import { uploadImage } from "components/admin/ui/image-upload";
import { RichTextEditor } from "components/admin/ui/rich-text-editor";
import { buttonClass } from "components/ui/button";
import clsx from "clsx";
import { money, pairs, timeAgo } from "lib/admin/format";
import {
  previewVariants,
  sizeRange,
  type PricingModel,
  type SizeRule,
} from "lib/admin/product-pricing";
import {
  generateSeoDescription,
  generateSeoTitle,
  generateSlug,
} from "lib/admin-utils";
import {
  PRODUCT_IMAGE_ASPECT,
  PRODUCT_IMAGE_HEIGHT,
  PRODUCT_IMAGE_WIDTH,
} from "lib/image-constants";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ImagePlus,
  Loader2,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const MAX_IMAGES = 8;

type Img = { url: string; width: number; height: number };

export type ProductEditorValues = {
  id?: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  availableForSale: boolean;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  images: Img[];
  collectionIds: string[];
  pricing: PricingModel;
  /** False when saved prices can't be shown as simple rules. */
  pricingExact: boolean;
};

export type ProductStats = {
  units30d: number;
  revenue30d: number;
  lastSoldAt: string | null;
  orders: number;
};

const input =
  "h-11 w-full border border-line bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-fg";

const htmlToText = (html: string) =>
  html
    .replace(/<\/(p|h\d|li|blockquote)>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

function Chips({
  values,
  onChange,
  placeholder,
  label,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  label: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const next = draft
      .split(",")
      .map((s) => s.trim())
      .filter(
        (s) => s && !values.some((v) => v.toLowerCase() === s.toLowerCase()),
      );
    if (next.length) onChange([...values, ...next]);
    setDraft("");
  };
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 border border-line px-2 py-1.5 focus-within:border-fg">
      {values.map((v, i) => (
        <span
          key={v + i}
          className="flex items-center gap-1 bg-plate py-0.5 pl-2 pr-1 text-xs"
        >
          {v}
          <button
            type="button"
            aria-label={`Remove ${v}`}
            onClick={() => onChange(values.filter((_, j) => j !== i))}
            className="grid size-5 place-items-center text-fg-3 hover:text-fg"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        aria-label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && values.length)
            onChange(values.slice(0, -1));
        }}
        onBlur={add}
        placeholder={values.length ? "" : placeholder}
        className="h-8 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-fg-3"
      />
    </div>
  );
}

export function ProductEditor({
  initial,
  collections,
  stats,
}: {
  initial: ProductEditorValues;
  collections: Array<{ id: string; title: string }>;
  stats?: ProductStats;
}) {
  const router = useRouter();
  const isNew = !initial.id;
  const [v, setV] = useState(initial);
  const [pricingTouched, setPricingTouched] = useState(isNew);
  const [handleTouched, setHandleTouched] = useState(!isNew);
  const [seoTouched, setSeoTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<ProductEditorValues>) =>
    setV((x) => ({ ...x, ...patch }));
  const setPricing = (patch: Partial<PricingModel>) => {
    setPricingTouched(true);
    setV((x) => ({ ...x, pricing: { ...x.pricing, ...patch } }));
  };
  const dirty = useMemo(
    () => JSON.stringify(v) !== JSON.stringify(initial),
    [v, initial],
  );

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const onTitle = (title: string) =>
    setV((x) => ({
      ...x,
      title,
      handle: handleTouched ? x.handle : generateSlug(title),
      seoTitle: seoTouched ? x.seoTitle : generateSeoTitle(title),
    }));

  const onDescription = (descriptionHtml: string) =>
    setV((x) => ({
      ...x,
      descriptionHtml,
      seoDescription: seoTouched
        ? x.seoDescription
        : generateSeoDescription(htmlToText(descriptionHtml)),
    }));

  async function save() {
    const p = v.pricing;
    if (!v.title.trim()) return toast.error("Give the product a name");
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(v.handle))
      return toast.error(
        "The URL can only use lowercase letters, numbers and hyphens",
      );
    if (pricingTouched) {
      if (!(p.basePrice > 0)) return toast.error("Set a price");
      if (!p.sizes.length && !p.colors.length)
        return toast.error("Add at least one size or colour");
      if (p.sizeRules.some((r) => !(r.from > 0) || !(r.price > 0)))
        return toast.error("Each size price rule needs a size and a price");
    }
    setSaving(true);
    const description = htmlToText(v.descriptionHtml);
    const payload = {
      title: v.title.trim(),
      handle: v.handle.trim(),
      description,
      descriptionHtml: v.descriptionHtml,
      availableForSale: v.availableForSale,
      seoTitle: v.seoTitle.trim(),
      seoDescription: v.seoDescription.trim().slice(0, 160),
      tags: v.tags,
      images: v.images.map((img, i) => ({
        ...img,
        position: i,
        isFeatured: i === 0,
      })),
      collectionIds: v.collectionIds,
      basePrice: p.basePrice,
      // Variants are only rebuilt when sizes/colours are sent, so untouched
      // pricing (including prices set in the bulk editor) is left alone.
      ...(pricingTouched
        ? {
            sizes: p.sizes,
            colors: p.colors,
            sizePriceRules: p.sizeRules,
            largeSizePrice: null,
            largeSizeFrom: null,
            colorPrices: Object.keys(p.colorPrices).length
              ? p.colorPrices
              : undefined,
          }
        : {}),
    };
    try {
      const res = await fetch(
        isNew ? "/api/admin/products" : `/api/admin/products/${initial.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.details || data.error || "Couldn't save the product",
        );
      toast.success(isNew ? "Product created" : "Saved");
      if (isNew && data?.id) router.replace(`/admin/products/${data.id}/edit`);
      else router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const variants = previewVariants(v.pricing);

  return (
    <div>
      {/* ── Header with contextual save ── */}
      <header className="sticky top-14 z-30 -mx-4 mb-8 border-b border-line bg-canvas/95 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-16 lg:-mx-10 lg:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/products"
              aria-label="Back to products"
              className="grid size-10 shrink-0 place-items-center border border-line hover:border-fg"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate font-head text-2xl font-extrabold uppercase leading-none [font-stretch:66%] sm:text-3xl">
                {v.title || "New product"}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <StatusPill tone={v.availableForSale ? "positive" : "neutral"}>
                  {v.availableForSale ? "Active" : "Hidden"}
                </StatusPill>
                {dirty ? (
                  <span className="text-xs text-amber-700 dark:text-amber-400">
                    Unsaved changes
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isNew ? (
              <a
                href={`/product/${initial.handle}`}
                target="_blank"
                rel="noreferrer"
                className={buttonClass("outline", "md")}
              >
                <ExternalLink className="size-4" /> View
              </a>
            ) : null}
            {dirty && !isNew ? (
              <button
                type="button"
                onClick={() => setV(initial)}
                className={buttonClass("outline", "md")}
              >
                Discard
              </button>
            ) : null}
            <button
              type="button"
              disabled={saving || (!dirty && !isNew)}
              onClick={save}
              className={buttonClass(
                dirty || isNew ? "solid" : "outline",
                "md",
              )}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {isNew ? "Create product" : dirty ? "Save" : "Saved"}
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Panel title="Basics">
            <label className="block">
              <span className="label mb-1.5 block text-fg-3">Name</span>
              <input
                value={v.title}
                onChange={(e) => onTitle(e.target.value)}
                placeholder="e.g. Lekki leather slide"
                className={input}
              />
            </label>
            <div className="mt-4">
              <span className="label mb-1.5 block text-fg-3">Description</span>
              <RichTextEditor
                label="Product description"
                value={v.descriptionHtml}
                onChange={onDescription}
                minHeight={200}
              />
            </div>
          </Panel>

          <Photos images={v.images} onChange={(images) => set({ images })} />

          <Panel
            title="Sizes, colours & prices"
            description="Every size and colour combination becomes something a customer can pick. Check the table below before saving."
          >
            {!v.pricingExact && !pricingTouched ? (
              <div className="mb-5 flex items-start gap-3 border border-amber-500/50 bg-amber-500/5 p-4 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium text-fg">
                    Some prices were set individually
                  </p>
                  <p className="mt-0.5 text-fg-2">
                    They can't be shown as simple rules, so they're kept as they
                    are. Changing anything below replaces them with the rules
                    you set here.
                  </p>
                </div>
              </div>
            ) : null}
            <Pricing model={v.pricing} onChange={setPricing} />
            <VariantTable variants={variants} />
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Status">
            <div className="space-y-px">
              {[
                {
                  value: true,
                  label: "Active",
                  hint: "Customers can see and buy it.",
                },
                {
                  value: false,
                  label: "Hidden",
                  hint: "Stays in your catalog, but not in the shop.",
                },
              ].map((o) => (
                <label
                  key={String(o.value)}
                  className={clsx(
                    "flex cursor-pointer items-start gap-3 border p-3",
                    v.availableForSale === o.value
                      ? "border-fg"
                      : "border-line",
                  )}
                >
                  <input
                    type="radio"
                    name="status"
                    checked={v.availableForSale === o.value}
                    onChange={() => set({ availableForSale: o.value })}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium">{o.label}</span>
                    <span className="block text-xs text-fg-3">{o.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </Panel>

          {stats ? (
            <Panel title="Performance">
              <StatList>
                <StatRow label="Sold · 30d" value={pairs(stats.units30d)} />
                <StatRow label="Sales · 30d" value={money(stats.revenue30d)} />
                <StatRow
                  label="Orders · all time"
                  value={stats.orders.toLocaleString("en-NG")}
                />
                <StatRow
                  label="Last sold"
                  value={
                    stats.lastSoldAt
                      ? timeAgo(new Date(stats.lastSoldAt))
                      : "Never"
                  }
                />
              </StatList>
            </Panel>
          ) : null}

          <Panel title="Organisation">
            <span className="label mb-2 block text-fg-3">Collections</span>
            {collections.length ? (
              <div className="max-h-56 space-y-px overflow-y-auto">
                {collections.map((c) => {
                  const on = v.collectionIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-3 py-1.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          set({
                            collectionIds: on
                              ? v.collectionIds.filter((id) => id !== c.id)
                              : [...v.collectionIds, c.id],
                          })
                        }
                        className="size-4"
                      />
                      {c.title}
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-fg-3">
                No collections yet.{" "}
                <Link href="/admin/collections" className="underline">
                  Create one
                </Link>
                .
              </p>
            )}
            <span className="label mb-2 mt-5 block text-fg-3">Tags</span>
            <Chips
              label="Tags"
              values={v.tags}
              onChange={(tags) => set({ tags })}
              placeholder="leather, unisex…"
            />
            <p className="mt-1 text-xs text-fg-3">
              Used by search. Press Enter after each tag.
            </p>
          </Panel>

          <Panel title="Search engine listing">
            <div className="mb-4 border border-line p-3">
              <p className="truncate text-sm text-[#1a0dab] dark:text-sky-400">
                {v.seoTitle || v.title || "Product name"}
              </p>
              <p className="truncate text-xs text-emerald-800 dark:text-emerald-500">
                dfootprint.me/product/{v.handle || "url"}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-fg-2">
                {v.seoDescription || "Add a description to show here."}
              </p>
            </div>
            <label className="block">
              <span className="label mb-1.5 block text-fg-3">URL</span>
              <div className="flex items-center border border-line focus-within:border-fg">
                <span className="pl-3 font-mono text-[11px] text-fg-3">
                  /product/
                </span>
                <input
                  value={v.handle}
                  onChange={(e) => {
                    setHandleTouched(true);
                    set({
                      handle: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-"),
                    });
                  }}
                  className="h-11 w-full bg-transparent px-1 font-mono text-sm outline-none"
                />
              </div>
            </label>
            <label className="mt-4 block">
              <span className="label mb-1.5 block text-fg-3">Page title</span>
              <input
                value={v.seoTitle}
                onChange={(e) => {
                  setSeoTouched(true);
                  set({ seoTitle: e.target.value });
                }}
                className={input}
              />
            </label>
            <label className="mt-4 block">
              <span className="label mb-1.5 flex justify-between text-fg-3">
                Meta description{" "}
                <span
                  className={
                    v.seoDescription.length > 160 ? "text-red-600" : ""
                  }
                >
                  {v.seoDescription.length}/160
                </span>
              </span>
              <textarea
                value={v.seoDescription}
                onChange={(e) => {
                  setSeoTouched(true);
                  set({ seoDescription: e.target.value });
                }}
                rows={3}
                className="w-full border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-fg"
              />
            </label>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

// ─── Photos ───────────────────────────────────────────────────────────────────

function Photos({
  images,
  onChange,
}: {
  images: Img[];
  onChange: (images: Img[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<File[]>([]);
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const done = useRef<Img[]>([]);

  useEffect(
    () => () => {
      if (src) URL.revokeObjectURL(src);
    },
    [src],
  );

  const nextInQueue = (files: File[]) => {
    setQueue(files);
    setSrc(files[0] ? URL.createObjectURL(files[0]) : null);
  };

  async function pick(list: FileList | null) {
    if (!list?.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0)
      return toast.error(`A product can have up to ${MAX_IMAGES} photos.`);
    const files = Array.from(list).slice(0, room);
    if (list.length > room)
      toast.error(`Only ${room} more photo${room === 1 ? "" : "s"} fit.`);
    setBusy("Preparing…");
    const prepared: File[] = [];
    for (const f of files) {
      if (
        /\.(heic|heif)$/i.test(f.name) ||
        f.type === "image/heic" ||
        f.type === "image/heif"
      ) {
        try {
          const { default: heic2any } = await import("heic2any");
          const out = await heic2any({
            blob: f,
            toType: "image/jpeg",
            quality: 0.9,
          });
          const blob = Array.isArray(out) ? out[0]! : out;
          prepared.push(
            new File([blob], f.name.replace(/\.(heic|heif)$/i, ".jpg"), {
              type: "image/jpeg",
            }),
          );
        } catch {
          toast.error(`Couldn't read ${f.name}. Try a JPG or PNG.`);
        }
      } else prepared.push(f);
    }
    setBusy(null);
    done.current = [];
    if (inputRef.current) inputRef.current.value = "";
    nextInQueue(prepared);
  }

  async function onCropped(blob: Blob) {
    const [current, ...rest] = queue;
    if (!current) return;
    const file = new File(
      [blob],
      current.name.replace(/\.[^.]+$/, "") + ".webp",
      { type: blob.type || "image/webp" },
    );
    setBusy("Uploading…");
    try {
      const url = await uploadImage(file);
      done.current.push({
        url,
        width: PRODUCT_IMAGE_WIDTH,
        height: PRODUCT_IMAGE_HEIGHT,
      });
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(null);
    if (rest.length) nextInQueue(rest);
    else {
      onChange([...images, ...done.current]);
      nextInQueue([]);
    }
  }

  const move = (i: number, dir: -1 | 1) => {
    const next = [...images];
    const [m] = next.splice(i, 1);
    next.splice(i + dir, 0, m!);
    onChange(next);
  };

  return (
    <Panel
      title="Photos"
      description={`The first photo is the one shown in the shop. Up to ${MAX_IMAGES}, cropped to the same shape.`}
    >
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((img, i) => (
          <li
            key={img.url}
            className={clsx(
              "group relative overflow-hidden bg-plate",
              i === 0 ? "col-span-2 row-span-2" : "",
            )}
            style={{ aspectRatio: String(PRODUCT_IMAGE_ASPECT) }}
          >
            <Image
              src={img.url}
              alt=""
              fill
              sizes="(min-width: 640px) 25vw, 33vw"
              className="object-cover"
            />
            {i === 0 ? (
              <span className="absolute left-2 top-2 bg-canvas px-1.5 py-0.5 font-mono text-[10px] uppercase">
                Main
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <div className="flex">
                <IconBtn
                  label="Move earlier"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowLeft className="size-3.5" />
                </IconBtn>
                <IconBtn
                  label="Move later"
                  disabled={i === images.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowRight className="size-3.5" />
                </IconBtn>
                {i !== 0 ? (
                  <IconBtn
                    label="Make main photo"
                    onClick={() =>
                      onChange([img, ...images.filter((_, j) => j !== i)])
                    }
                  >
                    <Star className="size-3.5" />
                  </IconBtn>
                ) : null}
              </div>
              <IconBtn
                label="Remove photo"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-3.5" />
              </IconBtn>
            </div>
          </li>
        ))}
        {images.length < MAX_IMAGES ? (
          <li
            style={{ aspectRatio: String(PRODUCT_IMAGE_ASPECT) }}
            className={images.length === 0 ? "col-span-2 row-span-2" : ""}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void pick(e.dataTransfer.files);
              }}
              className="flex size-full flex-col items-center justify-center gap-2 border border-dashed border-line text-xs text-fg-3 hover:border-fg hover:text-fg"
            >
              {busy ? (
                <Loader2 className="size-5 animate-spin" />
              ) : images.length ? (
                <Plus className="size-5" />
              ) : (
                <ImagePlus className="size-6" />
              )}
              {busy ??
                (images.length ? "Add" : "Add photos (or drop them here)")}
            </button>
          </li>
        ) : null}
      </ul>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="sr-only"
        onChange={(e) => pick(e.target.files)}
      />
      <ImageCropModal
        isOpen={!!src}
        imageSrc={src}
        aspect={PRODUCT_IMAGE_ASPECT}
        outputWidth={PRODUCT_IMAGE_WIDTH}
        outputHeight={PRODUCT_IMAGE_HEIGHT}
        title={
          queue.length > 1 ? `Crop photo (${queue.length} left)` : "Crop photo"
        }
        onCancel={() => {
          if (done.current.length) onChange([...images, ...done.current]);
          nextInQueue([]);
        }}
        onConfirm={onCropped}
      />
    </Panel>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center bg-canvas/90 text-fg hover:bg-canvas disabled:opacity-30"
    >
      {children}
    </button>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing({
  model,
  onChange,
}: {
  model: PricingModel;
  onChange: (patch: Partial<PricingModel>) => void;
}) {
  const numericSizes = model.sizes
    .map((s) => Number.parseInt(s, 10))
    .filter((n) => !Number.isNaN(n));
  const [from, setFrom] = useState(
    String(numericSizes.length ? Math.min(...numericSizes) : 38),
  );
  const [to, setTo] = useState(
    String(numericSizes.length ? Math.max(...numericSizes) : 44),
  );

  const setRule = (i: number, patch: Partial<SizeRule>) =>
    onChange({
      sizeRules: model.sizeRules.map((r, j) =>
        j === i ? { ...r, ...patch } : r,
      ),
    });

  return (
    <div className="space-y-6">
      <label className="block max-w-xs">
        <span className="label mb-1.5 block text-fg-3">Price (₦)</span>
        <input
          inputMode="numeric"
          value={model.basePrice || ""}
          onChange={(e) =>
            onChange({
              basePrice: Number(e.target.value.replace(/[^\d.]/g, "")) || 0,
            })
          }
          placeholder="25000"
          className="h-12 w-full border border-line bg-canvas px-3 font-head text-2xl font-bold tabular-nums outline-none focus:border-fg"
        />
      </label>

      <div>
        <span className="label mb-1.5 block text-fg-3">Sizes</span>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-fg-3">Quick range: EU</span>
          <input
            aria-label="Smallest size"
            inputMode="numeric"
            value={from}
            onChange={(e) => setFrom(e.target.value.replace(/\D/g, ""))}
            className="h-9 w-16 border border-line bg-canvas px-2 text-center outline-none focus:border-fg"
          />
          <span className="text-fg-3">to</span>
          <input
            aria-label="Largest size"
            inputMode="numeric"
            value={to}
            onChange={(e) => setTo(e.target.value.replace(/\D/g, ""))}
            className="h-9 w-16 border border-line bg-canvas px-2 text-center outline-none focus:border-fg"
          />
          <button
            type="button"
            onClick={() => {
              const a = Number(from);
              const b = Number(to);
              if (!a || !b || a > b || b - a > 30)
                return toast.error("Pick a sensible size range, e.g. 38 to 46");
              onChange({ sizes: sizeRange(a, b) });
            }}
            className={buttonClass("outline", "md", "h-9")}
          >
            Use range
          </button>
        </div>
        <Chips
          label="Sizes"
          values={model.sizes}
          onChange={(sizes) => onChange({ sizes })}
          placeholder="Or type sizes, e.g. 40, 41, 42"
        />
      </div>

      <div>
        <span className="label mb-1.5 block text-fg-3">Colours</span>
        <Chips
          label="Colours"
          values={model.colors}
          onChange={(colors) => onChange({ colors })}
          placeholder="e.g. Black, Tan"
        />
      </div>

      <div>
        <span className="label mb-1.5 block text-fg-3">
          Bigger sizes cost more
        </span>
        {model.sizeRules.map((r, i) => (
          <div
            key={i}
            className="mb-2 flex flex-wrap items-center gap-2 text-sm"
          >
            <span className="text-fg-2">Size</span>
            <input
              aria-label="From size"
              inputMode="numeric"
              value={r.from || ""}
              onChange={(e) =>
                setRule(i, {
                  from: Number(e.target.value.replace(/\D/g, "")) || 0,
                })
              }
              className="h-9 w-16 border border-line bg-canvas px-2 text-center outline-none focus:border-fg"
            />
            <span className="text-fg-2">and up cost ₦</span>
            <input
              aria-label="Price"
              inputMode="numeric"
              value={r.price || ""}
              onChange={(e) =>
                setRule(i, {
                  price: Number(e.target.value.replace(/[^\d.]/g, "")) || 0,
                })
              }
              className="h-9 w-28 border border-line bg-canvas px-2 tabular-nums outline-none focus:border-fg"
            />
            <button
              type="button"
              aria-label="Remove rule"
              onClick={() =>
                onChange({
                  sizeRules: model.sizeRules.filter((_, j) => j !== i),
                })
              }
              className="grid size-9 place-items-center text-fg-3 hover:text-fg"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({
              sizeRules: [
                ...model.sizeRules,
                {
                  from: numericSizes.length
                    ? Math.max(...numericSizes) - 1
                    : 45,
                  price: model.basePrice
                    ? Math.round(model.basePrice * 1.1)
                    : 0,
                },
              ],
            })
          }
          className="label inline-flex items-center gap-1.5 text-fg-3 hover:text-fg"
        >
          <Plus className="size-3.5" /> Add size price
        </button>
      </div>

      {model.colors.length > 1 ? (
        <div>
          <span className="label mb-1.5 block text-fg-3">Colour prices</span>
          <p className="mb-2 text-xs text-fg-3">
            Leave blank to use the normal price. A colour price applies to every
            size.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {model.colors.map((c) => {
              const key = c.toLowerCase();
              return (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <span className="w-24 truncate text-fg-2">{c}</span>
                  <input
                    inputMode="numeric"
                    value={model.colorPrices[key] ?? ""}
                    onChange={(e) => {
                      const n = Number(e.target.value.replace(/[^\d.]/g, ""));
                      const next = { ...model.colorPrices };
                      if (n > 0) next[key] = n;
                      else delete next[key];
                      onChange({ colorPrices: next });
                    }}
                    placeholder="—"
                    className="h-9 w-full border border-line bg-canvas px-2 tabular-nums outline-none focus:border-fg"
                  />
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function VariantTable({
  variants,
}: {
  variants: Array<{ size: string; color: string; price: number }>;
}) {
  if (!variants.length) return null;
  const colors = [...new Set(variants.map((v) => v.color))];
  const sizes = [...new Set(variants.map((v) => v.size))];
  const price = (s: string, c: string) =>
    variants.find((v) => v.size === s && v.color === c)?.price ?? 0;
  return (
    <div className="mt-6 border-t border-line pt-5">
      <p className="label mb-3 text-fg-3">
        {variants.length} {variants.length === 1 ? "option" : "options"}{" "}
        customers can choose
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="border-b border-line text-left text-fg-3">
              <th className="py-2 pr-4 font-normal">
                {sizes[0] ? "Size" : "Colour"}
              </th>
              {sizes[0] ? (
                colors.map((c) => (
                  <th key={c} className="px-3 py-2 text-right font-normal">
                    {c || "Price"}
                  </th>
                ))
              ) : (
                <th className="px-3 py-2 text-right font-normal">Price</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sizes[0]
              ? sizes.map((s) => (
                  <tr key={s}>
                    <td className="py-1.5 pr-4 text-fg-2">{s}</td>
                    {colors.map((c) => (
                      <td key={c} className="px-3 py-1.5 text-right">
                        {money(price(s, c))}
                      </td>
                    ))}
                  </tr>
                ))
              : colors.map((c) => (
                  <tr key={c}>
                    <td className="py-1.5 pr-4 text-fg-2">{c}</td>
                    <td className="px-3 py-1.5 text-right">
                      {money(price("", c))}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
