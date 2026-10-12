"use client";

import clsx from "clsx";
import { AlertCircle, ImagePlus, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type Photo = {
  id: string;
  previewUrl: string;
  status: "uploading" | "uploaded" | "error";
  url?: string;
  publicId?: string;
  deleteToken?: string;
};

const MAX_BYTES = 8 * 1024 * 1024;

/** Phone photos are often 3–6 MB; shrink big JPEG/PNG/WebP before upload to save data. */
async function shrink(file: File): Promise<Blob> {
  if (file.size < 1.5 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type))
    return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/jpeg", 0.85),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Upload state for custom-order photos (to /api/custom-order-requests/upload). */
export function usePhotoUploads(max: number, initial: Photo[] = []) {
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  useEffect(
    () => () => {
      for (const p of photosRef.current)
        if (p.previewUrl.startsWith("blob:")) URL.revokeObjectURL(p.previewUrl);
    },
    [],
  );

  const upload = async (id: string, file: File) => {
    try {
      const body = new FormData();
      const blob = await shrink(file);
      body.append("file", blob, file.name);
      const res = await fetch("/api/custom-order-requests/upload", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
      setPhotos((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          if (p.previewUrl.startsWith("blob:")) URL.revokeObjectURL(p.previewUrl);
          return {
            ...p,
            status: "uploaded",
            previewUrl: data.url,
            url: data.url,
            publicId: data.publicId,
            deleteToken: data.deleteToken,
          };
        }),
      );
    } catch (e) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "error" } : p)),
      );
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const add = (files: FileList | File[] | null) => {
    if (!files) return;
    const room = max - photosRef.current.length;
    if (room <= 0) return toast.error(`You can add up to ${max} photos`);
    const picked = Array.from(files)
      .slice(0, room)
      .filter((f) => {
        if (!f.type.startsWith("image/")) {
          toast.error(`${f.name} isn't a photo`);
          return false;
        }
        if (f.size > MAX_BYTES * 3) {
          toast.error(`${f.name} is too large`);
          return false;
        }
        return true;
      });
    const items = picked.map((f) => ({
      id: newId(),
      previewUrl: URL.createObjectURL(f),
      status: "uploading" as const,
    }));
    setPhotos((prev) => [...prev, ...items]);
    picked.forEach((f, i) => void upload(items[i]!.id, f));
  };

  const remove = (photo: Photo) => {
    if (photo.publicId && photo.deleteToken)
      void fetch("/api/custom-order-requests/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: photo.publicId,
          deleteToken: photo.deleteToken,
        }),
      }).catch(() => {});
    if (photo.previewUrl.startsWith("blob:")) URL.revokeObjectURL(photo.previewUrl);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  };

  const clear = useCallback(() => setPhotos([]), []);
  /** Put back photos from a saved draft (already uploaded). */
  const restore = useCallback(
    (list: Photo[]) => setPhotos(list.filter((p) => p.status === "uploaded" && p.url)),
    [],
  );

  return {
    photos,
    add,
    remove,
    clear,
    restore,
    uploading: photos.some((p) => p.status === "uploading"),
    urls: photos.filter((p) => p.url).map((p) => p.url as string),
  };
}

/** Thumbnails with remove buttons, plus an "add photo" tile. */
export function PhotoGrid({
  photos,
  max,
  onAdd,
  onRemove,
  addLabel = "Add photo",
  compact = false,
}: {
  photos: Photo[];
  max: number;
  onAdd: (files: FileList | null) => void;
  onRemove: (photo: Photo) => void;
  addLabel?: string;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      className={clsx(
        "grid gap-2",
        compact ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-3 sm:grid-cols-4",
      )}
      onPaste={(e) => {
        if (e.clipboardData.files.length) onAdd(e.clipboardData.files);
      }}
    >
      {photos.map((p) => (
        <div key={p.id} className="relative aspect-square overflow-hidden bg-plate">
          {/* eslint-disable-next-line @next/next/no-img-element -- local previews and Cloudinary uploads */}
          <img src={p.previewUrl} alt="" className="size-full object-cover" />
          {p.status !== "uploaded" ? (
            <div className="absolute inset-0 grid place-items-center bg-canvas/60">
              {p.status === "uploading" ? (
                <Loader2 className="size-5 animate-spin text-fg" />
              ) : (
                <AlertCircle className="size-5 text-red-600" />
              )}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => onRemove(p)}
            aria-label="Remove photo"
            className="absolute right-1 top-1 grid size-7 place-items-center bg-canvas/90 text-fg hover:bg-fg hover:text-canvas"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      {photos.length < max ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 border border-dashed border-fg/30 text-fg-3 transition-colors hover:border-fg hover:text-fg"
        >
          <ImagePlus className={compact ? "size-4" : "size-5"} />
          {compact ? null : <span className="label">{addLabel}</span>}
        </button>
      ) : null}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onAdd(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
