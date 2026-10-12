/** Only images uploaded through our own custom-order upload endpoint are accepted. */
export const isOwnUpload = (url: string) => {
  try {
    const parsed = new URL(url);
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "res.cloudinary.com" &&
      (!cloud || parsed.pathname.startsWith(`/${cloud}/`)) &&
      parsed.pathname.includes("/dfootprint/custom-orders/requests/")
    );
  } catch {
    return false;
  }
};

export const toUploadList = (value: unknown, max: number): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(isOwnUpload)
        .slice(0, max)
    : [];

/** Inspiration links: https only, from places customers actually find designs. */
const LINK_HOSTS =
  /(^|\.)(tiktok\.com|instagram\.com|pinterest\.[a-z.]+|pin\.it|facebook\.com|fb\.watch|x\.com|twitter\.com|youtube\.com|youtu\.be|jumia\.com\.ng|etsy\.com|amazon\.[a-z.]+|aliexpress\.com|temu\.com|shein\.com)$/i;

export const toLinkList = (value: unknown, max: number): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => {
          try {
            const u = new URL(item);
            return u.protocol === "https:" && LINK_HOSTS.test(u.hostname) && item.length <= 500;
          } catch {
            return false;
          }
        })
        .slice(0, max)
    : [];
