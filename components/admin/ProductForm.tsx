"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { generateSlug, generateSeoTitle, generateSeoDescription } from "../../lib/admin-utils";
import { toast } from "sonner";

type ImageUpload = {
  url: string;
  position: number;
  isFeatured: boolean;
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
  // Price variations
  largeSizePrice: string;
  largeSizeFrom: string;
  differentColorPrices: string; // JSON string for color-specific prices
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
  const [images, setImages] = useState<ImageUpload[]>(
    product?.images?.map((img: any, idx: number) => ({
      url: img.url,
      position: img.position || idx,
      isFeatured: img.isFeatured || idx === 0,
    })) || []
  );
  const [uploading, setUploading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPriceVariations, setShowPriceVariations] = useState(false);

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
      // Generate size range
      const sizeFrom = parseInt(data.sizeFrom);
      const sizeTo = parseInt(data.sizeTo);
      const sizes: string[] = [];
      for (let i = sizeFrom; i <= sizeTo; i++) {
        sizes.push(i.toString());
      }

      // Parse colors
      const colors = data.colors
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c);

      // Calculate price for each variant based on rules
      const basePrice = parseFloat(data.price);
      const largeSizePrice = data.largeSizePrice ? parseFloat(data.largeSizePrice) : basePrice;
      const largeSizeFrom = data.largeSizeFrom ? parseInt(data.largeSizeFrom) : null;

      // Parse color-specific prices if provided
      const colorPrices: Record<string, number> = {};
      if (data.differentColorPrices) {
        try {
          const parsed = JSON.parse(data.differentColorPrices);
          Object.keys(parsed).forEach((color) => {
            colorPrices[color.trim().toLowerCase()] = parseFloat(parsed[color]);
          });
        } catch (e) {
          // Invalid JSON, ignore
        }
      }

      // Function to get variant price
      const getVariantPrice = (size: string, color: string): number => {
        // Check color-specific price first
        const colorKey = color.trim().toLowerCase();
        if (colorPrices[colorKey]) {
          return colorPrices[colorKey];
        }
        
        // Check size-based price
        if (largeSizeFrom !== null && parseInt(size) >= largeSizeFrom) {
          return largeSizePrice;
        }
        
        return basePrice;
      };

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
        images: images,
        sizes,
        colors,
        // Pass pricing rules to API
        basePrice,
        largeSizePrice: largeSizeFrom !== null ? largeSizePrice : null,
        largeSizeFrom,
        colorPrices: Object.keys(colorPrices).length > 0 ? colorPrices : null,
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check max 5 images
    if (images.length + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    setUploading(true);

    try {
      const uploadedImages: ImageUpload[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Image ${file.name} is too large (max 5MB)`);
          continue;
        }

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
        uploadedImages.push({
          url: data.url,
          position: images.length + uploadedImages.length,
          isFeatured: images.length === 0 && uploadedImages.length === 0,
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

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // Reassign positions
    newImages.forEach((img, i) => {
      img.position = i;
      if (i === 0) img.isFeatured = true;
      else img.isFeatured = false;
    });
    setImages(newImages);
  };

  const setFeaturedImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isFeatured: i === index,
    }));
    setImages(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    
    // Reassign positions
    newImages.forEach((img, i) => {
      img.position = i;
    });
    
    setImages(newImages);
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

          {/* Handle (Slug) - Collapsible */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              <svg
                className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              Advanced Options (Auto-generated)
            </button>

            {showAdvanced && (
              <div className="space-y-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                <div>
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

                <div>
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
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Auto-generated as "Title - D'FOOTPRINT"
                  </p>
                </div>

                <div>
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
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Auto-truncated to 160 characters from description
                  </p>
                </div>
              </div>
            )}
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

      {/* Pricing & Variants */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="p-6">
          <h2 className="mb-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Pricing & Variants
          </h2>

          {/* Price */}
          <div className="mb-4">
            <label
              htmlFor="price"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Base Price (NGN) *
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

          {/* Size Range */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Size Range *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sizeFrom"
                  className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400"
                >
                  From
                </label>
                <input
                  type="number"
                  id="sizeFrom"
                  {...register("sizeFrom", { required: "Size from is required" })}
                  className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  placeholder="38"
                />
              </div>
              <div>
                <label
                  htmlFor="sizeTo"
                  className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400"
                >
                  To
                </label>
                <input
                  type="number"
                  id="sizeTo"
                  {...register("sizeTo", { required: "Size to is required" })}
                  className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  placeholder="44"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              System will create variants for all sizes in this range (e.g., 38-44 creates 7 sizes)
            </p>
          </div>

          {/* Colors */}
          <div className="mb-4">
            <label
              htmlFor="colors"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Available Colors *
            </label>
            <input
              type="text"
              id="colors"
              {...register("colors", { required: "At least one color is required" })}
              className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              placeholder="Black, Brown, Navy"
            />
            {errors.colors && (
              <p className="mt-1 text-sm text-red-600">{errors.colors.message}</p>
            )}
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Separate colors with commas (e.g., "Black, Brown, Navy")
            </p>
          </div>

          <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> System will automatically create all size × color combinations.
              For example: Size 38-40 with Black, Brown = 6 variants (38-Black, 38-Brown, 39-Black, 39-Brown, 40-Black, 40-Brown)
            </p>
          </div>

          {/* Price Variations (Optional) */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowPriceVariations(!showPriceVariations)}
              className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              <svg
                className={`h-4 w-4 transition-transform ${showPriceVariations ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              Price Variations (Optional)
            </button>

            {showPriceVariations && (
              <div className="space-y-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Set different prices for larger sizes or specific colors
                </p>

                {/* Large Size Price */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Large Size Pricing
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="largeSizeFrom"
                        className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400"
                      >
                        From Size
                      </label>
                      <input
                        type="number"
                        id="largeSizeFrom"
                        {...register("largeSizeFrom")}
                        className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        placeholder="43"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="largeSizePrice"
                        className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400"
                      >
                        Price (NGN)
                      </label>
                      <input
                        type="number"
                        id="largeSizePrice"
                        step="0.01"
                        {...register("largeSizePrice")}
                        className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        placeholder="14000"
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Example: Size 43-45 costs 14000 instead of base price
                  </p>
                </div>

                {/* Color-Specific Prices */}
                <div>
                  <label
                    htmlFor="differentColorPrices"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Color-Specific Prices (JSON)
                  </label>
                  <textarea
                    id="differentColorPrices"
                    {...register("differentColorPrices")}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-mono focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    placeholder='{"Gold": 15000, "Silver": 13000}'
                  />
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Example: {`{"Gold": 15000, "Silver": 13000}`} - Gold costs 15000, Silver costs 13000
                  </p>
                </div>

                <div className="rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    <strong>Priority:</strong> Color-specific prices override size-based prices. If both are set, color price wins.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Images (Max 5) */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="p-6">
          <h2 className="mb-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Product Images (Max 5)
          </h2>

          {/* Image Grid */}
          {images.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <img
                    src={image.url}
                    alt={`Product image ${index + 1}`}
                    className="h-32 w-full object-cover"
                  />
                  
                  {/* Featured Badge */}
                  {image.isFeatured && (
                    <div className="absolute left-2 top-2 rounded bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-neutral-900">
                      Featured
                    </div>
                  )}

                  {/* Overlay with actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    {!image.isFeatured && (
                      <button
                        type="button"
                        onClick={() => setFeaturedImage(index)}
                        className="rounded bg-white px-2 py-1 text-xs font-medium text-neutral-900 hover:bg-neutral-100"
                        title="Set as featured"
                      >
                        Star
                      </button>
                    )}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, index - 1)}
                        className="rounded bg-white px-2 py-1 text-xs font-medium text-neutral-900 hover:bg-neutral-100"
                        title="Move left"
                      >
                        ←
                      </button>
                    )}
                    {index < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, index + 1)}
                        className="rounded bg-white px-2 py-1 text-xs font-medium text-neutral-900 hover:bg-neutral-100"
                        title="Move right"
                      >
                        →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Position indicator */}
                  <div className="absolute bottom-2 right-2 rounded bg-neutral-900/75 px-1.5 py-0.5 text-xs text-white">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {images.length < 5 && (
            <div>
              <label
                htmlFor="images"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Upload Images ({images.length}/5)
              </label>
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className="mt-1 block w-full text-sm text-neutral-500 file:mr-4 file:rounded-md file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-800 dark:file:bg-neutral-100 dark:file:text-neutral-900 dark:hover:file:bg-neutral-200"
              />
              {uploading && (
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  Uploading...
                </p>
              )}
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Select multiple images (max 5 total). First image or starred image will be featured. Drag to reorder.
              </p>
            </div>
          )}

          {images.length === 0 && (
            <div className="rounded-md bg-neutral-50 p-4 text-center dark:bg-neutral-800">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                No images uploaded yet. Upload at least one image.
              </p>
            </div>
          )}
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
