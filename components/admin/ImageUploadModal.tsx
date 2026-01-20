"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { X, Upload, Star, Trash2, Loader2 } from "lucide-react";
import {
  PRODUCT_IMAGE_HEIGHT,
  PRODUCT_IMAGE_WIDTH,
} from "@/lib/image-constants";

interface ImageData {
  url: string;
  position: number;
  isFeatured: boolean;
  publicId?: string;
  width: number;
  height: number;
}

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageData[];
  onSave: (images: ImageData[]) => void;
  productTitle: string;
}

export default function ImageUploadModal({
  isOpen,
  onClose,
  images: initialImages,
  onSave,
  productTitle,
}: ImageUploadModalProps) {
  const [images, setImages] = useState<ImageData[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check max 5 images
    if (images.length + files.length > 5) {
      toast.error("Maximum 5 images allowed per product");
      return;
    }

    setUploading(true);
    const uploadedImages: ImageData[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }

        // Show progress for this file
        const fileKey = `file-${i}`;
        setUploadProgress((prev) => ({ ...prev, [fileKey]: 0 }));

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();

        uploadedImages.push({
          url: data.url,
          publicId: data.publicId,
          position: images.length + uploadedImages.length,
          isFeatured: images.length === 0 && uploadedImages.length === 0,
          width: data.width ?? PRODUCT_IMAGE_WIDTH,
          height: data.height ?? PRODUCT_IMAGE_HEIGHT,
        });

        setUploadProgress((prev) => ({ ...prev, [fileKey]: 100 }));
      }

      setImages([...images, ...uploadedImages]);
      toast.success(`${uploadedImages.length} image(s) uploaded successfully`);

      // Clear progress after a delay
      setTimeout(() => setUploadProgress({}), 1000);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // Reassign positions and featured status
    newImages.forEach((img, i) => {
      img.position = i;
      img.isFeatured = i === 0;
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

  const handleSave = () => {
    onSave(images);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-white dark:bg-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Product Images
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {productTitle} • {images.length}/5 images
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading || images.length >= 5}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className={`cursor-pointer ${uploading || images.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Uploading images...
                  </p>
                  {Object.values(uploadProgress).length > 0 && (
                    <div className="mt-2 w-full max-w-xs">
                      {Object.entries(uploadProgress).map(([key, progress]) => (
                        <div key={key} className="mt-1">
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    {images.length >= 5
                      ? "Maximum images reached"
                      : "Click to upload images"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    PNG, JPG, WEBP up to 5MB • Max 5 images
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Images Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`relative group rounded-lg overflow-hidden border-2 ${
                    image.isFeatured
                      ? "border-yellow-500 shadow-lg"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />

                  {/* Featured Badge */}
                  {image.isFeatured && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Featured
                    </div>
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!image.isFeatured && (
                      <button
                        onClick={() => setFeaturedImage(index)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                        title="Set as featured"
                      >
                        <Star className="h-4 w-4" />
                        Set Featured
                      </button>
                    )}
                    <button
                      onClick={() => removeImage(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>

                  {/* Position Number */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-bold">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && !uploading && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No images yet. Upload some images to get started.
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={uploading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Images ({images.length})
          </button>
        </div>
      </div>
    </div>
  );
}
