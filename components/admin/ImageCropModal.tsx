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
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
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
        <div className="flex w-full max-h-[calc(100vh-2rem)] flex-col border border-line bg-canvas text-fg shadow-2xl">
          <div className="flex items-center justify-between border-b border-line p-4">
            <h3 className="text-[15px] font-semibold">{title}</h3>
            <button
              type="button"
              onClick={onCancel}
              className="label px-3 py-1 text-fg-3 hover:text-fg"
            >
              Cancel
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="relative mx-auto w-full max-w-sm overflow-hidden bg-plate">
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
              <label className="flex items-center justify-between gap-4 text-sm text-fg-2">
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

              <div className="flex items-center justify-between text-xs text-fg-3">
                <span>
                  Output: {outputWidth}×{outputHeight}
                </span>
                <span>Aspect: {aspect.toFixed(2)}</span>
              </div>
              <p className="text-xs text-fg-3">
                Frame is locked to the site’s image layout.
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="h-10 border border-fg/40 px-4 font-mono text-[11px] uppercase tracking-wide text-fg hover:bg-fg hover:text-canvas"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={processing}
                  className="h-10 bg-fg px-4 font-mono text-[11px] uppercase tracking-wide text-canvas hover:opacity-85 disabled:opacity-60"
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
