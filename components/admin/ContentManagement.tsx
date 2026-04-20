"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import LoadingDots from "components/loading-dots";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageItem {
  id: string;
  handle: string;
  title: string;
  body: string | null;
  bodySummary: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MenuItem {
  id: string;
  menuId: string;
  title: string;
  url: string;
  position: number;
  createdAt: Date;
}

interface Menu {
  id: string;
  handle: string;
  title: string;
  items: MenuItem[];
}

interface ContentManagementProps {
  pages: PageItem[];
  menus: Menu[];
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls =
  "block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-800";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
      {children}
    </p>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>
        {label}
        {required && <span className="ml-0.5 text-neutral-300 dark:text-neutral-600">*</span>}
      </Label>
      {children}
      {hint && <div className="mt-1.5">{hint}</div>}
    </div>
  );
}

function HandleHint({ handle }: { handle: string }) {
  if (!handle) return null;
  return (
    <p className="text-xs text-neutral-400 dark:text-neutral-500">
      <span className="font-mono">/{handle}</span>
    </p>
  );
}

function DragHandle() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" className="flex-shrink-0">
      <circle cx="3.5" cy="3"   r="1.2" fill="currentColor" />
      <circle cx="8.5" cy="3"   r="1.2" fill="currentColor" />
      <circle cx="3.5" cy="8"   r="1.2" fill="currentColor" />
      <circle cx="8.5" cy="8"   r="1.2" fill="currentColor" />
      <circle cx="3.5" cy="13"  r="1.2" fill="currentColor" />
      <circle cx="8.5" cy="13"  r="1.2" fill="currentColor" />
    </svg>
  );
}

function PlusIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none">
      <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 py-12 text-center dark:border-neutral-800">
      <p className="text-sm text-neutral-400 dark:text-neutral-500">{message}</p>
    </div>
  );
}

// ─── Button variants ──────────────────────────────────────────────────────────

function PrimaryBtn({
  onClick, children, type = "button", disabled, small,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300 ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"}`}
    >
      {children}
    </button>
  );
}

function GhostBtn({
  onClick, children, type = "button", small,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  type?: "button" | "submit";
  small?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 ${small ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2.5 text-sm"}`}
    >
      {children}
    </button>
  );
}

function DestroyBtn({
  onClick, children, small,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300 ${small ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2.5 text-sm"}`}
    >
      {children}
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  open, onClose, title, maxWidth = "max-w-2xl", children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8 sm:py-16">
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 bg-black/30 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div className={`relative z-10 w-full ${maxWidth} overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900`}>
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContentManagement({
  pages,
  menus: initialMenus,
}: ContentManagementProps) {
  const router = useRouter();

  // UI state
  const [activeSection, setActiveSection] = useState<"pages" | "menus">("pages");
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [isEditingMenuItem, setIsEditingMenuItem] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Selection
  const [selectedPage, setSelectedPage] = useState<PageItem | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  // Forms
  const [pageForm, setPageForm] = useState({ handle: "", title: "", body: "", bodySummary: "", seoTitle: "", seoDescription: "" });
  const [handleManuallyEdited, setHandleManuallyEdited] = useState(false);
  const [menuForm, setMenuForm] = useState({ handle: "", title: "" });
  const [menuHandleManuallyEdited, setMenuHandleManuallyEdited] = useState(false);
  const [menuItemForm, setMenuItemForm] = useState({ menuId: "", title: "", url: "" });

  // Optimistic menus for drag-and-drop
  const [localMenus, setLocalMenus] = useState<Menu[]>(initialMenus);
  useEffect(() => setLocalMenus(initialMenus), [initialMenus]);

  // Drag refs
  const dragIndexRef = useRef<number | null>(null);
  const dragMenuIdRef = useRef<string | null>(null);
  const [draggingInfo, setDraggingInfo] = useState<{ menuId: string; index: number } | null>(null);

  // Derived
  const menuOptions = useMemo(() => localMenus.map((m) => ({ id: m.id, title: m.title })), [localMenus]);
  const totalMenuItems = useMemo(() => localMenus.reduce((c, m) => c + m.items.length, 0), [localMenus]);

  // Tiptap
  const editor = useEditor({
    extensions: [StarterKit],
    content: pageForm.body || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[140px] bg-white dark:bg-neutral-800 px-4 py-3 text-sm focus:outline-none dark:text-neutral-100",
      },
    },
    onUpdate: ({ editor }) => setPageForm((p) => ({ ...p, body: editor.getHTML() })),
  });

  useEffect(() => {
    if (!editor || !isPageModalOpen) return;
    const next = pageForm.body || "";
    if (editor.getHTML() !== next) editor.commands.setContent(next, false);
  }, [editor, isPageModalOpen]);

  // Auto-slug
  useEffect(() => {
    if (!handleManuallyEdited && isPageModalOpen && !isEditingPage)
      setPageForm((p) => ({ ...p, handle: slugify(p.title) }));
  }, [pageForm.title, handleManuallyEdited, isPageModalOpen, isEditingPage]);

  useEffect(() => {
    if (!menuHandleManuallyEdited && isMenuModalOpen && !isEditingMenu)
      setMenuForm((p) => ({ ...p, handle: slugify(p.title) }));
  }, [menuForm.title, menuHandleManuallyEdited, isMenuModalOpen, isEditingMenu]);

  // Resets
  const resetPageForm = () => { setPageForm({ handle: "", title: "", body: "", bodySummary: "", seoTitle: "", seoDescription: "" }); setHandleManuallyEdited(false); };
  const resetMenuForm = () => { setMenuForm({ handle: "", title: "" }); setMenuHandleManuallyEdited(false); };
  const resetMenuItemForm = () => setMenuItemForm({ menuId: "", title: "", url: "" });

  // Opens
  const openCreatePage = () => { resetPageForm(); setSelectedPage(null); setIsEditingPage(false); setIsPageModalOpen(true); };
  const openEditPage = (p: PageItem) => { setSelectedPage(p); setPageForm({ handle: p.handle, title: p.title, body: p.body || "", bodySummary: p.bodySummary || "", seoTitle: p.seoTitle || "", seoDescription: p.seoDescription || "" }); setHandleManuallyEdited(true); setIsEditingPage(true); setIsPageModalOpen(true); };
  const openCreateMenu = () => { resetMenuForm(); setSelectedMenu(null); setIsEditingMenu(false); setIsMenuModalOpen(true); };
  const openEditMenu = (m: Menu) => { setSelectedMenu(m); setMenuForm({ handle: m.handle, title: m.title }); setMenuHandleManuallyEdited(true); setIsEditingMenu(true); setIsMenuModalOpen(true); };
  const openCreateMenuItem = (m: Menu) => { resetMenuItemForm(); setSelectedMenu(m); setSelectedMenuItem(null); setIsEditingMenuItem(false); setMenuItemForm({ menuId: m.id, title: "", url: "" }); setIsMenuItemModalOpen(true); };
  const openEditMenuItem = (m: Menu, item: MenuItem) => { setSelectedMenu(m); setSelectedMenuItem(item); setMenuItemForm({ menuId: item.menuId, title: item.title, url: item.url }); setIsEditingMenuItem(true); setIsMenuItemModalOpen(true); };

  // ── API calls ─────────────────────────────────────────────────────────────────
  const handleCreateOrUpdatePage = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const res = await fetch(isEditingPage ? `/api/admin/pages/${selectedPage?.id}` : "/api/admin/pages", { method: isEditingPage ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pageForm) });
      const data = await res.json();
      if (res.ok) { toast.success(isEditingPage ? "Page updated" : "Page created"); setIsPageModalOpen(false); resetPageForm(); router.refresh(); }
      else toast.error(data.error || "Failed to save page");
    } catch { toast.error("Failed to save page"); }
    finally { setIsSaving(false); }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm("Delete this page?")) return;
    try {
      const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Page deleted"); router.refresh(); }
      else toast.error("Failed to delete page");
    } catch { toast.error("Failed to delete page"); }
  };

  const handleCreateOrUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const res = await fetch(isEditingMenu ? `/api/admin/menus/${selectedMenu?.id}` : "/api/admin/menus", { method: isEditingMenu ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(menuForm) });
      const data = await res.json();
      if (res.ok) { toast.success(isEditingMenu ? "Menu updated" : "Menu created"); setIsMenuModalOpen(false); resetMenuForm(); router.refresh(); }
      else toast.error(data.error || "Failed to save menu");
    } catch { toast.error("Failed to save menu"); }
    finally { setIsSaving(false); }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!confirm("Delete this menu and all its items?")) return;
    try {
      const res = await fetch(`/api/admin/menus/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Menu deleted"); router.refresh(); }
      else toast.error("Failed to delete menu");
    } catch { toast.error("Failed to delete menu"); }
  };

  const handleCreateOrUpdateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    const menu = localMenus.find((m) => m.id === menuItemForm.menuId);
    const position = isEditingMenuItem ? selectedMenuItem!.position : (menu?.items.length ?? 0);
    try {
      const res = await fetch(isEditingMenuItem ? `/api/admin/menu-items/${selectedMenuItem?.id}` : "/api/admin/menu-items", { method: isEditingMenuItem ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...menuItemForm, position }) });
      const data = await res.json();
      if (res.ok) { toast.success(isEditingMenuItem ? "Item updated" : "Item added"); setIsMenuItemModalOpen(false); resetMenuItemForm(); router.refresh(); }
      else toast.error(data.error || "Failed to save item");
    } catch { toast.error("Failed to save item"); }
    finally { setIsSaving(false); }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      const res = await fetch(`/api/admin/menu-items/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Item deleted"); router.refresh(); }
      else toast.error("Failed to delete item");
    } catch { toast.error("Failed to delete item"); }
  };

  // ── Drag-and-drop ─────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((menuId: string, index: number) => {
    dragIndexRef.current = index;
    dragMenuIdRef.current = menuId;
    setDraggingInfo({ menuId, index });
  }, []);

  const handleDragEnter = useCallback((menuId: string, index: number) => {
    if (dragMenuIdRef.current !== menuId || dragIndexRef.current === null || dragIndexRef.current === index) return;
    const from = dragIndexRef.current;
    dragIndexRef.current = index;
    setDraggingInfo({ menuId, index });
    setLocalMenus((prev) =>
      prev.map((m) => {
        if (m.id !== menuId) return m;
        const items = [...m.items];
        const [moved] = items.splice(from, 1);
        if (moved) items.splice(index, 0, moved);
        return { ...m, items };
      }),
    );
  }, []);

  const handleDragEnd = useCallback(async (menuId: string) => {
    setDraggingInfo(null);
    dragIndexRef.current = null;
    dragMenuIdRef.current = null;
    const menu = localMenus.find((m) => m.id === menuId);
    if (!menu) return;
    try {
      const res = await fetch("/api/admin/menu-items/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId, itemIds: menu.items.map((i) => i.id) }),
      });
      if (!res.ok) { toast.error("Failed to save order"); setLocalMenus(initialMenus); }
    } catch { toast.error("Failed to save order"); setLocalMenus(initialMenus); }
  }, [localMenus, initialMenus]);

  // ── Editor toolbar btn ────────────────────────────────────────────────────────
  const TBtn = ({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${active ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"}`}
    >
      {children}
    </button>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ════════════════════════════════════════════════════════
          UNIFIED HEADER — title · stats · tabs all in one panel
          ════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">

        {/* Row 1 — Page title + contextual action */}
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Content
            </h1>
            <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
              Pages and navigation menus
            </p>
          </div>
          <PrimaryBtn onClick={activeSection === "pages" ? openCreatePage : openCreateMenu} small>
            <PlusIcon />
            {activeSection === "pages" ? "New Page" : "New Menu"}
          </PrimaryBtn>
        </div>

        {/* Row 2 — Stats strip, no extra cards */}
        <div className="grid grid-cols-3 border-y border-neutral-100 dark:border-neutral-800">
          {[
            { label: "Pages",       value: pages.length },
            { label: "Menus",       value: localMenus.length },
            { label: "Menu Items",  value: totalMenuItems },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col gap-1 px-6 py-4 ${i > 0 ? "border-l border-neutral-100 dark:border-neutral-800" : ""}`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {s.label}
              </span>
              <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* Row 3 — Underline tabs */}
        <div className="flex gap-1 px-5">
          {(["pages", "menus"] as const).map((sec) => {
            const active = activeSection === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setActiveSection(sec)}
                className={`relative py-3.5 pr-4 text-sm font-medium capitalize transition-colors ${
                  active
                    ? "text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                }`}
              >
                {sec === "pages" ? "Pages" : "Menus"}
                {active && (
                  <span className="absolute bottom-0 left-0 right-4 h-[2px] rounded-t-full bg-neutral-900 dark:bg-neutral-100" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          PAGES SECTION
          ════════════════════════════════════════════════════════ */}
      {activeSection === "pages" && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          {pages.length === 0 ? (
            <div className="p-6">
              <EmptyState message="No pages yet. Click 'New Page' to create one." />
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="divide-y divide-neutral-100 md:hidden dark:divide-neutral-800">
                {pages.map((page) => (
                  <div key={page.id} className="flex items-center justify-between px-5 py-4">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {page.title}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
                        /{page.handle}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <GhostBtn onClick={() => openEditPage(page)} small>Edit</GhostBtn>
                      <DestroyBtn onClick={() => handleDeletePage(page.id)} small>Delete</DestroyBtn>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800">
                      {["Title", "Handle", "Updated", ""].map((col) => (
                        <th
                          key={col}
                          className={`px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 ${col === "" ? "text-right" : ""}`}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {pages.map((page) => (
                      <tr key={page.id} className="group transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-950/30">
                        <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                          {page.title}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-neutral-400 dark:text-neutral-500">
                          /{page.handle}
                        </td>
                        <td className="px-6 py-4 text-neutral-400 dark:text-neutral-500">
                          {new Date(page.updatedAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <GhostBtn onClick={() => openEditPage(page)} small>Edit</GhostBtn>
                            <DestroyBtn onClick={() => handleDeletePage(page.id)} small>Delete</DestroyBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MENUS SECTION
          ════════════════════════════════════════════════════════ */}
      {activeSection === "menus" && (
        <>
          {localMenus.length === 0 ? (
            <EmptyState message="No menus yet. Click 'New Menu' to create one." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {localMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                >
                  {/* Menu header */}
                  <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {menu.title}
                      </h3>
                      <p className="mt-0.5 font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
                        {menu.handle}
                      </p>
                    </div>
                    <div className="ml-3 flex flex-shrink-0 items-center gap-1">
                      <GhostBtn onClick={() => openEditMenu(menu)} small>Edit</GhostBtn>
                      <DestroyBtn onClick={() => handleDeleteMenu(menu.id)} small>Delete</DestroyBtn>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                        {menu.items.length} {menu.items.length === 1 ? "item" : "items"}
                      </span>
                      <button
                        type="button"
                        onClick={() => openCreateMenuItem(menu)}
                        className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                      >
                        <PlusIcon size={9} />
                        Add item
                      </button>
                    </div>

                    {menu.items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-neutral-200 py-7 text-center dark:border-neutral-800">
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">No items yet</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {menu.items.map((item, idx) => {
                          const isDragging =
                            draggingInfo?.menuId === menu.id && draggingInfo.index === idx;
                          return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={() => handleDragStart(menu.id, idx)}
                              onDragEnter={() => handleDragEnter(menu.id, idx)}
                              onDragEnd={() => handleDragEnd(menu.id)}
                              onDragOver={(e) => e.preventDefault()}
                              className={`group flex cursor-grab items-center gap-3 rounded-xl border px-3 py-2.5 transition-all active:cursor-grabbing ${
                                isDragging
                                  ? "scale-[0.98] border-neutral-300 bg-neutral-100/80 opacity-50 dark:border-neutral-600 dark:bg-neutral-800"
                                  : "border-neutral-100 bg-neutral-50 hover:border-neutral-200 hover:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
                              }`}
                            >
                              <span className="text-neutral-300 transition-colors group-hover:text-neutral-400 dark:text-neutral-700 dark:group-hover:text-neutral-600">
                                <DragHandle />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-neutral-900 dark:text-neutral-100">
                                  {item.title}
                                </p>
                                <p className="truncate font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
                                  {item.url}
                                </p>
                              </div>
                              <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  onClick={() => openEditMenuItem(menu, item)}
                                  className="rounded-md px-2 py-1 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteMenuItem(item.id)}
                                  className="rounded-md px-2 py-1 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-500 dark:hover:bg-red-950/40"
                                >
                                  Del
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <p className="pt-0.5 text-center text-[10px] text-neutral-300 dark:text-neutral-700">
                          Drag to reorder
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          MODALS
          ════════════════════════════════════════════════════════ */}

      {/* Page modal */}
      <Modal open={isPageModalOpen} onClose={() => setIsPageModalOpen(false)} title={isEditingPage ? "Edit Page" : "New Page"} maxWidth="max-w-3xl">
        <form onSubmit={handleCreateOrUpdatePage} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" required>
              <input type="text" required autoFocus value={pageForm.title} onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })} placeholder="About Us" className={inputCls} />
            </Field>
            <Field label="Handle" required hint={<HandleHint handle={pageForm.handle} />}>
              <input type="text" required value={pageForm.handle}
                onChange={(e) => { setHandleManuallyEdited(true); setPageForm({ ...pageForm, handle: e.target.value }); }}
                placeholder="about-us" className={`${inputCls} font-mono`} />
            </Field>
          </div>

          <Field label="Body">
            <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex flex-wrap gap-1 border-b border-neutral-100 bg-neutral-50 px-2 py-2 dark:border-neutral-700 dark:bg-neutral-800/50">
                <TBtn active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</TBtn>
                <TBtn active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}>Italic</TBtn>
                <TBtn active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</TBtn>
                <TBtn active={editor?.isActive("heading", { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</TBtn>
                <TBtn active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</TBtn>
                <TBtn active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. List</TBtn>
              </div>
              {editor
                ? <EditorContent editor={editor} />
                : <div className="min-h-[140px] bg-white px-4 py-3 text-sm text-neutral-400 dark:bg-neutral-800">Loading editor…</div>
              }
            </div>
          </Field>

          <Field label="Body Summary">
            <textarea rows={2} value={pageForm.bodySummary} onChange={(e) => setPageForm({ ...pageForm, bodySummary: e.target.value })} placeholder="Short summary shown in previews" className={inputCls} />
          </Field>

          <div className="space-y-4 rounded-xl border border-neutral-100 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
            <Label>SEO</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Meta Title">
                <input type="text" value={pageForm.seoTitle} onChange={(e) => setPageForm({ ...pageForm, seoTitle: e.target.value })} placeholder={pageForm.title || "Page title"} className={inputCls} />
              </Field>
              <Field label="Meta Description">
                <textarea rows={2} value={pageForm.seoDescription} onChange={(e) => setPageForm({ ...pageForm, seoDescription: e.target.value })} placeholder="Description for search engines" className={inputCls} />
              </Field>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800 sm:flex-row sm:justify-end">
            <GhostBtn type="button" onClick={() => setIsPageModalOpen(false)}>Cancel</GhostBtn>
            <PrimaryBtn type="submit" disabled={isSaving}>
              {isSaving ? <LoadingDots className="bg-white dark:bg-neutral-900" /> : isEditingPage ? "Save Changes" : "Create Page"}
            </PrimaryBtn>
          </div>
        </form>
      </Modal>

      {/* Menu modal */}
      <Modal open={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)} title={isEditingMenu ? "Edit Menu" : "New Menu"} maxWidth="max-w-md">
        <form onSubmit={handleCreateOrUpdateMenu} className="space-y-4">
          <Field label="Title" required>
            <input type="text" required autoFocus value={menuForm.title} onChange={(e) => setMenuForm({ ...menuForm, title: e.target.value })} placeholder="Main Navigation" className={inputCls} />
          </Field>
          <Field label="Handle" required hint={<HandleHint handle={menuForm.handle} />}>
            <input type="text" required value={menuForm.handle}
              onChange={(e) => { setMenuHandleManuallyEdited(true); setMenuForm({ ...menuForm, handle: e.target.value }); }}
              placeholder="main-menu" className={`${inputCls} font-mono`} />
          </Field>
          <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800 sm:flex-row sm:justify-end">
            <GhostBtn type="button" onClick={() => setIsMenuModalOpen(false)}>Cancel</GhostBtn>
            <PrimaryBtn type="submit" disabled={isSaving}>
              {isSaving ? <LoadingDots className="bg-white dark:bg-neutral-900" /> : isEditingMenu ? "Save Changes" : "Create Menu"}
            </PrimaryBtn>
          </div>
        </form>
      </Modal>

      {/* Menu item modal */}
      <Modal open={isMenuItemModalOpen} onClose={() => setIsMenuItemModalOpen(false)} title={isEditingMenuItem ? "Edit Item" : "New Menu Item"} maxWidth="max-w-md">
        <form onSubmit={handleCreateOrUpdateMenuItem} className="space-y-4">
          <Field label="Menu" required>
            <select required value={menuItemForm.menuId} onChange={(e) => setMenuItemForm({ ...menuItemForm, menuId: e.target.value })} className={inputCls}>
              <option value="">Select a menu</option>
              {menuOptions.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </Field>
          <Field label="Label" required>
            <input type="text" required autoFocus value={menuItemForm.title} onChange={(e) => setMenuItemForm({ ...menuItemForm, title: e.target.value })} placeholder="About Us" className={inputCls} />
          </Field>
          <Field label="URL" required>
            <input type="text" required value={menuItemForm.url} onChange={(e) => setMenuItemForm({ ...menuItemForm, url: e.target.value })} placeholder="/about" className={`${inputCls} font-mono`} />
          </Field>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
            Order is controlled by dragging items in the menu panel.
          </p>
          <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800 sm:flex-row sm:justify-end">
            <GhostBtn type="button" onClick={() => setIsMenuItemModalOpen(false)}>Cancel</GhostBtn>
            <PrimaryBtn type="submit" disabled={isSaving}>
              {isSaving ? <LoadingDots className="bg-white dark:bg-neutral-900" /> : isEditingMenuItem ? "Save Changes" : "Add Item"}
            </PrimaryBtn>
          </div>
        </form>
      </Modal>
    </div>
  );
}