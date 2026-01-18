"use client";

import Cropper, { Area } from "react-easy-crop";
import { useEffect, useState } from "react";
import { getCroppedImageBlob } from "@/lib/image-crop";

type ImageCropModalProps = {
  isOpen: boolean;
  imageSrc: string | null;
  aspect: number;
  outputWidth: number;
  outputHeight: number;
  title?: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
};

export default function ImageCropModal({
  isOpen,
  imageSrc,
  aspect,
  outputWidth,
  outputHeight,
  title = "Crop Image",
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
    null,
  );
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [isOpen, imageSrc]);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImageBlob(
        imageSrc,
        croppedAreaPixels,
        outputWidth,
        outputHeight,
      );
      await onConfirm(blob);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-xl items-center">
        <div className="flex w-full max-h-[calc(100vh-2rem)] flex-col rounded-xl bg-white shadow-2xl dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
          <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <div
              className="relative w-full"
              style={{ aspectRatio: `${outputWidth} / ${outputHeight}` }}
            >
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={(_, croppedArea) =>
                  setCroppedAreaPixels(croppedArea)
                }
                onZoomChange={setZoom}
                showGrid={false}
              />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <label className="flex items-center justify-between gap-4 text-sm text-neutral-600 dark:text-neutral-300">
              <span>Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-44"
              />
            </label>

            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>Output: {outputWidth}×{outputHeight}</span>
              <span>Aspect: {aspect.toFixed(2)}</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Frame is locked to the site’s image layout.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={processing}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                {processing ? "Cropping..." : "Use Crop"}
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
