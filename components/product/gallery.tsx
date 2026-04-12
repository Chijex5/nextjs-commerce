"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { GridTileImage } from "components/grid/tile";
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
    "flex h-full items-center justify-center px-6 text-[var(--dp-muted,#6A5A48)] transition-all ease-in-out hover:scale-105 hover:text-[var(--dp-cream,#F2E8D5)]";

  return (
    <form>
      <style>{`
        .dp-gallery-shell {
          border: 1px solid var(--dp-border, rgba(242,232,213,0.09));
          background: rgba(242,232,213,0.02);
        }
        .dp-gallery-controls {
          border: 1px solid var(--dp-border, rgba(242,232,213,0.09));
          background: rgba(10,7,4,0.66);
          color: var(--dp-muted, #6A5A48);
          backdrop-filter: blur(8px);
        }
        .dp-gallery-divider {
          background: var(--dp-border, rgba(242,232,213,0.09));
        }
      `}</style>

      <div
        className="dp-gallery-shell relative w-full overflow-hidden rounded-none"
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
                sizes="(min-width: 1280px) 58vw, (min-width: 1024px) 62vw, (min-width: 768px) 90vw, 100vw"
                alt={activeImage.altText as string}
                src={activeImage.src as string}
                priority={safeImageIndex === 0}
              />
            </motion.div>
          </AnimatePresence>
        )}

        {images.length > 1 ? (
          <div className="absolute bottom-[15%] hidden w-full justify-center sm:flex">
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

      {images.length > 1 ? (
        <div className="mt-6 sm:hidden">
          <h3 className="mb-3 text-[0.66rem] font-medium uppercase tracking-[0.2em] text-[var(--dp-ember,#BF5A28)]">
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
                  className="dp-gallery-shell relative w-2/3 flex-none overflow-hidden rounded-none"
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
                      sizes="70vw"
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

      {images.length > 1 ? (
        <ul className="my-12 hidden flex-wrap items-center justify-center gap-2 overflow-auto py-1 sm:flex lg:mb-0">
          {images.map((image, index) => {
            const isActive = index === safeImageIndex;
            const thumbAspect =
              image.width && image.height
                ? image.width / image.height
                : PRODUCT_IMAGE_ASPECT;
            const thumbCover =
              Math.abs(thumbAspect - PRODUCT_IMAGE_ASPECT) <= 0.05;

            return (
              <li key={image.src} className="h-20 w-20">
                <button
                  formAction={() => updateImage(index.toString())}
                  aria-label="Select product image"
                  className="h-full w-full"
                >
                  <GridTileImage
                    alt={image.altText}
                    src={image.src}
                    width={80}
                    height={80}
                    active={isActive}
                    fit={thumbCover ? "cover" : "contain"}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </form>
  );
}
