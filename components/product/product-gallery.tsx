"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type GalleryImage = { src: string; alt: string };

/**
 * Phones: full-bleed swipe carousel with a counter. Desktop: photos stacked
 * so the details column can stay pinned beside them. Tap any photo for a
 * full-screen viewer (pinch to zoom works natively there).
 */
export function ProductGallery({ images }: { images: GalleryImage[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () =>
      setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (!images.length) {
    return <div className="aspect-[4/5] bg-plate" aria-hidden />;
  }

  return (
    <>
      {/* Phones */}
      <div className="relative md:hidden">
        <div
          ref={track}
          className="rail flex snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setViewer(i)}
              className="relative aspect-[4/5] w-full shrink-0 snap-start bg-plate"
              aria-label={`View photo ${i + 1} full screen`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
        {images.length > 1 ? (
          <>
            <span className="label absolute right-3 top-3 bg-canvas/85 px-2 py-1 text-fg backdrop-blur">
              {index + 1} / {images.length}
            </span>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {images.map((img, i) => (
                <span
                  key={img.src}
                  className={`h-1 rounded-full bg-white transition-all duration-300 ${
                    i === index ? "w-5 opacity-100" : "w-1.5 opacity-50"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* Desktop */}
      <div className="hidden gap-2 md:grid md:grid-cols-2">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => setViewer(i)}
            data-cursor="Zoom"
            className={`relative bg-plate ${
              i === 0 ? "col-span-2 aspect-[4/5]" : "aspect-[4/5]"
            }`}
            aria-label={`View photo ${i + 1} full screen`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              priority={i === 0}
              sizes={i === 0 ? "60vw" : "30vw"}
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {viewer !== null ? (
        <Viewer
          images={images}
          start={viewer}
          onClose={() => setViewer(null)}
        />
      ) : null}
    </>
  );
}

function Viewer({
  images,
  start,
  onClose,
}: {
  images: GalleryImage[];
  start: number;
  onClose: () => void;
}) {
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    strip.current?.scrollTo({ left: start * window.innerWidth });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [start, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photos"
      className="animate-fade-in fixed inset-0 z-[70] bg-black"
    >
      <div
        ref={strip}
        className="rail flex h-full snap-x snap-mandatory overflow-x-auto"
      >
        {images.map((img) => (
          <div
            key={img.src}
            className="relative h-full w-screen shrink-0 snap-center"
            style={{ touchAction: "pan-x pinch-zoom" }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="100vw"
              quality={90}
              className="object-contain"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="label absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-10 items-center gap-2 bg-white px-4 text-black"
      >
        Close <X className="size-4" />
      </button>
    </div>
  );
}
