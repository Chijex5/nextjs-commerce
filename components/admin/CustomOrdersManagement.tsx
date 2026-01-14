"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LoadingDots from "components/loading-dots";

interface CustomOrderItem {
  id: string;
  title: string;
  customerStory: string | null;
  beforeImage: string | null;
  afterImage: string | null;
  details: string[];
  completionTime: string | null;
  position: number;
  isPublished: boolean;
  updatedAt: Date;
}

interface CustomOrdersManagementProps {
  customOrders: CustomOrderItem[];
}

const emptyForm = {
  title: "",
  customerStory: "",
  beforeImage: "",
  afterImage: "",
  detailsText: "",
  completionTime: "",
  position: "0",
  isPublished: true,
};

export default function CustomOrdersManagement({
  customOrders,
}: CustomOrdersManagementProps) {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomOrderItem | null>(
    null,
  );

  const [form, setForm] = useState(emptyForm);

  const editor = useEditor({
    extensions: [StarterKit],
    content: form.customerStory || "",
    editorProps: {
      attributes: {
        class:
          "prose max-w-none rounded-b-md border border-t-0 border-neutral-300 bg-white px-3 py-3 text-sm focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100",
      },
    },
    onUpdate: ({ editor }) => {
      setForm((prev) => ({ ...prev, customerStory: editor.getHTML() }));
    },
  });

  useEffect(() => {
    if (!editor || !isModalOpen) return;
    const nextContent = form.customerStory || "";
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, false);
    }
  }, [editor, isModalOpen, form.customerStory]);

  const openCreate = () => {
    setSelectedOrder(null);
    setIsEditing(false);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (order: CustomOrderItem) => {
    setSelectedOrder(order);
    setIsEditing(true);
    setForm({
      title: order.title,
      customerStory: order.customerStory || "",
      beforeImage: order.beforeImage || "",
      afterImage: order.afterImage || "",
      detailsText: order.details.join("\n"),
      completionTime: order.completionTime || "",
      position: order.position.toString(),
      isPublished: order.isPublished,
    });
    setIsModalOpen(true);
  };

  const parseDetails = (value: string) =>
    value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const endpoint = isEditing
        ? `/api/admin/custom-orders/${selectedOrder?.id}`
        : "/api/admin/custom-orders";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          customerStory: form.customerStory,
          beforeImage: form.beforeImage,
          afterImage: form.afterImage,
          details: parseDetails(form.detailsText),
          completionTime: form.completionTime,
          position: form.position ? Number(form.position) : 0,
          isPublished: form.isPublished,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          isEditing
            ? "Custom order updated successfully"
            : "Custom order created successfully",
        );
        setIsModalOpen(false);
        setSelectedOrder(null);
        setForm(emptyForm);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to save custom order");
      }
    } catch (error) {
      toast.error("Failed to save custom order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("Delete this custom order?")) return;

    try {
      const response = await fetch(`/api/admin/custom-orders/${orderId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Custom order deleted successfully");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to delete custom order");
      }
    } catch (error) {
      toast.error("Failed to delete custom order");
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Custom Orders
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Curate the before-and-after stories shown on the Custom Orders
              page.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            + Add Custom Order
          </button>
        </div>

        {customOrders.length === 0 ? (
          <div className="rounded-md border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            No custom orders yet. Add your first story.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
            <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
              <thead className="bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Position</th>
                  <th className="px-4 py-3 text-left font-medium">Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {customOrders.map((order) => (
                  <tr key={order.id} className="bg-white dark:bg-neutral-900">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {order.title}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          order.isPublished
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                        }`}
                      >
                        {order.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                      {order.position}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                      {new Date(order.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(order)}
                          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsModalOpen(false)}
            ></div>
            <div className="relative w-full max-w-3xl rounded-lg border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {isEditing ? "Edit Custom Order" : "Add Custom Order"}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(event) =>
                        setForm({ ...form, title: event.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-7">
                    <input
                      id="is-published"
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(event) =>
                        setForm({ ...form, isPublished: event.target.checked })
                      }
                      className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                    />
                    <label
                      htmlFor="is-published"
                      className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                    >
                      Published
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Before Image URL
                    </label>
                    <input
                      type="url"
                      value={form.beforeImage}
                      onChange={(event) =>
                        setForm({ ...form, beforeImage: event.target.value })
                      }
                      placeholder="https://..."
                      className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      After Image URL
                    </label>
                    <input
                      type="url"
                      value={form.afterImage}
                      onChange={(event) =>
                        setForm({ ...form, afterImage: event.target.value })
                      }
                      placeholder="https://..."
                      className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Completion Time
                    </label>
                    <input
                      type="text"
                      value={form.completionTime}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          completionTime: event.target.value,
                        })
                      }
                      placeholder="7 days"
                      className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Position
                    </label>
                    <input
                      type="number"
                      value={form.position}
                      onChange={(event) =>
                        setForm({ ...form, position: event.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Story
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
                    Details List
                  </label>
                  <textarea
                    rows={4}
                    value={form.detailsText}
                    onChange={(event) =>
                      setForm({ ...form, detailsText: event.target.value })
                    }
                    placeholder="One detail per line"
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Each line becomes a bullet point on the page.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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
                    ) : isEditing ? (
                      "Save Changes"
                    ) : (
                      "Create Custom Order"
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
