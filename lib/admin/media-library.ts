/** Where /api/admin/upload puts product photos on Cloudinary. */
export const PRODUCT_MEDIA_PREFIX = "dfootprint/products/";

export type MediaItem = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: string;
  /** Title of a product that already shows this photo, if any. */
  usedBy: string | null;
};

/** A product photo public ID we're willing to read back from Cloudinary. */
export function isProductMediaId(publicId: unknown): publicId is string {
  return (
    typeof publicId === "string" &&
    publicId.startsWith(PRODUCT_MEDIA_PREFIX) &&
    /^[\w\-/.]+$/.test(publicId) &&
    !publicId.includes("..")
  );
}

/**
 * The public ID behind one of our own Cloudinary delivery URLs, e.g.
 * https://res.cloudinary.com/<cloud>/image/upload/v123/dfootprint/products/a.webp
 * → dfootprint/products/a. Null for anything else.
 */
export function publicIdFromUrl(
  src: unknown,
  cloudName: string | undefined,
): string | null {
  if (typeof src !== "string" || !cloudName) return null;
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }
  const base = `/${cloudName}/image/upload/`;
  if (
    url.protocol !== "https:" ||
    url.hostname !== "res.cloudinary.com" ||
    !url.pathname.startsWith(base)
  )
    return null;
  const id = decodeURIComponent(url.pathname.slice(base.length))
    .replace(/^v\d+\//, "")
    .replace(/\.[a-z0-9]+$/i, "");
  return isProductMediaId(id) ? id : null;
}

/** Insert a Cloudinary transformation (e.g. a thumbnail size) into an upload URL. */
export const withTransform = (src: string, t: string) =>
  src.includes("/upload/") ? src.replace("/upload/", `/upload/${t}/`) : src;
