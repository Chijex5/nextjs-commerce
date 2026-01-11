"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { generateSlug, generateSeoTitle, generateSeoDescription } from "../../lib/admin-utils";
import { toast } from "sonner";

type FormData = {
  title: string;
  handle: string;
  description: string;
  availableForSale: boolean;
  seoTitle: string;
  seoDescription: string;
  tags: string;
  price: string;
  variantTitle: string;
};

export default function ProductForm({
  collections,
  product,
}: {
  collections: { id: string; title: string; handle: string }[];
  product?: any;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(product?.images?.[0]?.url || "");
  const [uploading, setUploading] = useState(false);

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
      variantTitle: product?.variants?.[0]?.title || "Default",
    },
  });

  const title = watch("title");
  const description = watch("description");

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !product) {
      const slug = generateSlug(title);
      setValue("handle", slug);
    }
  }, [title, setValue, product]);

  // Auto-generate SEO fields
  useEffect(() => {
    if (title && !product) {
      setValue("seoTitle", generateSeoTitle(title));
    }
  }, [title, setValue, product]);

  useEffect(() => {
    if (description && !product) {
      setValue("seoDescription", generateSeoDescription(description));
    }
  }, [description, setValue, product]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const payload = {
        title: data.title,
        handle: data.handle,
        description: data.description,
        descriptionHtml: `<p>${data.description}</p>`,
        availableForSale: data.availableForSale,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        tags: data.tags
          ? data.tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t)
          : [],
        image: imageUrl || undefined,
        variant: {
          title: data.variantTitle,
          price: parseFloat(data.price),
          currencyCode: "NGN",
          availableForSale: data.availableForSale,
        },
      };

      const url = product
        ? `/api/admin/products/${product.id}`
        : "/api/admin/products";
      const method = product ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save product");
      }

      toast.success(product ? "Product updated successfully" : "Product created successfully");
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setImageUrl(data.url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="p-6">
          <h2 className="mb-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Basic Information
          </h2>

          {/* Title */}
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              {...register("title", { required: "Title is required" })}
              className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              placeholder="e.g., Classic Leather Slide"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              This will auto-generate the URL slug
            </p>
          </div>

          {/* Handle (Slug) */}
          <div className="mb-4">
            <label
              htmlFor="handle"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Handle (URL Slug) *
            </label>
            <input
              type="text"
              id="handle"
              {...register("handle", { required: "Handle is required" })}
              className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              placeholder="e.g., classic-leather-slide"
            />
            {errors.handle && (
              <p className="mt-1 text-sm text-red-600">{errors.handle.message}</p>
            )}
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Auto-generated from title. Edit if needed.
            </p>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Description
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              placeholder="Describe your product..."
            />
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              This will auto-populate SEO description
            </p>
          </div>

          {/* Available for Sale */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register("availableForSale")}
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
              />
              <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">
                Available for sale
              </span>
            </label>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Tags
            </label>
            <input
              type="text"
              id="tags"
              {...register("tags")}
              className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              placeholder="e.g., featured, bestseller, slides"
            />
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Separate tags with commas
            </p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="p-6">
          <h2 className="mb-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Pricing
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Price (NGN) *
              </label>
              <input
                type="number"
                id="price"
                step="0.01"
                {...register("price", { required: "Price is required" })}
                className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                placeholder="12000"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="variantTitle"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Variant Title
              </label>
              <input
                type="text"
                id="variantTitle"
                {...register("variantTitle")}
                className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                placeholder="Default"
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                e.g., "Size 40 / Black" or "Default"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="p-6">
          <h2 className="mb-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Product Image
          </h2>

          {imageUrl && (
            <div className="mb-4">
              <img
                src={imageUrl}
                alt="Product preview"
                className="h-48 w-48 rounded-lg object-cover"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="image"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Upload Image
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="mt-1 block w-full text-sm text-neutral-500 file:mr-4 file:rounded-md file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-800 dark:file:bg-neutral-100 dark:file:text-neutral-900 dark:hover:file:bg-neutral-200"
            />
            {uploading && (
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Uploading...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="p-6">
          <h2 className="mb-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
            SEO (Auto-generated)
          </h2>

          <div className="mb-4">
            <label
              htmlFor="seoTitle"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              SEO Title
            </label>
            <input
              type="text"
              id="seoTitle"
              {...register("seoTitle")}
              className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              placeholder="Auto-generated from title"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="seoDescription"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              SEO Description
            </label>
            <textarea
              id="seoDescription"
              {...register("seoDescription")}
              rows={3}
              className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              placeholder="Auto-generated from description"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {isSubmitting ? "Saving..." : product ? "Update Product" : "Create Product"}
        </button>
      </div>
    </form>
  );
}
