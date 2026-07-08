"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { PRODUCT_IMAGE_ASPECT } from "lib/image-constants";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

export function Gallery({
  images,
}: {
  images: { src: string; altText: string; width: number; height: number }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlImageIndex = useMemo(() => {
    if (!searchParams.has("image")) return 0;
    const parsed = parseInt(searchParams.get("image")!, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [searchParams]);

  const [imageIndex, setImageIndex] = useState(urlImageIndex);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setImageIndex((current) =>
      current === urlImageIndex ? current : urlImageIndex,
    );
  }, [urlImageIndex]);

  const safeImageIndex =
    imageIndex >= 0 && imageIndex < images.length ? imageIndex : 0;
  const activeImage = images[safeImageIndex];
  const activeAspect =
    activeImage && activeImage.width && activeImage.height
      ? activeImage.width / activeImage.height
      : PRODUCT_IMAGE_ASPECT;
  const useCover = Math.abs(activeAspect - PRODUCT_IMAGE_ASPECT) <= 0.05;

  const updateImage = (index: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("image", index);
    setImageIndex(parseInt(index, 10));
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  const nextImageIndex =
    safeImageIndex + 1 < images.length ? safeImageIndex + 1 : 0;
  const previousImageIndex =
    safeImageIndex === 0 ? images.length - 1 : safeImageIndex - 1;

  const buttonClassName =
    "flex h-full items-center justify-center px-6 text-[var(--dp-muted,var(--brand-muted))] transition-all ease-in-out hover:scale-105 hover:text-[var(--dp-cream,var(--brand-cream))]";

  return (
    <form>
      <style>{`
        .dp-gallery-shell {
          border: 1px solid var(--dp-border, rgba(var(--brand-fg-rgb),0.09));
          background: rgba(var(--brand-fg-rgb),0.02);
        }
        .dp-gallery-controls {
          border: 1px solid var(--dp-border, rgba(var(--brand-fg-rgb),0.09));
          background: rgba(var(--brand-bg-rgb),0.66);
          color: var(--dp-muted, var(--brand-muted));
          backdrop-filter: blur(8px);
        }
        .dp-gallery-divider {
          background: var(--dp-border, rgba(var(--brand-fg-rgb),0.09));
        }
        /* Vertical thumbnail rail (desktop) */
        .dp-rail-thumb {
          position: relative;
          overflow: hidden;
          aspect-ratio: 1;
          border: 1px solid var(--dp-border, rgba(var(--brand-fg-rgb),0.09));
          background: rgba(var(--brand-fg-rgb),0.02);
          opacity: 0.6;
          transition: opacity 0.3s, border-color 0.3s;
        }
        .dp-rail-thumb:hover { opacity: 0.85; }
        .dp-rail-thumb-active {
          opacity: 1;
          border-color: var(--dp-cream, var(--brand-cream));
        }
        .dp-rail-thumb img { transition: transform 0.5s ease; }
        .dp-rail-thumb:hover img { transform: scale(1.05); }
      `}</style>

      {/* Editorial layout: large image + vertical thumb rail on desktop */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-4">
        {/* Desktop vertical rail */}
        {images.length > 1 ? (
          <ul className="hidden shrink-0 lg:flex lg:w-[84px] lg:flex-col lg:gap-3">
            {images.map((image, index) => {
              const isActive = index === safeImageIndex;
              return (
                <li key={`${image.src}-rail`}>
                  <button
                    formAction={() => updateImage(index.toString())}
                    aria-label={`View image ${index + 1}`}
                    className={`dp-rail-thumb block w-full ${
                      isActive ? "dp-rail-thumb-active" : ""
                    }`}
                  >
                    <Image
                      className="h-full w-full object-cover"
                      fill
                      sizes="84px"
                      alt={image.altText}
                      src={image.src}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {/* Main image */}
        <div
          className="dp-gallery-shell relative w-full overflow-hidden rounded-none lg:flex-1"
          style={{ aspectRatio: `${activeAspect}` }}
        >
          {activeImage && (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeImage.src}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.25, ease: [0, 0, 0.2, 1] },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
                }}
                className="absolute inset-0"
              >
                <Image
                  className={
                    useCover
                      ? "h-full w-full object-cover"
                      : "h-full w-full object-contain"
                  }
                  fill
                  sizes="(min-width: 1280px) 52vw, (min-width: 1024px) 56vw, (min-width: 768px) 90vw, 100vw"
                  alt={activeImage.altText as string}
                  src={activeImage.src as string}
                  priority={safeImageIndex === 0}
                />
              </motion.div>
            </AnimatePresence>
          )}

          {images.length > 1 ? (
            <div className="absolute bottom-[6%] hidden w-full justify-center sm:flex">
              <div className="dp-gallery-controls mx-auto flex h-11 items-center rounded-none">
                <button
                  formAction={() => updateImage(previousImageIndex.toString())}
                  aria-label="Previous product image"
                  className={buttonClassName}
                >
                  <ArrowLeftIcon className="h-5" />
                </button>
                <div className="dp-gallery-divider mx-1 h-6 w-px"></div>
                <button
                  formAction={() => updateImage(nextImageIndex.toString())}
                  aria-label="Next product image"
                  className={buttonClassName}
                >
                  <ArrowRightIcon className="h-5" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile horizontal thumbnail scroller */}
      {images.length > 1 ? (
        <div className="mt-6 lg:hidden">
          <h3 className="mb-3 text-[0.66rem] font-medium uppercase tracking-[0.2em] text-[var(--dp-ember,var(--brand-terra))]">
            Gallery
          </h3>
          <ul className="flex gap-4 overflow-x-auto pb-2">
            {images.map((image, index) => {
              const mobileAspect =
                image.width && image.height
                  ? image.width / image.height
                  : PRODUCT_IMAGE_ASPECT;

              return (
                <li
                  key={`${image.src}-mobile`}
                  className="dp-gallery-shell relative w-2/5 flex-none overflow-hidden rounded-none sm:w-1/4"
                  style={{ aspectRatio: `${mobileAspect}` }}
                >
                  <button
                    formAction={() => updateImage(index.toString())}
                    aria-label={`View image ${index + 1}`}
                    className="absolute inset-0"
                  >
                    <Image
                      className="h-full w-full object-cover"
                      fill
                      sizes="40vw"
                      alt={image.altText}
                      src={image.src}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </form>
  );
}
