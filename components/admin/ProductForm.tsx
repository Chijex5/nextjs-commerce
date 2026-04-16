"use client";

import ImageCropModal from "@/components/admin/ImageCropModal";
import {
    PRODUCT_IMAGE_ASPECT,
    PRODUCT_IMAGE_HEIGHT,
    PRODUCT_IMAGE_WIDTH,
} from "@/lib/image-constants";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import heic2any from "heic2any";
import {
    ArrowLeft,
    ArrowRight,
    ChevronRight,
    DollarSign,
    ImageIcon,
    Info,
    LayoutList,
    Star,
    Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    generateSeoDescription,
    generateSeoTitle,
    generateSlug,
} from "../../lib/admin-utils";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type ImageUpload = {
  url: string;
  position: number;
  isFeatured: boolean;
  width: number;
  height: number;
};

type FormData = {
  title: string;
  handle: string;
  description: string;
  availableForSale: boolean;
  seoTitle: string;
  seoDescription: string;
  tags: string;
  price: string;
  sizeFrom: string;
  sizeTo: string;
  colors: string;
  largeSizePrice: string;
  largeSizeFrom: string;
  differentColorPrices: string;
};

type SectionId = "details" | "pricing" | "images";

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: "details", label: "Details", icon: <LayoutList size={14} /> },
  {
    id: "pricing",
    label: "Pricing & Variants",
    icon: <DollarSign size={14} />,
  },
  { id: "images", label: "Images", icon: <ImageIcon size={14} /> },
];

/* ─── TipTap toolbar ─────────────────────────────────────────────────────── */

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const Btn = ({
    label,
    title,
    action,
    active,
  }: {
    label: string;
    title: string;
    action: () => void;
    active: boolean;
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        action();
      }}
      className={[
        "inline-flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800/60">
      <Btn
        label="B"
        title="Bold"
        action={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
      />
      <Btn
        label="I"
        title="Italic"
        action={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
      />
      <Btn
        label="S̶"
        title="Strikethrough"
        action={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
      />
      <span className="mx-0.5 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
      <Btn
        label="H2"
        title="Heading 2"
        action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
      />
      <Btn
        label="H3"
        title="Heading 3"
        action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
      />
      <span className="mx-0.5 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
      <Btn
        label="• List"
        title="Bullet list"
        action={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
      />
      <Btn
        label="1. List"
        title="Ordered list"
        action={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
      />
    </div>
  );
}

/* ─── Field wrapper ──────────────────────────────────────────────────────── */

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

/* ─── Section card ───────────────────────────────────────────────────────── */

function SectionCard({
  id,
  title,
  children,
}: {
  id: SectionId;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={`section-${id}`}
      className="scroll-mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          {title}
        </h2>
      </div>
      <div className="space-y-5 p-6">{children}</div>
    </div>
  );
}

/* ─── Input class ────────────────────────────────────────────────────────── */

const inputCls =
  "block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/8 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500";

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════════════════ */

export default function ProductForm({
  collections,
  product,
}: {
  collections: { id: string; title: string; handle: string }[];
  product?: any;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("details");
  const [images, setImages] = useState<ImageUpload[]>(
    product?.images?.map((img: any, idx: number) => ({
      url: img.url,
      position: img.position || idx,
      isFeatured: img.isFeatured || idx === 0,
      width: img.width ?? PRODUCT_IMAGE_WIDTH,
      height: img.height ?? PRODUCT_IMAGE_HEIGHT,
    })) || [],
  );
  const [preparingImages, setPreparingImages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [croppedFiles, setCroppedFiles] = useState<File[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPriceVariations, setShowPriceVariations] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    product?.productCollections?.map((pc: any) => pc.collectionId) || [],
  );

  // Stores the HTML from TipTap across re-renders for submission
  const [descriptionHtml, setDescriptionHtml] = useState<string>(
    product?.descriptionHtml || product?.description || "",
  );

  /* ── react-hook-form ── */
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: product?.title || "",
      handle: product?.handle || "",
      description: product?.description || "",
      availableForSale: product?.availableForSale ?? true,
      seoTitle: product?.seoTitle || "",
      seoDescription: product?.seoDescription || "",
      tags: product?.tags?.join(", ") || "",
      price: product?.variants?.[0]?.price?.toString() || "",
      sizeFrom: "38",
      sizeTo: "44",
      colors: "Black, Brown, Navy",
      largeSizePrice: "",
      largeSizeFrom: "",
      differentColorPrices: "",
    },
  });

  const titleVal = watch("title");
  const availableForSale = watch("availableForSale");

  /* ── TipTap ── */
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Describe your product…" }),
    ],
    content: product?.descriptionHtml || product?.description || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[140px] px-3 py-3 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none",
      },
    },
    onUpdate: ({ editor: e }) => {
      const text = e.getText();
      const html = e.getHTML();
      setDescriptionHtml(html);
      setValue("description", text, { shouldDirty: true });
      if (!product) {
        setValue("seoDescription", generateSeoDescription(text));
      }
    },
  });

  /* ── Auto-slug / SEO from title ── */
  useEffect(() => {
    if (titleVal && !product) {
      setValue("handle", generateSlug(titleVal));
      setValue("seoTitle", generateSeoTitle(titleVal));
    }
  }, [titleVal, setValue, product]);

  /* ── Scroll-spy ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(
              entry.target.id.replace("section-", "") as SectionId,
            );
          }
        });
      },
      { threshold: 0.35 },
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(`section-${id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  /* ── Revoke object URLs on cleanup ── */
  useEffect(() => {
    return () => {
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    };
  }, [cropImageSrc]);

  /* ── Submit ── */
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Validate size range
      const sizeFrom = parseInt(data.sizeFrom);
      const sizeTo = parseInt(data.sizeTo);

      if (Number.isNaN(sizeFrom) || Number.isNaN(sizeTo)) {
        toast.error("Invalid size range");
        setIsSubmitting(false);
        return;
      }

      if (sizeFrom > sizeTo) {
        toast.error("Size 'from' must be less than or equal to 'to'");
        setIsSubmitting(false);
        return;
      }

      const sizes: string[] = [];
      for (let i = sizeFrom; i <= sizeTo; i++) sizes.push(i.toString());

      const colors = data.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      // Validate price
      const basePrice = parseFloat(data.price);
      if (Number.isNaN(basePrice) || basePrice <= 0) {
        toast.error("Price must be greater than 0");
        setIsSubmitting(false);
        return;
      }

      const largeSizePrice = data.largeSizePrice
        ? parseFloat(data.largeSizePrice)
        : basePrice;
      const largeSizeFrom = data.largeSizeFrom
        ? parseInt(data.largeSizeFrom)
        : null;

      if (
        data.largeSizePrice &&
        (Number.isNaN(largeSizePrice) || largeSizePrice <= 0)
      ) {
        toast.error("Large size price must be greater than 0");
        setIsSubmitting(false);
        return;
      }

      if (
        data.largeSizeFrom &&
        (!Number.isInteger(largeSizeFrom) || largeSizeFrom!! <= 0)
      ) {
        toast.error("Large size 'from' must be a positive number");
        setIsSubmitting(false);
        return;
      }

      const colorPrices: Record<string, number> = {};
      if (data.differentColorPrices) {
        try {
          const parsed = JSON.parse(data.differentColorPrices);
          Object.keys(parsed).forEach((color) => {
            const price = parseFloat(parsed[color]);
            if (Number.isNaN(price) || price <= 0) {
              throw new Error(`Invalid price for color "${color}"`);
            }
            colorPrices[color.trim().toLowerCase()] = price;
          });
        } catch (err: any) {
          toast.error(`Color prices error: ${err.message}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Validate handle format
      const handleRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
      if (!handleRegex.test(data.handle)) {
        toast.error("Handle must be lowercase alphanumeric with hyphens only");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        title: data.title.trim(),
        handle: data.handle.trim(),
        description: data.description.trim(),
        descriptionHtml: descriptionHtml || `<p>${data.description.trim()}</p>`,
        availableForSale: data.availableForSale,
        seoTitle: data.seoTitle.trim(),
        seoDescription: data.seoDescription.trim(),
        tags: data.tags
          ? data.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        images,
        sizes,
        colors,
        basePrice,
        largeSizePrice: largeSizeFrom !== null ? largeSizePrice : null,
        largeSizeFrom,
        colorPrices: Object.keys(colorPrices).length > 0 ? colorPrices : null,
        collectionIds: selectedCollections,
      };

      const url = product
        ? `/api/admin/products/${product.id}`
        : "/api/admin/products";
      const method = product ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg =
          errorData.details || errorData.error || "Failed to save product";
        throw new Error(errorMsg);
      }

      toast.success(
        product
          ? "Product updated successfully"
          : "Product created successfully",
      );
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("Error saving product:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to save product. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Crop helpers ── */
  const setNextCropImage = (src: string | null) => {
    setCropImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return src;
    });
  };

  const resetCropQueue = () => {
    setCropQueue([]);
    setCropIndex(null);
    setCroppedFiles([]);
    setNextCropImage(null);
  };

  const uploadCroppedFiles = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) return;
    setUploading(true);
    try {
      const uploadedImages: ImageUpload[] = [];
      for (const file of filesToUpload) {
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        uploadedImages.push({
          url: data.url,
          position: images.length + uploadedImages.length,
          isFeatured: images.length === 0 && uploadedImages.length === 0,
          width: data.width ?? PRODUCT_IMAGE_WIDTH,
          height: data.height ?? PRODUCT_IMAGE_HEIGHT,
        });
      }
      setImages([...images, ...uploadedImages]);
      toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const isHeicFile = (file: File) => {
    const name = file.name.toLowerCase();
    return (
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      name.endsWith(".heic") ||
      name.endsWith(".heif")
    );
  };

  const convertHeicToJpeg = async (file: File) => {
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });
    const blob = Array.isArray(result) ? result[0] : result;
    if (!blob) throw new Error("HEIC conversion failed");
    const nextName = file.name.replace(/\.(heic|heif)$/i, "") || "image";
    return new File([blob], `${nextName}.jpg`, {
      type: blob.type || "image/jpeg",
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const availableSlots = 5 - images.length;
    if (availableSlots <= 0) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    const selectedFiles = Array.from(files);
    if (selectedFiles.length > availableSlots)
      toast.error(`Only ${availableSlots} more image(s) allowed`);
    const filesToCrop = selectedFiles
      .slice(0, availableSlots)
      .filter((file) => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Image ${file.name} is too large (max 5MB)`);
          return false;
        }
        return true;
      });
    if (filesToCrop.length === 0) {
      e.target.value = "";
      return;
    }
    setPreparingImages(true);
    try {
      const preparedFiles: File[] = [];
      for (const file of filesToCrop) {
        if (isHeicFile(file)) {
          try {
            preparedFiles.push(await convertHeicToJpeg(file));
          } catch {
            toast.error(`Could not read ${file.name}. Try JPG or PNG.`);
          }
          continue;
        }
        preparedFiles.push(file);
      }
      if (preparedFiles.length === 0) return;
      const first = preparedFiles[0];
      if (!first) return;
      setCropQueue(preparedFiles);
      setCropIndex(0);
      setCroppedFiles([]);
      setNextCropImage(URL.createObjectURL(first));
    } finally {
      setPreparingImages(false);
      e.target.value = "";
    }
  };

  const handleCropCancel = () => resetCropQueue();

  const handleCropConfirm = async (blob: Blob) => {
    if (cropIndex === null) return;
    const originalFile = cropQueue[cropIndex];
    if (!originalFile) return;
    const baseName =
      originalFile.name.replace(/\.[^/.]+$/, "") || "product-image";
    const croppedFile = new File([blob], `${baseName}-cropped.webp`, {
      type: blob.type || "image/webp",
    });
    const nextCroppedFiles = [...croppedFiles, croppedFile];
    const nextIndex = cropIndex + 1;
    if (nextIndex < cropQueue.length) {
      const nextFile = cropQueue[nextIndex];
      if (!nextFile) {
        resetCropQueue();
        return;
      }
      setCroppedFiles(nextCroppedFiles);
      setCropIndex(nextIndex);
      setNextCropImage(URL.createObjectURL(nextFile));
      return;
    }
    resetCropQueue();
    await uploadCroppedFiles(nextCroppedFiles);
  };

  /* ── Image list ── */
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    newImages.forEach((img, i) => {
      img.position = i;
      img.isFeatured = i === 0;
    });
    setImages(newImages);
  };

  const setFeaturedImage = (index: number) =>
    setImages(images.map((img, i) => ({ ...img, isFeatured: i === index })));

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    if (!moved) return;
    newImages.splice(toIndex, 0, moved);
    newImages.forEach((img, i) => {
      img.position = i;
    });
    setImages(newImages);
  };

  /* ─────────────────────────────────────────────────────────────────────── */

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mx-auto max-w-5xl">
        {/* ── Top bar ── */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-100"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {isSubmitting
                ? "Saving…"
                : product
                  ? "Update product"
                  : "Create product"}
            </button>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_200px]">
          {/* ── Left: scrollable sections ── */}
          <div className="min-w-0 space-y-6">
            {/* ══ Details ══ */}
            <SectionCard id="details" title="Product details">
              <Field
                label="Title"
                required
                hint="Auto-generates the URL slug and SEO title"
                error={errors.title?.message}
              >
                <input
                  type="text"
                  {...register("title", { required: "Title is required" })}
                  className={inputCls}
                  placeholder="e.g., Classic Leather Slide"
                />
              </Field>

              {/* Rich text description (TipTap) */}
              <Field
                label="Description"
                hint="Rich text — supports headings, lists, bold, italic"
              >
                <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
                  <EditorToolbar editor={editor} />
                  <EditorContent editor={editor} />
                  <div className="border-t border-neutral-100 px-3 py-1.5 dark:border-neutral-700">
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                      {editor?.getText().length ?? 0} characters
                    </span>
                  </div>
                </div>
              </Field>

              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  {...register("availableForSale")}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Available for sale
                </span>
              </label>

              <Field
                label="Tags"
                hint="Separate with commas — e.g., featured, bestseller, slides"
              >
                <input
                  type="text"
                  {...register("tags")}
                  className={inputCls}
                  placeholder="featured, bestseller, slides"
                />
              </Field>

              <Field
                label="Collections"
                hint="Select the collections this product belongs to"
              >
                <div className="max-h-44 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
                  {collections.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-neutral-500 dark:text-neutral-400">
                      No collections yet. Create collections first.
                    </p>
                  ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {collections.map((collection) => (
                        <label
                          key={collection.id}
                          className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCollections.includes(
                              collection.id,
                            )}
                            onChange={(e) =>
                              setSelectedCollections(
                                e.target.checked
                                  ? [...selectedCollections, collection.id]
                                  : selectedCollections.filter(
                                      (id) => id !== collection.id,
                                    ),
                              )
                            }
                            className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                          />
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">
                            {collection.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              {/* Advanced / auto-generated fields */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200"
                >
                  <ChevronRight
                    size={12}
                    className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                  />
                  Advanced — auto-generated fields
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                    <Field
                      label="URL slug (handle)"
                      required
                      hint="Auto-generated from title. Edit if needed."
                      error={errors.handle?.message}
                    >
                      <input
                        type="text"
                        {...register("handle", {
                          required: "Handle is required",
                        })}
                        className={inputCls}
                        placeholder="classic-leather-slide"
                      />
                    </Field>
                    <Field
                      label="SEO title"
                      hint='Auto-generated as "Title — D&apos;FOOTPRINT"'
                    >
                      <input
                        type="text"
                        {...register("seoTitle")}
                        className={inputCls}
                        placeholder="Auto-generated from title"
                      />
                    </Field>
                    <Field
                      label="SEO description"
                      hint="Auto-truncated to 160 characters from description"
                    >
                      <textarea
                        {...register("seoDescription")}
                        rows={3}
                        className={inputCls}
                        placeholder="Auto-generated from description"
                      />
                    </Field>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* ══ Pricing & Variants ══ */}
            <SectionCard id="pricing" title="Pricing & Variants">
              <Field
                label="Base price (NGN)"
                required
                error={errors.price?.message}
              >
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-neutral-400">
                    ₦
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    {...register("price", { required: "Price is required" })}
                    className={`${inputCls} pl-7`}
                    placeholder="12000"
                  />
                </div>
              </Field>

              <div>
                <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Size range <span className="text-red-500">*</span>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="From" error={errors.sizeFrom?.message}>
                    <input
                      type="number"
                      {...register("sizeFrom", { required: "Required" })}
                      className={inputCls}
                      placeholder="38"
                    />
                  </Field>
                  <Field label="To" error={errors.sizeTo?.message}>
                    <input
                      type="number"
                      {...register("sizeTo", { required: "Required" })}
                      className={inputCls}
                      placeholder="44"
                    />
                  </Field>
                </div>
                <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  Variants created for every size in the range (38–44 → 7 sizes)
                </p>
              </div>

              <Field
                label="Available colors"
                required
                hint={`Separate with commas — e.g., "Black, Brown, Navy"`}
                error={errors.colors?.message}
              >
                <input
                  type="text"
                  {...register("colors", {
                    required: "At least one color is required",
                  })}
                  className={inputCls}
                  placeholder="Black, Brown, Navy"
                />
              </Field>

              <div className="flex gap-2.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 dark:border-blue-900/30 dark:bg-blue-900/10">
                <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  All size × color combinations are created automatically. E.g.,
                  sizes 38–40 with Black &amp; Brown = 6 variants.
                </p>
              </div>

              {/* Price variations collapsible */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPriceVariations(!showPriceVariations)}
                  className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200"
                >
                  <ChevronRight
                    size={12}
                    className={`transition-transform ${showPriceVariations ? "rotate-90" : ""}`}
                  />
                  Price variations (optional)
                </button>

                {showPriceVariations && (
                  <div className="mt-4 space-y-5 rounded-lg border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Override the base price for larger sizes or specific
                      colors.
                    </p>

                    <div>
                      <p className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Large size pricing
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="From size">
                          <input
                            type="number"
                            {...register("largeSizeFrom")}
                            className={inputCls}
                            placeholder="43"
                          />
                        </Field>
                        <Field label="Price (NGN)">
                          <input
                            type="number"
                            step="0.01"
                            {...register("largeSizePrice")}
                            className={inputCls}
                            placeholder="14000"
                          />
                        </Field>
                      </div>
                      <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                        e.g., sizes 43+ cost ₦14,000 instead of the base price
                      </p>
                    </div>

                    <Field
                      label="Color-specific prices (JSON)"
                      hint={`e.g., {"Gold": 15000, "Silver": 13000}`}
                    >
                      <textarea
                        {...register("differentColorPrices")}
                        rows={3}
                        className={`${inputCls} font-mono`}
                        placeholder='{"Gold": 15000, "Silver": 13000}'
                      />
                    </Field>

                    <div className="flex gap-2.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 dark:border-amber-900/30 dark:bg-amber-900/10">
                      <Info
                        size={14}
                        className="mt-0.5 shrink-0 text-amber-500"
                      />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        <strong>Priority:</strong> Color-specific prices
                        override size-based prices.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* ══ Images ══ */}
            <SectionCard id="images" title="Product images">
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="group relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700"
                    >
                      <img
                        src={image.url}
                        alt={`Product image ${index + 1}`}
                        className="aspect-[3/4] w-full object-cover"
                      />

                      {image.isFeatured && (
                        <div className="absolute left-2 top-2 rounded-md bg-yellow-400 px-2 py-0.5 text-[11px] font-semibold text-neutral-900">
                          Featured
                        </div>
                      )}

                      {/* Desktop overlay */}
                      <div className="absolute inset-0 hidden flex-col items-center justify-center gap-1.5 bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                        {!image.isFeatured && (
                          <button
                            type="button"
                            onClick={() => setFeaturedImage(index)}
                            className="flex w-full items-center justify-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-neutral-900 hover:bg-white"
                          >
                            <Star size={11} /> Feature
                          </button>
                        )}
                        <div className="flex w-full gap-1">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, index - 1)}
                              className="flex flex-1 items-center justify-center rounded-md bg-white/90 py-1 text-xs text-neutral-900 hover:bg-white"
                              title="Move left"
                            >
                              <ArrowLeft size={11} />
                            </button>
                          )}
                          {index < images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, index + 1)}
                              className="flex flex-1 items-center justify-center rounded-md bg-white/90 py-1 text-xs text-neutral-900 hover:bg-white"
                              title="Move right"
                            >
                              <ArrowRight size={11} />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="flex w-full items-center justify-center gap-1 rounded-md bg-red-600/90 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                        >
                          <Trash2 size={11} /> Remove
                        </button>
                      </div>

                      {/* Mobile actions */}
                      <div className="flex items-center justify-between gap-1 border-t border-neutral-200 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900 sm:hidden">
                        <button
                          type="button"
                          onClick={() => setFeaturedImage(index)}
                          className={`rounded border p-1 ${
                            image.isFeatured
                              ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                              : "border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                          }`}
                          aria-label={
                            image.isFeatured
                              ? "Featured image"
                              : "Set as featured"
                          }
                        >
                          <Star
                            size={13}
                            fill={image.isFeatured ? "currentColor" : "none"}
                          />
                        </button>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveImage(index, index - 1)}
                            disabled={index === 0}
                            className="rounded border border-neutral-200 p-1 text-neutral-600 disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-300"
                          >
                            <ArrowLeft size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(index, index + 1)}
                            disabled={index === images.length - 1}
                            className="rounded border border-neutral-200 p-1 text-neutral-600 disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-300"
                          >
                            <ArrowRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="rounded bg-red-600 p-1 text-white"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="absolute bottom-9 right-2 rounded bg-neutral-900/70 px-1.5 py-0.5 text-[11px] text-white sm:bottom-2">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {images.length < 5 ? (
                <div className="space-y-2">
                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center transition-colors hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/40 dark:hover:border-neutral-600">
                    <ImageIcon size={22} className="text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Click to upload images
                      <span className="ml-1 font-normal text-neutral-400">
                        ({images.length}/5)
                      </span>
                    </span>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      Cropped to 3:4 ratio · HEIC auto-converted · Max 5 MB each
                    </span>
                    <input
                      type="file"
                      id="images"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={
                        uploading || preparingImages || cropIndex !== null
                      }
                      className="sr-only"
                    />
                  </label>

                  {(preparingImages || uploading || cropIndex !== null) && (
                    <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                      {preparingImages && "Preparing images…"}
                      {uploading && "Uploading…"}
                      {cropIndex !== null &&
                        `Cropping image ${cropIndex + 1} of ${cropQueue.length}…`}
                    </p>
                  )}
                </div>
              ) : (
                <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-center text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  Maximum of 5 images reached.
                </p>
              )}

              {images.length === 0 && (
                <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
                  Upload at least one image before saving.
                </p>
              )}
            </SectionCard>
          </div>

          {/* ── Right: sticky sidebar ── */}
          <div className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              {/* Section nav */}
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <p className="border-b border-neutral-100 px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
                  On this page
                </p>
                <nav className="p-1.5">
                  {SECTIONS.map(({ id, label, icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        document
                          .getElementById(`section-${id}`)
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          })
                      }
                      className={[
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        activeSection === id
                          ? "bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                          : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200",
                      ].join(" ")}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Status card */}
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <p className="border-b border-neutral-100 px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
                  Status
                </p>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {[
                    {
                      label: "Images",
                      value: `${images.length} / 5`,
                      warn: images.length === 0,
                    },
                    {
                      label: "Collections",
                      value: `${selectedCollections.length}`,
                    },
                    {
                      label: "For sale",
                      value: availableForSale ? "Yes" : "No",
                    },
                  ].map(({ label, value, warn }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {label}
                      </span>
                      <span
                        className={`text-xs font-medium ${warn ? "text-red-500" : "text-neutral-900 dark:text-neutral-100"}`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="p-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    {isSubmitting
                      ? "Saving…"
                      : product
                        ? "Update product"
                        : "Create product"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImageCropModal
        isOpen={cropIndex !== null}
        imageSrc={cropImageSrc}
        aspect={PRODUCT_IMAGE_ASPECT}
        outputWidth={PRODUCT_IMAGE_WIDTH}
        outputHeight={PRODUCT_IMAGE_HEIGHT}
        title={
          cropIndex !== null
            ? `Crop image ${cropIndex + 1} of ${cropQueue.length}`
            : "Crop Image"
        }
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </form>
  );
}
