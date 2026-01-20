"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { GridTileImage } from "components/grid/tile";
import { PRODUCT_IMAGE_ASPECT } from "lib/image-constants";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export function Gallery({
  images,
}: {
  images: { src: string; altText: string; width: number; height: number }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageIndex = searchParams.has("image")
    ? parseInt(searchParams.get("image")!)
    : 0;
  const activeImage = images[imageIndex];
  const activeAspect =
    activeImage && activeImage.width && activeImage.height
      ? activeImage.width / activeImage.height
      : PRODUCT_IMAGE_ASPECT;
  const useCover = Math.abs(activeAspect - PRODUCT_IMAGE_ASPECT) <= 0.05;

  const updateImage = (index: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("image", index);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const nextImageIndex = imageIndex + 1 < images.length ? imageIndex + 1 : 0;
  const previousImageIndex =
    imageIndex === 0 ? images.length - 1 : imageIndex - 1;

  const buttonClassName =
    "h-full px-6 transition-all ease-in-out hover:scale-110 hover:text-black dark:hover:text-white flex items-center justify-center";

  return (
    <form>
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-neutral-50 dark:bg-neutral-900/40"
        style={{ aspectRatio: `${activeAspect}` }}
      >
        {activeImage && (
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
            priority={imageIndex === 0}
          />
        )}

        {images.length > 1 ? (
          <div className="absolute bottom-[15%] hidden w-full justify-center sm:flex">
            <div className="mx-auto flex h-11 items-center rounded-full border border-white bg-neutral-50/80 text-neutral-500 backdrop-blur-sm dark:border-black dark:bg-neutral-900/80">
              <button
                formAction={() => updateImage(previousImageIndex.toString())}
                aria-label="Previous product image"
                className={buttonClassName}
              >
                <ArrowLeftIcon className="h-5" />
              </button>
              <div className="mx-1 h-6 w-px bg-neutral-500"></div>
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
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
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
                  className="relative w-2/3 flex-none overflow-hidden rounded-xl bg-neutral-50 dark:bg-neutral-900/40"
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
            const isActive = index === imageIndex;
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
