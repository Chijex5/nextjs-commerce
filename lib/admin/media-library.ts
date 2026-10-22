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

/** Insert a Cloudinary transformation (e.g. a thumbnail size) into an upload URL. */
export const withTransform = (src: string, t: string) =>
  src.includes("/upload/") ? src.replace("/upload/", `/upload/${t}/`) : src;
