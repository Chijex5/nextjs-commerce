"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  discardUpload,
  removeBackgroundFromExisting,
} from "components/admin/ui/image-upload";
import { buttonClass } from "components/ui/button";
import { withTransform } from "lib/admin/media-library";
import { PRODUCT_IMAGE_ASPECT } from "lib/image-constants";
import { Loader2, WandSparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

const PREVIEW = "w_900,q_auto,f_auto";
const REVEAL_MS = 1800;

export type EditedPhoto = {
  url: string;
  width: number;
  height: number;
  publicId: string;
};

type Usage = {
  configured: boolean;
  used: number;
  limit: number;
  remaining: number;
  windowDays: number;
};

type Stage = "idle" | "working" | "revealing" | "done";

/**
 * Preview a product photo and cut its background out with Cloudinary. A band
 * of light sweeps over the photo while it works, then wipes the background
 * away as the cut-out arrives. Nothing changes until "Use this photo".
 */
export function BackgroundRemoverDialog({
  src,
  onClose,
  onApply,
  onUsed,
}: {
  /** The photo to edit; the dialog is open while this is set. */
  src: string | null;
  onClose: () => void;
  onApply: (photo: EditedPhoto) => void;
  /** Called after a removal, which counts against the limit either way. */
  onUsed?: () => void;
}) {
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<EditedPhoto | null>(null);
  const [error, setError] = useState<string | null>(null);
  // undefined while loading, null if the check failed.
  const [usage, setUsage] = useState<Usage | null | undefined>();

  useEffect(() => {
    if (!src) return;
    setStage("idle");
    setResult(null);
    setError(null);
    setUsage(undefined);
    fetch("/api/admin/background-removal")
      .then((r) => (r.ok ? r.json() : null))
      .then(setUsage)
      .catch(() => setUsage(null));
  }, [src]);

  const available = !!usage?.configured && usage.remaining > 0;

  async function run() {
    if (!src) return;
    setStage("working");
    setError(null);
    try {
      const photo = await removeBackgroundFromExisting(src);
      // Load the cut-out before the reveal so the wipe never shows a blank.
      await new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = img.onerror = () => resolve();
        img.src = withTransform(photo.url, PREVIEW);
      });
      setResult(photo);
      setStage("revealing");
      setTimeout(() => setStage("done"), REVEAL_MS);
    } catch (e) {
      setError((e as Error).message);
      setStage("idle");
    } finally {
      onUsed?.();
    }
  }

  function close() {
    if (stage === "working" || stage === "revealing") return;
    // The cut-out was stored on Cloudinary; drop it if it isn't kept.
    if (result) discardUpload(result.publicId);
    onClose();
  }

  return (
    <Dialog open={!!src} onClose={close} className="relative z-[60]">
      <div className="fixed inset-0 bg-black/70" aria-hidden />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <DialogPanel className="mx-auto flex w-full max-w-md flex-col border border-line bg-canvas text-fg shadow-2xl">
          <div className="flex items-center justify-between border-b border-line p-4">
            <DialogTitle className="text-[15px] font-semibold">
              Edit photo
            </DialogTitle>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              disabled={stage === "working" || stage === "revealing"}
              className="grid size-9 place-items-center text-fg-3 hover:text-fg disabled:opacity-30"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="p-4">
            <div
              className="relative mx-auto w-full max-w-sm overflow-hidden bg-plate"
              style={{ aspectRatio: String(PRODUCT_IMAGE_ASPECT) }}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element -- Cloudinary preview
                <img
                  src={withTransform(src, PREVIEW)}
                  alt="Original photo"
                  className={
                    "absolute inset-0 size-full object-contain" +
                    (stage === "working" ? " bg-working" : "")
                  }
                />
              ) : null}
              {result && stage !== "working" ? (
                // eslint-disable-next-line @next/next/no-img-element -- Cloudinary preview
                <img
                  src={withTransform(result.url, PREVIEW)}
                  alt="Photo with the background removed"
                  className={
                    "absolute inset-0 size-full object-contain" +
                    (stage === "revealing" ? " bg-reveal" : "")
                  }
                />
              ) : null}
              {stage === "working" ? (
                <span className="bg-light bg-light-loop" aria-hidden />
              ) : null}
              {stage === "revealing" ? (
                <span className="bg-light bg-light-once" aria-hidden />
              ) : null}
            </div>

            <p
              className="mt-3 min-h-5 text-center text-xs text-fg-3"
              aria-live="polite"
            >
              {error ? (
                <span className="text-red-600">{error}</span>
              ) : stage === "working" ? (
                "Removing background… this can take up to half a minute."
              ) : stage === "done" ? (
                "Background removed. Use it, or keep the original."
              ) : usage === undefined ? (
                "Checking usage…"
              ) : usage === null ? (
                "Couldn't check usage, so removal is unavailable right now."
              ) : !usage.configured ? (
                "Cloudinary isn't set up, so removal is unavailable."
              ) : (
                `${usage.used} of ${usage.limit} removals used in the last ${usage.windowDays} days` +
                (usage.remaining === 0 ? " — limit reached." : ".")
              )}
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-line p-4">
            {stage === "done" && result ? (
              <>
                <button
                  type="button"
                  onClick={close}
                  className={buttonClass("outline", "md")}
                >
                  Keep original
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApply(result);
                    onClose();
                  }}
                  className={buttonClass("solid", "md")}
                >
                  Use this photo
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={run}
                disabled={!available || stage !== "idle"}
                className={buttonClass("solid", "md")}
              >
                {stage === "idle" ? (
                  <WandSparkles className="size-4" />
                ) : (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {stage === "idle"
                  ? error
                    ? "Try again"
                    : "Remove background"
                  : "Working…"}
              </button>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
