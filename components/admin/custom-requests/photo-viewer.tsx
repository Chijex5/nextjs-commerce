"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Loader2,
  Share2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Insert a Cloudinary transformation (e.g. `fl_attachment`) into an upload URL. */
const withTransform = (src: string, t: string) =>
  src.includes("/upload/") ? src.replace("/upload/", `/upload/${t}/`) : src;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/avif": "avif",
};

async function fetchFile(src: string, name: string) {
  const res = await fetch(src);
  if (!res.ok) throw new Error("Couldn't load the photo");
  const blob = await res.blob();
  const ext = EXT[blob.type] ?? src.split("?")[0]!.split(".").pop() ?? "jpg";
  return new File([blob], `${name}.${ext}`, {
    type: blob.type || "image/jpeg",
  });
}

function saveFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadPhoto(src: string, name: string) {
  try {
    saveFile(await fetchFile(src, name));
  } catch {
    // Cloudinary serves the file as an attachment with this flag.
    window.location.href = withTransform(src, "fl_attachment");
  }
}

/**
 * Full-screen photo viewer for customer uploads, with buttons to save the
 * photo, share it straight to WhatsApp (phone share sheet) or copy it for
 * pasting into WhatsApp Web.
 */
export function PhotoViewer({
  images,
  index,
  onIndex,
  onClose,
  fileName,
}: {
  images: string[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
  /** Base name for saved files; the photo number is appended. */
  fileName: string;
}) {
  const [busy, setBusy] = useState<"download" | "share" | "copy" | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [canCopy, setCanCopy] = useState(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    try {
      setCanShare(
        typeof navigator.canShare === "function" &&
          navigator.canShare({
            files: [new File([""], "x.jpg", { type: "image/jpeg" })],
          }),
      );
    } catch {
      setCanShare(false);
    }
    setCanCopy(
      typeof ClipboardItem !== "undefined" && !!navigator.clipboard?.write,
    );
  }, []);

  const open = index !== null;
  const i = index ?? 0;
  const src = images[i] ?? "";
  const name = `${fileName}-${i + 1}`;
  const many = images.length > 1;
  const go = (d: number) => onIndex((i + d + images.length) % images.length);

  useEffect(() => {
    if (!open || !many) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function run(kind: "download" | "share" | "copy") {
    setBusy(kind);
    try {
      if (kind === "download") {
        await downloadPhoto(src, name);
      } else if (kind === "share") {
        const file = await fetchFile(src, name);
        await navigator.share({ files: [file] });
      } else {
        // Clipboard only takes PNG everywhere, so ask Cloudinary for one.
        const file = await fetchFile(withTransform(src, "f_png"), name);
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": file }),
        ]);
        toast.success("Photo copied — paste it into WhatsApp");
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error(
        kind === "copy"
          ? "Couldn't copy the photo. Download it instead."
          : "Something went wrong. Try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  const action =
    "inline-flex h-11 items-center justify-center gap-2 px-4 text-xs font-semibold uppercase tracking-wide transition-opacity disabled:opacity-50";

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/95" aria-hidden />
      <DialogPanel className="fixed inset-0 flex flex-col text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <DialogTitle className="text-sm tabular-nums text-white/70">
            Photo {i + 1} of {images.length}
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-10 place-items-center"
          >
            <X className="size-5" />
          </button>
        </div>

        <div
          className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-2"
          onPointerDown={(e) => (startX.current = e.clientX)}
          onPointerUp={(e) => {
            if (startX.current === null || !many) return;
            const dx = e.clientX - startX.current;
            startX.current = null;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          }}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- customer uploads
            <img
              src={src}
              alt={`Photo ${i + 1}`}
              className="max-h-full max-w-full select-none object-contain"
              draggable={false}
            />
          ) : null}
          {many ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center bg-black/40 hover:bg-black/70"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center bg-black/40 hover:bg-black/70"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          ) : null}
        </div>

        {many ? (
          <div className="flex justify-center gap-2 overflow-x-auto px-4 pt-3">
            {images.map((s, n) => (
              <button
                key={s + n}
                type="button"
                onClick={() => onIndex(n)}
                aria-label={`Photo ${n + 1}`}
                className={clsx(
                  "size-12 shrink-0 overflow-hidden border-2",
                  n === i ? "border-white" : "border-transparent opacity-60",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- customer uploads */}
                <img src={s} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {canShare ? (
            <button
              type="button"
              onClick={() => run("share")}
              disabled={!!busy}
              className={clsx(action, "bg-[#25D366] text-black")}
            >
              {busy === "share" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Share2 className="size-4" />
              )}
              Share to WhatsApp
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => run("download")}
            disabled={!!busy}
            className={clsx(action, "bg-white text-black")}
          >
            {busy === "download" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Download
          </button>
          {canCopy && !canShare ? (
            <button
              type="button"
              onClick={() => run("copy")}
              disabled={!!busy}
              className={clsx(action, "border border-white/50")}
            >
              {busy === "copy" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Copy className="size-4" />
              )}
              Copy
            </button>
          ) : null}
        </div>
      </DialogPanel>
    </Dialog>
  );
}
