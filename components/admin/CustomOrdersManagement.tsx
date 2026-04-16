"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowUpDown,
  Bold,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Hash,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Heading3,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  ZapIcon,
} from "lucide-react";
import LoadingDots from "components/loading-dots";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type UploadTarget = "before" | "after";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "",
  customerStory: "",
  beforeImage: "",
  afterImage: "",
  details: [] as string[],
  completionTime: "",
  position: "0",
  isPublished: true,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  label,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
        <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
      </span>
      <div>
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          {label}
        </p>
        {hint && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

function ImageUploader({
  label,
  sublabel,
  target,
  imageUrl,
  isUploading,
  inputRef,
  onUpload,
  onClear,
}: {
  label: string;
  sublabel: string;
  target: UploadTarget;
  imageUrl: string;
  isUploading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, target: UploadTarget) => void;
  onClear: (target: UploadTarget) => void;
}) {
  return (
    <div className="group relative flex flex-col gap-3">
      {/* Label header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {label}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            {sublabel}
          </p>
        </div>
        {imageUrl && (
          <button
            type="button"
            onClick={() => onClear(target)}
            className="flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-500 transition hover:border-red-400 hover:bg-red-50 dark:border-red-900/40 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-3 w-3" />
            Remove
          </button>
        )}
      </div>

      {/* Upload area */}
      {imageUrl ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700">
          <img
            src={imageUrl}
            alt={`${label} preview`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {label}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 text-neutral-400 transition hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-600 disabled:cursor-wait dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-violet-700 dark:hover:bg-violet-950/20 dark:hover:text-violet-400"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin" />
              <p className="text-sm font-medium">Uploading…</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-7 w-7 transition-transform group-hover:scale-110" />
              <div className="text-center">
                <p className="text-sm font-semibold">{label}</p>
                <p className="mt-0.5 text-xs">PNG, JPG, WEBP · Max 8 MB</p>
              </div>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => onUpload(e, target)}
        disabled={isUploading}
        className="hidden"
      />
    </div>
  );
}

function DetailsList({
  details,
  onChange,
}: {
  details: string[];
  onChange: (details: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...details, trimmed]);
    setDraft("");
  };

  const remove = (index: number) => {
    onChange(details.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Existing items */}
      {details.length > 0 && (
        <ul className="space-y-2">
          {details.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-500" />
              <span className="flex-1 text-neutral-700 dark:text-neutral-200">
                {item}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-neutral-400 transition hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add new item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Add a detail…"
          className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 placeholder-neutral-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {details.length === 0 && (
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          These appear as bullet points on the showcase page. Add at least one.
        </p>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function CustomOrdersManagement({
  customOrders,
}: CustomOrdersManagementProps) {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomOrderItem | null>(null);
  const [uploadingImage, setUploadingImage] = useState<UploadTarget | null>(null);
  const [activeStep, setActiveStep] = useState<"basics" | "visuals" | "story">("basics");

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(EMPTY_FORM);

  // ─ Rich text editor ─
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[160px] px-4 py-4 text-sm text-neutral-700 focus:outline-none dark:prose-invert dark:text-neutral-100",
      },
    },
    onUpdate: ({ editor }) => {
      setForm((prev) => ({ ...prev, customerStory: editor.getHTML() }));
    },
  });

  useEffect(() => {
    if (!editor || !isModalOpen) return;
    const next = form.customerStory || "";
    if (editor.getHTML() !== next) {
      editor.commands.setContent(next, false);
    }
  }, [editor, isModalOpen]);

  // ─ Open / close helpers ─
  const openCreate = () => {
    setSelectedOrder(null);
    setIsEditing(false);
    setForm(EMPTY_FORM);
    setActiveStep("basics");
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
      details: order.details,
      completionTime: order.completionTime || "",
      position: order.position.toString(),
      isPublished: order.isPublished,
    });
    setActiveStep("basics");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setActiveStep("basics");
  };

  // ─ Image upload ─
  const uploadImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
    target: UploadTarget,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image too large — max file size is 8 MB.");
      event.target.value = "";
      return;
    }

    setUploadingImage(target);
    try {
      const payload = new FormData();
      payload.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: payload,
      });
      const data = await response.json();

      if (!response.ok || !data?.url) throw new Error(data?.error || "Upload failed");

      const key = target === "before" ? "beforeImage" : "afterImage";
      setForm((prev) => ({ ...prev, [key]: data.url }));
      toast.success(`${target === "before" ? "Before" : "After"} image uploaded.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(null);
      event.target.value = "";
    }
  };

  const clearImage = (target: UploadTarget) => {
    const key = target === "before" ? "beforeImage" : "afterImage";
    setForm((prev) => ({ ...prev, [key]: "" }));
  };

  // ─ Save ─
  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const endpoint = isEditing
        ? `/api/admin/custom-orders/${selectedOrder?.id}`
        : "/api/admin/custom-orders";

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          customerStory: form.customerStory,
          beforeImage: form.beforeImage,
          afterImage: form.afterImage,
          details: form.details,
          completionTime: form.completionTime,
          position: form.position ? Number(form.position) : 0,
          isPublished: form.isPublished,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(isEditing ? "Showcase updated." : "Showcase created!");
        closeModal();
        router.refresh();
      } else {
        toast.error(data.error || "Failed to save.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─ Delete ─
  const handleDelete = async (orderId: string) => {
    if (!confirm("Permanently delete this showcase entry?")) return;

    try {
      const response = await fetch(`/api/admin/custom-orders/${orderId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Entry deleted.");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to delete.");
      }
    } catch {
      toast.error("Something went wrong.");
    }
  };

  // ─ Step tabs ─
  const STEPS = [
    { id: "basics", label: "Basics", icon: Hash },
    { id: "visuals", label: "Before & After", icon: ImageIcon },
    { id: "story", label: "Story & Details", icon: ZapIcon },
  ] as const;

  // ─ Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Page card ── */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-neutral-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 px-6 py-5 dark:border-neutral-800 dark:from-violet-950/30 dark:via-neutral-900 dark:to-fuchsia-950/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Custom Showcase
              </h2>
              <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                Before-and-after transformations shown on the Custom Orders page.{" "}
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {customOrders.filter((o) => o.isPublished).length} published
                </span>{" "}
                of{" "}
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {customOrders.length} total
                </span>
                .
              </p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            New Entry
          </button>
        </div>

        {/* Empty state */}
        {customOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
              <ImageIcon className="h-8 w-8 text-neutral-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
                No showcase entries yet
              </p>
              <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
                Add your first before-and-after transformation story to get started.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:bg-violet-950/60"
            >
              <Plus className="h-4 w-4" />
              Add first entry
            </button>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/80">
                  {["Showcase", "Status", "Pos.", "Updated", ""].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {customOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="group bg-white transition hover:bg-violet-50/40 dark:bg-neutral-900 dark:hover:bg-violet-950/10"
                  >
                    {/* Showcase preview */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail pair */}
                        <div className="relative h-10 w-16 shrink-0">
                          {order.beforeImage ? (
                            <img
                              src={order.beforeImage}
                              alt="before"
                              className="absolute left-0 top-0 h-10 w-10 rounded-lg border border-white object-cover shadow-sm dark:border-neutral-700"
                            />
                          ) : (
                            <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
                              <ImageIcon className="h-4 w-4 text-neutral-300 dark:text-neutral-600" />
                            </div>
                          )}
                          {order.afterImage ? (
                            <img
                              src={order.afterImage}
                              alt="after"
                              className="absolute left-6 top-0 h-10 w-10 rounded-lg border border-white object-cover shadow-sm dark:border-neutral-700"
                            />
                          ) : (
                            <div className="absolute left-6 top-0 flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
                              <ImageIcon className="h-4 w-4 text-neutral-300 dark:text-neutral-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {order.title}
                          </p>
                          {order.completionTime && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
                              <Clock className="h-3 w-3" />
                              {order.completionTime}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          order.isPublished
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}
                      >
                        {order.isPublished ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                        {order.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>

                    {/* Position */}
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                        <ArrowUpDown className="h-3 w-3" />
                        {order.position}
                      </span>
                    </td>

                    {/* Updated */}
                    <td className="px-5 py-3 text-xs text-neutral-400 dark:text-neutral-500">
                      {new Date(order.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => openEdit(order)}
                          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-violet-300 hover:text-violet-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-violet-600 dark:hover:text-violet-300"
                        >
                          Edit
                          <ChevronRight className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-1.5 text-xs font-medium text-red-500 transition hover:border-red-300 hover:bg-red-50 dark:border-red-900/30 dark:bg-transparent dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3 w-3" />
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

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">

            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-5 dark:border-neutral-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                  {isEditing ? "Editing entry" : "New entry"}
                </p>
                <h2 className="mt-0.5 text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {isEditing ? form.title || "Edit showcase" : "Build a showcase"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="ml-4 flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 transition hover:border-neutral-300 hover:text-neutral-700 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step tabs */}
            <div className="flex gap-0 border-b border-neutral-200 dark:border-neutral-800">
              {STEPS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveStep(id)}
                  className={`relative flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
                    activeStep === id
                      ? "text-violet-700 dark:text-violet-300"
                      : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-500 dark:hover:text-neutral-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {activeStep === id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-violet-600 dark:bg-violet-400" />
                  )}
                </button>
              ))}
            </div>

            {/* Modal body – scrollable */}
            <form
              id="showcase-form"
              onSubmit={handleSave}
              className="flex-1 overflow-y-auto"
            >
              <div className="space-y-6 p-6">

                {/* ── Step: Basics ── */}
                {activeStep === "basics" && (
                  <>
                    <SectionLabel
                      icon={Hash}
                      label="Entry basics"
                      hint="Set the title, visibility, sort order, and completion time."
                    />

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vintage Leather Jacket Restoration"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:bg-neutral-800"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Completion time */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Completion time
                        </label>
                        <p className="mb-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                          How long this transformation took
                        </p>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                          <input
                            type="text"
                            value={form.completionTime}
                            onChange={(e) =>
                              setForm({ ...form, completionTime: e.target.value })
                            }
                            placeholder="e.g. 7 days"
                            className="block w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-3.5 text-sm text-neutral-900 placeholder-neutral-400 transition focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:bg-neutral-800"
                          />
                        </div>
                      </div>

                      {/* Position */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Display order
                        </label>
                        <p className="mb-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                          Lower number = shown first
                        </p>
                        <div className="relative">
                          <ArrowUpDown className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                          <input
                            type="number"
                            value={form.position}
                            onChange={(e) =>
                              setForm({ ...form, position: e.target.value })
                            }
                            className="block w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-3.5 text-sm text-neutral-900 transition focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-100 dark:focus:bg-neutral-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Published toggle */}
                    <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 dark:border-neutral-700 dark:bg-neutral-800/60">
                      <div>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          Visible to visitors
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">
                          {form.isPublished
                            ? "This entry is live on the Custom Orders page."
                            : "This entry is saved as a draft and hidden from visitors."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setForm({ ...form, isPublished: !form.isPublished })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                          form.isPublished
                            ? "bg-violet-600"
                            : "bg-neutral-300 dark:bg-neutral-600"
                        }`}
                        role="switch"
                        aria-checked={form.isPublished}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                            form.isPublished ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </>
                )}

                {/* ── Step: Visuals ── */}
                {activeStep === "visuals" && (
                  <>
                    <SectionLabel
                      icon={ImageIcon}
                      label="Before & After images"
                      hint="Upload the two photos that show the transformation side by side."
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                      <ImageUploader
                        label="Before"
                        sublabel="The original, unmodified piece"
                        target="before"
                        imageUrl={form.beforeImage}
                        isUploading={uploadingImage === "before"}
                        inputRef={beforeInputRef as React.RefObject<HTMLInputElement>}
                        onUpload={uploadImage}
                        onClear={clearImage}
                      />
                      <ImageUploader
                        label="After"
                        sublabel="The finished transformation"
                        target="after"
                        imageUrl={form.afterImage}
                        isUploading={uploadingImage === "after"}
                        inputRef={afterInputRef as React.RefObject<HTMLInputElement>}
                        onUpload={uploadImage}
                        onClear={clearImage}
                      />
                    </div>

                    {/* Preview hint */}
                    {form.beforeImage && form.afterImage && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Both images uploaded — this entry is ready to publish.
                      </div>
                    )}
                  </>
                )}

                {/* ── Step: Story & Details ── */}
                {activeStep === "story" && (
                  <>
                    {/* Rich text story */}
                    <SectionLabel
                      icon={ZapIcon}
                      label="Customer story"
                      hint="Describe what the customer needed and how the result exceeded expectations."
                    />
                    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
                      {/* Toolbar */}
                      <div className="flex flex-wrap gap-1 border-b border-neutral-200 bg-neutral-50 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-800/60">
                        {[
                          {
                            icon: Bold,
                            label: "Bold",
                            action: () => editor?.chain().focus().toggleBold().run(),
                            isActive: () => !!editor?.isActive("bold"),
                            canRun: () => !!editor?.can().chain().focus().toggleBold().run(),
                          },
                          {
                            icon: Italic,
                            label: "Italic",
                            action: () => editor?.chain().focus().toggleItalic().run(),
                            isActive: () => !!editor?.isActive("italic"),
                            canRun: () => !!editor?.can().chain().focus().toggleItalic().run(),
                          },
                          {
                            icon: Heading3,
                            label: "Heading",
                            action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
                            isActive: () => !!editor?.isActive("heading", { level: 3 }),
                            canRun: () => true,
                          },
                          {
                            icon: List,
                            label: "Bullets",
                            action: () => editor?.chain().focus().toggleBulletList().run(),
                            isActive: () => !!editor?.isActive("bulletList"),
                            canRun: () => true,
                          },
                          {
                            icon: ListOrdered,
                            label: "Numbered",
                            action: () => editor?.chain().focus().toggleOrderedList().run(),
                            isActive: () => !!editor?.isActive("orderedList"),
                            canRun: () => true,
                          },
                        ].map(({ icon: Icon, label, action, isActive, canRun }) => (
                          <button
                            key={label}
                            type="button"
                            title={label}
                            onClick={action}
                            disabled={!canRun()}
                            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition ${
                              isActive()
                                ? "bg-violet-600 text-white"
                                : "text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                            } disabled:cursor-not-allowed disabled:opacity-30`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </button>
                        ))}
                      </div>

                      {/* Editor */}
                      <div className="bg-white dark:bg-neutral-900">
                        {editor ? (
                          <EditorContent editor={editor} />
                        ) : (
                          <div className="px-4 py-4 text-sm text-neutral-400">
                            Loading editor…
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Details list */}
                    <div className="mt-6">
                      <SectionLabel
                        icon={List}
                        label="Highlight details"
                        hint="Key facts that appear as bullet points on the showcase card."
                      />
                      <DetailsList
                        details={form.details}
                        onChange={(details) => setForm({ ...form, details })}
                      />
                    </div>
                  </>
                )}
              </div>
            </form>

            {/* Modal footer */}
            <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-950">
              {/* Step navigation */}
              <div className="flex items-center gap-2">
                {STEPS.map(({ id }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveStep(id)}
                    className={`h-2 rounded-full transition-all ${
                      activeStep === id
                        ? "w-6 bg-violet-600"
                        : "w-2 bg-neutral-300 dark:bg-neutral-700"
                    }`}
                  />
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  form="showcase-form"
                  disabled={isSaving || uploadingImage !== null || !form.title.trim()}
                  className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <LoadingDots className="bg-white" />
                  ) : isEditing ? (
                    "Save changes"
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Publish entry
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}