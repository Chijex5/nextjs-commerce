"use client";

import { EmptyState, StatusPill } from "components/admin/ui";
import { ImageUpload } from "components/admin/ui/image-upload";
import { RichTextEditor } from "components/admin/ui/rich-text-editor";
import { buttonClass } from "components/ui/button";
import { Sheet } from "components/ui/sheet";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export type ShowcaseItem = {
  id: string;
  title: string;
  customerStory: string;
  beforeImage: string;
  afterImage: string;
  details: string[];
  completionTime: string;
  position: number;
  isPublished: boolean;
};

type Draft = Omit<ShowcaseItem, "id" | "position">;
const EMPTY: Draft = {
  title: "",
  customerStory: "",
  beforeImage: "",
  afterImage: "",
  details: [],
  completionTime: "",
  isPublished: true,
};

const input =
  "h-11 w-full border border-line bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-fg";

async function put(item: ShowcaseItem) {
  const { id, ...body } = item;
  const res = await fetch(`/api/admin/custom-orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => ({}))).error || "Couldn't save",
    );
}

export function ShowcaseManager({ items }: { items: ShowcaseItem[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<ShowcaseItem | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = () => startTransition(() => router.refresh());

  const open = (item: ShowcaseItem | "new") => {
    setEditing(item);
    setDetail("");
    setDraft(item === "new" ? EMPTY : { ...item });
  };

  async function run(fn: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(success);
      refresh();
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!draft.title.trim()) return toast.error("Give the story a title");
    const ok = await run(
      async () => {
        if (editing === "new") {
          const res = await fetch("/api/admin/custom-orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...draft, position: items.length }),
          });
          if (!res.ok)
            throw new Error(
              (await res.json().catch(() => ({}))).error || "Couldn't save",
            );
        } else if (editing) {
          await put({ ...editing, ...draft });
        }
      },
      editing === "new" ? "Story added" : "Story saved",
    );
    if (ok) setEditing(null);
  }

  // Swap with a neighbour and renumber everything so positions stay clean.
  const move = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(index + dir, 0, moved!);
    const changed = next
      .map((it, i) => ({ ...it, position: i }))
      .filter((it, i) => items[i]?.id !== it.id || items[i]?.position !== i);
    return run(() => Promise.all(changed.map(put)), "Order saved");
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => open("new")}
          className={buttonClass("solid", "md")}
        >
          <Plus className="size-4" /> Add story
        </button>
      </div>

      {items.length === 0 ? (
        <div className="border border-line px-5">
          <EmptyState title="No stories yet">
            Add a before-and-after from a custom order to show what you can
            make.
          </EmptyState>
        </div>
      ) : (
        <ol className="grid gap-px border border-line bg-line md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, i) => (
            <li key={item.id} className="flex flex-col bg-canvas">
              <div className="grid grid-cols-2 gap-px bg-line">
                {(["beforeImage", "afterImage"] as const).map((key) => (
                  <div key={key} className="relative aspect-square bg-plate">
                    {item[key] ? (
                      <Image
                        src={item[key]}
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
                        className="object-cover"
                      />
                    ) : null}
                    <span className="absolute left-2 top-2 bg-canvas px-1.5 py-0.5 font-mono text-[10px] uppercase">
                      {key === "beforeImage" ? "Before" : "After"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] text-fg-3">
                      {String(i + 1).padStart(2, "0")}
                      {i >= 6 ? " · not shown (only the first 6 appear)" : ""}
                    </p>
                    <h2 className="mt-1 truncate font-medium text-fg">
                      {item.title}
                    </h2>
                    {item.completionTime ? (
                      <p className="text-xs text-fg-3">
                        Made in {item.completionTime}
                      </p>
                    ) : null}
                  </div>
                  <StatusPill tone={item.isPublished ? "positive" : "neutral"}>
                    {item.isPublished ? "Live" : "Hidden"}
                  </StatusPill>
                </div>
                <div className="mt-auto flex items-center gap-1 pt-4">
                  <button
                    type="button"
                    disabled={busy || i === 0}
                    onClick={() => move(i, -1)}
                    aria-label="Move earlier"
                    className="grid size-9 place-items-center text-fg-3 hover:bg-plate hover:text-fg disabled:opacity-30"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busy || i === items.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label="Move later"
                    className="grid size-9 place-items-center text-fg-3 hover:bg-plate hover:text-fg disabled:opacity-30"
                  >
                    <ArrowRight className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => put({ ...item, isPublished: !item.isPublished }),
                        item.isPublished ? "Hidden from the site" : "Now live",
                      )
                    }
                    aria-label={item.isPublished ? "Hide" : "Publish"}
                    className="grid size-9 place-items-center text-fg-3 hover:bg-plate hover:text-fg"
                  >
                    {item.isPublished ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => open(item)}
                    aria-label="Edit"
                    className="ml-auto grid size-9 place-items-center text-fg-3 hover:bg-plate hover:text-fg"
                  >
                    <Pencil className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New story" : "Edit story"}
        footer={
          <div className="flex gap-2">
            {editing && editing !== "new" ? (
              <button
                type="button"
                disabled={busy}
                aria-label="Delete story"
                onClick={async () => {
                  if (!window.confirm("Delete this story?")) return;
                  const ok = await run(async () => {
                    const res = await fetch(
                      `/api/admin/custom-orders/${editing.id}`,
                      { method: "DELETE" },
                    );
                    if (!res.ok) throw new Error("Couldn't delete");
                  }, "Story deleted");
                  if (ok) setEditing(null);
                }}
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
              {editing === "new" ? "Add story" : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <label className="block">
            <span className="label mb-1.5 block text-fg-3">Title</span>
            <input
              value={draft.title}
              onChange={(e) =>
                setDraft((d) => ({ ...d, title: e.target.value }))
              }
              placeholder="e.g. Wedding slides for Tolu's party"
              className={input}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <ImageUpload
              label="Before"
              value={draft.beforeImage}
              onChange={(url) => setDraft((d) => ({ ...d, beforeImage: url }))}
            />
            <ImageUpload
              label="After"
              value={draft.afterImage}
              onChange={(url) => setDraft((d) => ({ ...d, afterImage: url }))}
            />
          </div>
          <div>
            <span className="label mb-1.5 block text-fg-3">The story</span>
            <RichTextEditor
              label="Customer story"
              value={draft.customerStory}
              onChange={(html) =>
                setDraft((d) => ({ ...d, customerStory: html }))
              }
              minHeight={140}
            />
          </div>
          <div>
            <span className="label mb-1.5 block text-fg-3">Details</span>
            {draft.details.length ? (
              <ul className="mb-2 flex flex-wrap gap-1.5">
                {draft.details.map((d, i) => (
                  <li
                    key={d + i}
                    className="flex items-center gap-1 border border-line py-1 pl-2 pr-1 text-xs"
                  >
                    {d}
                    <button
                      type="button"
                      aria-label={`Remove ${d}`}
                      onClick={() =>
                        setDraft((x) => ({
                          ...x,
                          details: x.details.filter((_, j) => j !== i),
                        }))
                      }
                      className="grid size-5 place-items-center text-fg-3 hover:text-fg"
                    >
                      <X className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <input
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && detail.trim()) {
                  e.preventDefault();
                  setDraft((d) => ({
                    ...d,
                    details: [...d.details, detail.trim()],
                  }));
                  setDetail("");
                }
              }}
              placeholder="Type a detail and press Enter, e.g. Hand-stitched sole"
              className={input}
            />
          </div>
          <label className="block">
            <span className="label mb-1.5 block text-fg-3">Time to make</span>
            <input
              value={draft.completionTime}
              onChange={(e) =>
                setDraft((d) => ({ ...d, completionTime: e.target.value }))
              }
              placeholder="e.g. 10 days"
              className={input}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={draft.isPublished}
              onChange={(e) =>
                setDraft((d) => ({ ...d, isPublished: e.target.checked }))
              }
              className="size-4"
            />
            <span className="text-sm">Show on the Custom orders page</span>
          </label>
        </div>
      </Sheet>
    </>
  );
}
