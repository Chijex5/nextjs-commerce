"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import LoadingDots from "components/loading-dots";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

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

export default function ContentManagement({
  pages,
  menus,
}: ContentManagementProps) {
  const router = useRouter();

  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [isEditingMenuItem, setIsEditingMenuItem] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedPage, setSelectedPage] = useState<PageItem | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  const [pageForm, setPageForm] = useState({
    handle: "",
    title: "",
    body: "",
    bodySummary: "",
    seoTitle: "",
    seoDescription: "",
  });

  const [menuForm, setMenuForm] = useState({
    handle: "",
    title: "",
  });

  const [menuItemForm, setMenuItemForm] = useState({
    menuId: "",
    title: "",
    url: "",
    position: "",
  });

  const menuOptions = useMemo(
    () => menus.map((menu) => ({ id: menu.id, title: menu.title })),
    [menus],
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: pageForm.body || "",
    editorProps: {
      attributes: {
        class:
          "prose max-w-none rounded-b-md border border-t-0 border-neutral-300 bg-white px-3 py-3 text-sm focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100",
      },
    },
    onUpdate: ({ editor }) => {
      setPageForm((prev) => ({ ...prev, body: editor.getHTML() }));
    },
  });

  useEffect(() => {
    if (!editor || !isPageModalOpen) return;
    const nextContent = pageForm.body || "";
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, false);
    }
  }, [editor, isPageModalOpen, pageForm.body]);

  const resetPageForm = () =>
    setPageForm({
      handle: "",
      title: "",
      body: "",
      bodySummary: "",
      seoTitle: "",
      seoDescription: "",
    });

  const resetMenuForm = () => setMenuForm({ handle: "", title: "" });

  const resetMenuItemForm = () =>
    setMenuItemForm({
      menuId: "",
      title: "",
      url: "",
      position: "",
    });

  const openCreatePage = () => {
    resetPageForm();
    setSelectedPage(null);
    setIsEditingPage(false);
    setIsPageModalOpen(true);
  };

  const openEditPage = (page: PageItem) => {
    setSelectedPage(page);
    setPageForm({
      handle: page.handle,
      title: page.title,
      body: page.body || "",
      bodySummary: page.bodySummary || "",
      seoTitle: page.seoTitle || "",
      seoDescription: page.seoDescription || "",
    });
    setIsEditingPage(true);
    setIsPageModalOpen(true);
  };

  const openCreateMenu = () => {
    resetMenuForm();
    setSelectedMenu(null);
    setIsEditingMenu(false);
    setIsMenuModalOpen(true);
  };

  const openEditMenu = (menu: Menu) => {
    setSelectedMenu(menu);
    setMenuForm({
      handle: menu.handle,
      title: menu.title,
    });
    setIsEditingMenu(true);
    setIsMenuModalOpen(true);
  };

  const openCreateMenuItem = (menu: Menu) => {
    resetMenuItemForm();
    setSelectedMenu(menu);
    setSelectedMenuItem(null);
    setIsEditingMenuItem(false);
    setMenuItemForm({
      menuId: menu.id,
      title: "",
      url: "",
      position: menu.items.length.toString(),
    });
    setIsMenuItemModalOpen(true);
  };

  const openEditMenuItem = (menu: Menu, item: MenuItem) => {
    setSelectedMenu(menu);
    setSelectedMenuItem(item);
    setMenuItemForm({
      menuId: item.menuId,
      title: item.title,
      url: item.url,
      position: item.position.toString(),
    });
    setIsEditingMenuItem(true);
    setIsMenuItemModalOpen(true);
  };

  const handleCreateOrUpdatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const endpoint = isEditingPage
        ? `/api/admin/pages/${selectedPage?.id}`
        : "/api/admin/pages";
      const method = isEditingPage ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          isEditingPage ? "Page updated successfully" : "Page created successfully",
        );
        setIsPageModalOpen(false);
        setSelectedPage(null);
        resetPageForm();
        router.refresh();
      } else {
        toast.error(data.error || "Failed to save page");
      }
    } catch (error) {
      toast.error("Failed to save page");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;

    try {
      const response = await fetch(`/api/admin/pages/${pageId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Page deleted successfully");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to delete page");
      }
    } catch (error) {
      toast.error("Failed to delete page");
    }
  };

  const handleCreateOrUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const endpoint = isEditingMenu
        ? `/api/admin/menus/${selectedMenu?.id}`
        : "/api/admin/menus";
      const method = isEditingMenu ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menuForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          isEditingMenu ? "Menu updated successfully" : "Menu created successfully",
        );
        setIsMenuModalOpen(false);
        setSelectedMenu(null);
        resetMenuForm();
        router.refresh();
      } else {
        toast.error(data.error || "Failed to save menu");
      }
    } catch (error) {
      toast.error("Failed to save menu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm("Delete this menu and all its items?")) return;

    try {
      const response = await fetch(`/api/admin/menus/${menuId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Menu deleted successfully");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to delete menu");
      }
    } catch (error) {
      toast.error("Failed to delete menu");
    }
  };

  const handleCreateOrUpdateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const endpoint = isEditingMenuItem
        ? `/api/admin/menu-items/${selectedMenuItem?.id}`
        : "/api/admin/menu-items";
      const method = isEditingMenuItem ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...menuItemForm,
          position: menuItemForm.position
            ? Number(menuItemForm.position)
            : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          isEditingMenuItem
            ? "Menu item updated successfully"
            : "Menu item created successfully",
        );
        setIsMenuItemModalOpen(false);
        setSelectedMenuItem(null);
        resetMenuItemForm();
        router.refresh();
      } else {
        toast.error(data.error || "Failed to save menu item");
      }
    } catch (error) {
      toast.error("Failed to save menu item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!confirm("Delete this menu item?")) return;

    try {
      const response = await fetch(`/api/admin/menu-items/${itemId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Menu item deleted successfully");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to delete menu item");
      }
    } catch (error) {
      toast.error("Failed to delete menu item");
    }
  };

  return (
    <div className="space-y-10">
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Pages
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Manage the static pages that render from /[page].
            </p>
          </div>
          <button
            onClick={openCreatePage}
            className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            + Add Page
          </button>
        </div>

        {pages.length === 0 ? (
          <div className="rounded-md border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            No pages yet. Create your first page.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
            <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
              <thead className="bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Handle</th>
                  <th className="px-4 py-3 text-left font-medium">Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {pages.map((page) => (
                  <tr key={page.id} className="bg-white dark:bg-neutral-900">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {page.title}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                      /{page.handle}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditPage(page)}
                          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePage(page.id)}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Menus
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Control the navigation menus and their items.
            </p>
          </div>
          <button
            onClick={openCreateMenu}
            className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            + Add Menu
          </button>
        </div>

        {menus.length === 0 ? (
          <div className="rounded-md border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            No menus yet. Create a menu to start.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {menu.title}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {menu.handle}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditMenu(menu)}
                      className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(menu.id)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Menu Items
                  </p>
                  <button
                    onClick={() => openCreateMenuItem(menu)}
                    className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
                  >
                    + Add Item
                  </button>
                </div>

                {menu.items.length === 0 ? (
                  <div className="rounded-md border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                    No items yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {menu.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
                      >
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {item.title}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {item.url} • Position {item.position}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditMenuItem(menu, item)}
                            className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isPageModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsPageModalOpen(false)}
            ></div>
            <div className="relative w-full max-w-2xl rounded-lg border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {isEditingPage ? "Edit Page" : "Add New Page"}
              </h2>
              <form onSubmit={handleCreateOrUpdatePage} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={pageForm.title}
                      onChange={(e) =>
                        setPageForm({ ...pageForm, title: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Handle *
                    </label>
                    <input
                      type="text"
                      required
                      value={pageForm.handle}
                      onChange={(e) =>
                        setPageForm({ ...pageForm, handle: e.target.value })
                      }
                      placeholder="about-us"
                      className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Body
                  </label>
                  <div className="mt-1">
                    <div className="flex flex-wrap gap-2 rounded-t-md border border-neutral-300 bg-neutral-50 px-2 py-2 dark:border-neutral-700 dark:bg-neutral-900">
                      <button
                        type="button"
                        onClick={() =>
                          editor?.chain().focus().toggleBold().run()
                        }
                        disabled={
                          !editor?.can().chain().focus().toggleBold().run()
                        }
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          editor?.isActive("bold")
                            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                            : "bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        }`}
                      >
                        Bold
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor?.chain().focus().toggleItalic().run()
                        }
                        disabled={
                          !editor?.can().chain().focus().toggleItalic().run()
                        }
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          editor?.isActive("italic")
                            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                            : "bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        }`}
                      >
                        Italic
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor
                            ?.chain()
                            .focus()
                            .toggleHeading({ level: 2 })
                            .run()
                        }
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          editor?.isActive("heading", { level: 2 })
                            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                            : "bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        }`}
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor
                            ?.chain()
                            .focus()
                            .toggleHeading({ level: 3 })
                            .run()
                        }
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          editor?.isActive("heading", { level: 3 })
                            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                            : "bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        }`}
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor?.chain().focus().toggleBulletList().run()
                        }
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          editor?.isActive("bulletList")
                            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                            : "bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        }`}
                      >
                        Bullets
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor?.chain().focus().toggleOrderedList().run()
                        }
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          editor?.isActive("orderedList")
                            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                            : "bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        }`}
                      >
                        Numbered
                      </button>
                    </div>
                    {editor ? (
                      <EditorContent editor={editor} />
                    ) : (
                      <div className="rounded-md border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                        Loading editor...
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Body Summary
                  </label>
                  <textarea
                    rows={2}
                    value={pageForm.bodySummary}
                    onChange={(e) =>
                      setPageForm({
                        ...pageForm,
                        bodySummary: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={pageForm.seoTitle}
                      onChange={(e) =>
                        setPageForm({ ...pageForm, seoTitle: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      SEO Description
                    </label>
                    <textarea
                      rows={2}
                      value={pageForm.seoDescription}
                      onChange={(e) =>
                        setPageForm({
                          ...pageForm,
                          seoDescription: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPageModalOpen(false)}
                    className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <LoadingDots className="bg-white" />
                    ) : isEditingPage ? (
                      "Save Changes"
                    ) : (
                      "Create Page"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsMenuModalOpen(false)}
            ></div>
            <div className="relative w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {isEditingMenu ? "Edit Menu" : "Add New Menu"}
              </h2>
              <form onSubmit={handleCreateOrUpdateMenu} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={menuForm.title}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, title: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Handle *
                  </label>
                  <input
                    type="text"
                    required
                    value={menuForm.handle}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, handle: e.target.value })
                    }
                    placeholder="main-menu"
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMenuModalOpen(false)}
                    className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <LoadingDots className="bg-white" />
                    ) : isEditingMenu ? (
                      "Save Changes"
                    ) : (
                      "Create Menu"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isMenuItemModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsMenuItemModalOpen(false)}
            ></div>
            <div className="relative w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {isEditingMenuItem ? "Edit Menu Item" : "Add Menu Item"}
              </h2>
              <form
                onSubmit={handleCreateOrUpdateMenuItem}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Menu *
                  </label>
                  <select
                    required
                    value={menuItemForm.menuId}
                    onChange={(e) =>
                      setMenuItemForm({
                        ...menuItemForm,
                        menuId: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    <option value="">Select a menu</option>
                    {menuOptions.map((menu) => (
                      <option key={menu.id} value={menu.id}>
                        {menu.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={menuItemForm.title}
                    onChange={(e) =>
                      setMenuItemForm({
                        ...menuItemForm,
                        title: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={menuItemForm.url}
                    onChange={(e) =>
                      setMenuItemForm({ ...menuItemForm, url: e.target.value })
                    }
                    placeholder="/about"
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Position
                  </label>
                  <input
                    type="number"
                    value={menuItemForm.position}
                    onChange={(e) =>
                      setMenuItemForm({
                        ...menuItemForm,
                        position: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Lower numbers show first in the menu.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMenuItemModalOpen(false)}
                    className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <LoadingDots className="bg-white" />
                    ) : isEditingMenuItem ? (
                      "Save Changes"
                    ) : (
                      "Create Item"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
