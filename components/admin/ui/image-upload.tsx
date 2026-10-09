"use client";

import clsx from "clsx";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

const MAX_BYTES = 8 * 1024 * 1024;

/** Upload one image through /api/admin/upload (Cloudinary) and return its URL. */
export async function uploadImage(file: File): Promise<string> {
  if (file.size > MAX_BYTES)
    throw new Error(
      "That image is over 8 MB. Export a smaller version and try again.",
    );
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) throw new Error(data?.error || "Upload failed");
  return data.url as string;
}

/** Click or drop to upload a single image. Shows the current image with a remove button. */
export function ImageUpload({
  value,
  onChange,
  label,
  aspect = "aspect-square",
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  async function handle(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("That isn't an image file.");
    setBusy(true);
    try {
      onChange(await uploadImage(file));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="label mb-1.5 block text-fg-3">{label}</span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void handle(e.dataTransfer.files[0]);
        }}
        className={clsx(
          "relative overflow-hidden border bg-plate",
          aspect,
          over ? "border-fg" : "border-line border-dashed",
        )}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt=""
              fill
              sizes="320px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label={`Remove ${label.toLowerCase()}`}
              className="absolute right-2 top-2 grid size-8 place-items-center bg-canvas text-fg hover:bg-fg hover:text-canvas"
            >
              <X className="size-4" />
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={clsx(
            "absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-fg-3",
            value &&
              "opacity-0 hover:bg-black/40 hover:text-white hover:opacity-100",
          )}
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
          {busy ? "Uploading…" : value ? "Replace" : "Click or drop an image"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handle(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
