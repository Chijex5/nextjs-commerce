"use client";

import { EmptyState } from "components/admin/ui";
import { RichTextEditor } from "components/admin/ui/rich-text-editor";
import { buttonClass } from "components/ui/button";
import { Sheet } from "components/ui/sheet";
import { timeAgo } from "lib/admin/format";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type PageDoc = {
  id: string;
  handle: string;
  title: string;
  body: string;
  bodySummary: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
};
type MenuItem = { id: string; title: string; url: string };
type Menu = { id: string; handle: string; title: string; items: MenuItem[] };

const input =
  "h-11 w-full border border-line bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-fg";
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

export function ContentEditor({
  tab,
  pages,
  menus,
}: {
  tab: "pages" | "menus";
  pages: PageDoc[];
  menus: Menu[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());
  return tab === "pages" ? (
    <PagesTab pages={pages} refresh={refresh} />
  ) : (
    <MenusTab menus={menus} refresh={refresh} />
  );
}

// ─── Pages ────────────────────────────────────────────────────────────────────

const EMPTY_PAGE = {
  handle: "",
  title: "",
  body: "",
  bodySummary: "",
  seoTitle: "",
  seoDescription: "",
};

function PagesTab({
  pages,
  refresh,
}: {
  pages: PageDoc[];
  refresh: () => void;
}) {
  const [editing, setEditing] = useState<PageDoc | "new" | null>(null);
  const [form, setForm] = useState(EMPTY_PAGE);
  const [handleTouched, setHandleTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const open = (p: PageDoc | "new") => {
    setEditing(p);
    setHandleTouched(p !== "new");
    setForm(
      p === "new"
        ? EMPTY_PAGE
        : {
            handle: p.handle,
            title: p.title,
            body: p.body,
            bodySummary: p.bodySummary,
            seoTitle: p.seoTitle,
            seoDescription: p.seoDescription,
          },
    );
  };

  async function save() {
    if (!form.title.trim()) return toast.error("Give the page a title");
    setBusy(true);
    try {
      const isNew = editing === "new";
      await send(
        isNew
          ? "/api/admin/pages"
          : `/api/admin/pages/${(editing as PageDoc).id}`,
        isNew ? "POST" : "PUT",
        { ...form, handle: slugify(form.handle || form.title) },
      );
      toast.success(isNew ? "Page created" : "Page saved");
      setEditing(null);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: PageDoc) {
    if (
      !window.confirm(
        `Delete “${p.title}”? Links to /${p.handle} will stop working.`,
      )
    )
      return;
    setBusy(true);
    try {
      await send(`/api/admin/pages/${p.id}`, "DELETE");
      toast.success("Page deleted");
      setEditing(null);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => open("new")}
          className={buttonClass("solid", "md")}
        >
          <Plus className="size-4" /> New page
        </button>
      </div>
      {pages.length === 0 ? (
        <div className="border border-line px-5">
          <EmptyState title="No pages yet">
            Create pages like Shipping, Returns or Size guide.
          </EmptyState>
        </div>
      ) : (
        <ul className="divide-y divide-line border border-line">
          {pages.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-plate/60"
            >
              <button
                type="button"
                onClick={() => open(p)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-medium text-fg">
                  {p.title}
                </p>
                <p className="truncate text-xs text-fg-3">
                  <span className="font-mono">/{p.handle}</span> · edited{" "}
                  {timeAgo(new Date(p.updatedAt))}
                </p>
              </button>
              <a
                href={`/${p.handle}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`View ${p.title}`}
                className="grid size-9 place-items-center text-fg-3 hover:bg-plate hover:text-fg"
              >
                <ExternalLink className="size-4" />
              </a>
              <button
                type="button"
                onClick={() => open(p)}
                aria-label={`Edit ${p.title}`}
                className="grid size-9 place-items-center text-fg-3 hover:bg-plate hover:text-fg"
              >
                <Pencil className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New page" : "Edit page"}
        footer={
          <div className="flex gap-2">
            {editing && editing !== "new" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(editing)}
                aria-label="Delete page"
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
              {editing === "new" ? "Create page" : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="label mb-1.5 block text-fg-3">Title</span>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  title: e.target.value,
                  handle: handleTouched ? f.handle : slugify(e.target.value),
                }))
              }
              placeholder="e.g. Shipping & returns"
              className={input}
            />
          </label>
          <label className="block">
            <span className="label mb-1.5 block text-fg-3">URL</span>
            <div className="flex items-center border border-line focus-within:border-fg">
              <span className="pl-3 font-mono text-xs text-fg-3">
                dfootprint.me/
              </span>
              <input
                value={form.handle}
                onChange={(e) => {
                  setHandleTouched(true);
                  setForm((f) => ({ ...f, handle: e.target.value }));
                }}
                className="h-11 w-full bg-transparent px-1 font-mono text-sm outline-none"
              />
            </div>
          </label>
          <div>
            <span className="label mb-1.5 block text-fg-3">Content</span>
            <RichTextEditor
              label="Page content"
              value={form.body}
              onChange={(body) => setForm((f) => ({ ...f, body }))}
              minHeight={260}
            />
          </div>
          <details className="border-t border-line pt-4">
            <summary className="label cursor-pointer text-fg-3 hover:text-fg">
              Summary & search listing
            </summary>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="label mb-1.5 block text-fg-3">
                  Short summary
                </span>
                <textarea
                  value={form.bodySummary}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bodySummary: e.target.value }))
                  }
                  rows={2}
                  className="w-full border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-fg"
                />
              </label>
              <label className="block">
                <span className="label mb-1.5 block text-fg-3">
                  Page title for Google
                </span>
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
                  placeholder={form.bodySummary}
                  className="w-full border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-fg"
                />
              </label>
            </div>
          </details>
        </div>
      </Sheet>
    </>
  );
}

// ─── Menus ────────────────────────────────────────────────────────────────────

function MenusTab({ menus, refresh }: { menus: Menu[]; refresh: () => void }) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function createMenu() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await send("/api/admin/menus", "POST", {
        title: title.trim(),
        handle: slugify(title),
      });
      toast.success("Menu created");
      setTitle("");
      setCreating(false);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        {creating ? (
          <>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createMenu()}
              placeholder="Menu name, e.g. Footer"
              className={`${input} max-w-xs`}
            />
            <button
              type="button"
              disabled={busy}
              onClick={createMenu}
              className={buttonClass("solid", "md", "h-11")}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className={buttonClass("outline", "md", "h-11")}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className={buttonClass("solid", "md")}
          >
            <Plus className="size-4" /> New menu
          </button>
        )}
      </div>
      {menus.length === 0 ? (
        <div className="border border-line px-5">
          <EmptyState title="No menus yet">
            The storefront reads menus by handle (for example “footer”).
          </EmptyState>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          {menus.map((m) => (
            // Re-key on content so a refresh with new items remounts with fresh state.
            <MenuCard
              key={`${m.id}:${m.items.map((i) => `${i.id}${i.title}${i.url}`).join("|")}`}
              menu={m}
              refresh={refresh}
            />
          ))}
        </div>
      )}
    </>
  );
}

function MenuCard({ menu, refresh }: { menu: Menu; refresh: () => void }) {
  const [items, setItems] = useState(menu.items);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState({ title: "", url: "" });
  const [busy, setBusy] = useState(false);

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

  async function move(index: number, dir: -1 | 1) {
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(index + dir, 0, moved!);
    setItems(next);
    await run(
      () =>
        send("/api/admin/menu-items/reorder", "PUT", {
          menuId: menu.id,
          itemIds: next.map((i) => i.id),
        }),
      "Order saved",
    );
  }

  async function saveItem() {
    if (!draft.title.trim() || !draft.url.trim())
      return toast.error("Each link needs a label and a URL");
    const ok = await run(
      () =>
        editing === "new"
          ? send("/api/admin/menu-items", "POST", {
              menuId: menu.id,
              title: draft.title.trim(),
              url: draft.url.trim(),
              position: items.length,
            })
          : send(`/api/admin/menu-items/${editing}`, "PUT", {
              menuId: menu.id,
              title: draft.title.trim(),
              url: draft.url.trim(),
              position: items.findIndex((i) => i.id === editing),
            }),
      editing === "new" ? "Link added" : "Link saved",
    );
    if (ok) setEditing(null);
  }

  return (
    <section className="border border-line">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold">{menu.title}</h2>
          <p className="font-mono text-[11px] text-fg-3">
            handle: {menu.handle}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            window.confirm(
              `Delete the “${menu.title}” menu and its ${items.length} links? The storefront may expect it.`,
            ) &&
            run(
              () => send(`/api/admin/menus/${menu.id}`, "DELETE"),
              "Menu deleted",
            )
          }
          aria-label={`Delete ${menu.title}`}
          className="grid size-9 place-items-center text-fg-3 hover:bg-plate hover:text-red-600"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <ol className="divide-y divide-line">
        {items.map((item, i) =>
          editing === item.id ? (
            <li key={item.id} className="p-4">
              <ItemForm
                draft={draft}
                setDraft={setDraft}
                busy={busy}
                onSave={saveItem}
                onCancel={() => setEditing(null)}
              />
            </li>
          ) : (
            <li key={item.id} className="flex items-center gap-2 px-3 py-2">
              <span className="w-6 font-mono text-[10px] text-fg-3">
                {String(i + 1).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => {
                  setDraft({ title: item.title, url: item.url });
                  setEditing(item.id);
                }}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-sm text-fg">
                  {item.title}
                </span>
                <span className="block truncate font-mono text-[11px] text-fg-3">
                  {item.url}
                </span>
              </button>
              <button
                type="button"
                disabled={busy || i === 0}
                onClick={() => move(i, -1)}
                aria-label={`Move ${item.title} up`}
                className="grid size-8 place-items-center text-fg-3 hover:bg-plate hover:text-fg disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                disabled={busy || i === items.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`Move ${item.title} down`}
                className="grid size-8 place-items-center text-fg-3 hover:bg-plate hover:text-fg disabled:opacity-30"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(
                    () => send(`/api/admin/menu-items/${item.id}`, "DELETE"),
                    "Link removed",
                  )
                }
                aria-label={`Remove ${item.title}`}
                className="grid size-8 place-items-center text-fg-3 hover:bg-plate hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ),
        )}
        {editing === "new" ? (
          <li className="p-4">
            <ItemForm
              draft={draft}
              setDraft={setDraft}
              busy={busy}
              onSave={saveItem}
              onCancel={() => setEditing(null)}
            />
          </li>
        ) : null}
      </ol>
      {editing !== "new" ? (
        <button
          type="button"
          onClick={() => {
            setDraft({ title: "", url: "" });
            setEditing("new");
          }}
          className="label flex w-full items-center gap-1.5 border-t border-line px-5 py-3 text-fg-3 hover:text-fg"
        >
          <Plus className="size-3.5" /> Add link
        </button>
      ) : null}
    </section>
  );
}

function ItemForm({
  draft,
  setDraft,
  busy,
  onSave,
  onCancel,
}: {
  draft: { title: string; url: string };
  setDraft: (d: { title: string; url: string }) => void;
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2">
      <input
        autoFocus
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        placeholder="Label, e.g. Slides"
        className={input}
      />
      <input
        value={draft.url}
        onChange={(e) => setDraft({ ...draft, url: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && onSave()}
        placeholder="/search/slides or https://…"
        className={`${input} font-mono`}
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onSave}
          className={buttonClass("solid", "md")}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null} Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={buttonClass("outline", "md")}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
