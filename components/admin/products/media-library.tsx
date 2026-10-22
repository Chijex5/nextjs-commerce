"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import clsx from "clsx";
import { withTransform, type MediaItem } from "lib/admin/media-library";
import { PRODUCT_IMAGE_ASPECT } from "lib/image-constants";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { buttonClass } from "components/ui/button";

const THUMB = "c_fill,w_300,h_400,q_auto,f_auto";

/**
 * Pick product photos that are already on Cloudinary, e.g. ones whose
 * product rows were lost, instead of uploading them again.
 */
export function MediaLibraryModal({
  open,
  onClose,
  room,
  exclude,
  onPick,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  /** How many more photos the product can take. */
  room: number;
  /** URLs already on this product. */
  exclude: string[];
  onPick: (items: MediaItem[]) => void;
  /** Extra controls under the grid (the background removal toggle). */
  footer?: ReactNode;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unusedOnly, setUnusedOnly] = useState(true);
  const [selected, setSelected] = useState<MediaItem[]>([]);

  async function load(next?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/admin/media" +
          (next ? `?cursor=${encodeURIComponent(next)}` : ""),
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Couldn't load photos");
      setItems((x) => (next ? [...x, ...data.items] : data.items));
      setCursor(data.nextCursor);
      setTotal(data.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    void load();
  }, [open]);

  const shown = items.filter(
    (m) => !exclude.includes(m.url) && (!unusedOnly || !m.usedBy),
  );
  const isSelected = (m: MediaItem) =>
    selected.some((s) => s.publicId === m.publicId);
  const toggle = (m: MediaItem) =>
    setSelected((x) =>
      isSelected(m)
        ? x.filter((s) => s.publicId !== m.publicId)
        : x.length < room
          ? [...x, m]
          : x,
    );

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60" aria-hidden />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <DialogPanel className="mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col border border-line bg-canvas text-fg shadow-2xl">
          <div className="flex items-center justify-between gap-4 border-b border-line p-4">
            <div>
              <DialogTitle className="text-[15px] font-semibold">
                Choose from uploaded photos
              </DialogTitle>
              <p className="text-xs text-fg-3">
                Product photos already on Cloudinary, newest first.
                {total !== null
                  ? ` ${total.toLocaleString("en-NG")} in all.`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-9 place-items-center text-fg-3 hover:text-fg"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2.5 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={unusedOnly}
                onChange={(e) => setUnusedOnly(e.target.checked)}
                className="size-4"
              />
              Only photos no product uses
            </label>
            <span className="text-xs text-fg-3">
              {selected.length} of {room} selected
            </span>
          </div>

          <div className="min-h-48 flex-1 overflow-y-auto p-4">
            {error ? (
              <p className="py-10 text-center text-sm text-red-600">{error}</p>
            ) : !loading && !shown.length ? (
              <p className="py-10 text-center text-sm text-fg-3">
                {items.length
                  ? "Every photo loaded so far is already on a product."
                  : "No product photos on Cloudinary yet."}
              </p>
            ) : (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {shown.map((m) => {
                  const on = isSelected(m);
                  const full = !on && selected.length >= room;
                  return (
                    <li key={m.publicId}>
                      <button
                        type="button"
                        onClick={() => toggle(m)}
                        disabled={full}
                        aria-pressed={on}
                        title={m.usedBy ? `Used on ${m.usedBy}` : undefined}
                        className={clsx(
                          "relative block w-full overflow-hidden bg-plate outline-offset-2",
                          on ? "outline outline-2 outline-fg" : "",
                          full ? "cursor-not-allowed opacity-40" : "",
                        )}
                        style={{ aspectRatio: String(PRODUCT_IMAGE_ASPECT) }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnail */}
                        <img
                          src={withTransform(m.url, THUMB)}
                          alt=""
                          loading="lazy"
                          className="size-full object-cover"
                        />
                        {on ? (
                          <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center bg-fg text-canvas">
                            <Check className="size-3.5" />
                          </span>
                        ) : null}
                        {m.usedBy ? (
                          <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-0.5 text-left text-[10px] text-white">
                            {m.usedBy}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-fg-3" />
              </div>
            ) : cursor && !error ? (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => load(cursor)}
                  className={buttonClass("outline", "md")}
                >
                  Load more
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-line p-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">{footer}</div>
            <div className="flex shrink-0 justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className={buttonClass("outline", "md")}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selected.length}
                onClick={() => onPick(selected)}
                className={buttonClass("solid", "md")}
              >
                Add {selected.length || ""} photo
                {selected.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
