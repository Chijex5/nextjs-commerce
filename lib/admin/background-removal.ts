import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { count, gte } from "drizzle-orm";
import { db } from "lib/db";
import { backgroundRemovals } from "lib/db/schema";
import { PRODUCT_IMAGE_HEIGHT, PRODUCT_IMAGE_WIDTH } from "lib/image-constants";
import sharp from "sharp";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Cloudinary bills every background removal as this many transformations. */
export const TRANSFORMATIONS_PER_REMOVAL = 75;

/** Free-plan usage is measured over a rolling 30 days, so we count the same way. */
export const USAGE_WINDOW_DAYS = 30;

// 100 removals = 7,500 transformations = 7.5 credits, under a third of the
// free plan's 25 monthly credits, leaving room for storage and bandwidth.
const DEFAULT_LIMIT = 100;

const TEMP_FOLDER = "dfootprint/tmp/background-removal";
const MAX_INPUT_EDGE = 2400;
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 45_000;

// Breathing room around the cut-out product, as a fraction of each side.
const PADDING = 0.08;

export type BackgroundRemovalUsage = {
  configured: boolean;
  used: number;
  limit: number;
  remaining: number;
  windowDays: number;
  /** Whole-account figures straight from Cloudinary, when it answers. */
  account: {
    plan: string | null;
    creditsUsed: number;
    creditsLimit: number;
    usedPercent: number;
  } | null;
};

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function backgroundRemovalLimit(): number {
  const n = Number.parseInt(process.env.CLOUDINARY_BG_REMOVAL_LIMIT ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_LIMIT;
}

async function usedInWindow(): Promise<number> {
  const since = new Date(Date.now() - USAGE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ n: count() })
    .from(backgroundRemovals)
    .where(gte(backgroundRemovals.createdAt, since));
  return row?.n ?? 0;
}

async function accountUsage(): Promise<BackgroundRemovalUsage["account"]> {
  try {
    const usage = await cloudinary.api.usage();
    const credits = usage?.credits;
    if (!credits || typeof credits.limit !== "number") return null;
    return {
      plan: typeof usage.plan === "string" ? usage.plan : null,
      creditsUsed: Number(credits.usage) || 0,
      creditsLimit: credits.limit,
      usedPercent: Number(credits.used_percent) || 0,
    };
  } catch (error) {
    console.error("Cloudinary usage lookup failed:", error);
    return null;
  }
}

export async function getBackgroundRemovalUsage(): Promise<BackgroundRemovalUsage> {
  const configured = isCloudinaryConfigured();
  const limit = backgroundRemovalLimit();
  const [used, account] = await Promise.all([
    usedInWindow(),
    configured ? accountUsage() : Promise.resolve(null),
  ]);
  return {
    configured,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    windowDays: USAGE_WINDOW_DAYS,
    account,
  };
}

export async function canRemoveBackground(): Promise<boolean> {
  return (
    isCloudinaryConfigured() &&
    (await usedInWindow()) < backgroundRemovalLimit()
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Cloudinary answers 423 (on-the-fly) or 420 (pending) until the first
 * removal for an asset finishes, then serves the cached result.
 */
async function fetchWhenReady(url: string): Promise<Buffer> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  for (;;) {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if ((res.status !== 423 && res.status !== 420) || Date.now() > deadline) {
      throw new Error(`Background removal failed (HTTP ${res.status})`);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

function uploadTemp(buffer: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: TEMP_FOLDER }, (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload failed"));
        else resolve(result);
      })
      .end(buffer);
  });
}

/**
 * Remove the background of an image with Cloudinary and return a transparent
 * PNG. The source is uploaded to a temporary folder and deleted afterwards
 * (which also deletes the derived cut-out). Every attempt that reaches
 * Cloudinary is logged, because Cloudinary charges for it either way.
 */
export async function removeBackground(
  input: Buffer,
  adminUserId: string | null,
): Promise<Buffer> {
  const source = await sharp(input)
    .rotate()
    .resize({
      width: MAX_INPUT_EDGE,
      height: MAX_INPUT_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  const temp = await uploadTemp(source);
  let succeeded = false;
  try {
    // Signed so it still works if the account has strict transformations on.
    const url = cloudinary.url(temp.public_id, {
      secure: true,
      sign_url: true,
      version: temp.version,
      format: "png",
      transformation: [{ effect: "background_removal" }],
    });
    const cutout = await fetchWhenReady(url);
    succeeded = true;
    return cutout;
  } finally {
    await db
      .insert(backgroundRemovals)
      .values({ adminUserId, succeeded })
      .catch((e) => console.error("Failed to log background removal:", e));
    await cloudinary.uploader
      .destroy(temp.public_id, { invalidate: true })
      .catch((e) => console.error("Failed to delete temp image:", e));
  }
}

// Opaque islands smaller than this share of the biggest one are specks the
// cut-out kept by mistake (a box corner, a stray string), not the product.
const SPECK_RATIO = 0.04;

/** Make every small detached island in the cut-out transparent. */
async function dropSpecks(cutout: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(cutout)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const size = width * height;
  const opaque = (i: number) => data[i * channels + 3]! > 40;

  const label = new Int32Array(size);
  const areas = [0];
  const stack: number[] = [];
  for (let start = 0; start < size; start++) {
    if (label[start] || !opaque(start)) continue;
    const id = areas.length;
    let area = 0;
    label[start] = id;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop()!;
      area++;
      const x = i % width;
      const next = [
        x > 0 ? i - 1 : -1,
        x < width - 1 ? i + 1 : -1,
        i - width,
        i + width,
      ];
      for (const n of next) {
        if (n >= 0 && n < size && !label[n] && opaque(n)) {
          label[n] = id;
          stack.push(n);
        }
      }
    }
    areas.push(area);
  }

  // Clear the specks, then anything faint outside the product's bounds, so
  // trimming frames the product alone.
  const keep = Math.max(...areas) * SPECK_RATIO;
  let [minX, minY, maxX, maxY] = [width, height, -1, -1];
  for (let i = 0; i < size; i++) {
    const id = label[i]!;
    if (!id) continue;
    if (areas[id]! < keep) data[i * channels + 3] = 0;
    else {
      const x = i % width;
      const y = (i - x) / width;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  const MARGIN = 2;
  for (let i = 0; i < size; i++) {
    const x = i % width;
    const y = (i - x) / width;
    if (
      x < minX - MARGIN ||
      x > maxX + MARGIN ||
      y < minY - MARGIN ||
      y > maxY + MARGIN
    )
      data[i * channels + 3] = 0;
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

/**
 * Trim a transparent cut-out to the product, centre it on a white product
 * canvas with even padding, and encode it like every other product photo.
 */
export async function fitCutoutToProductCanvas(
  cutout: Buffer,
  quality: number,
): Promise<Buffer> {
  const trimmed = await sharp(await dropSpecks(cutout))
    .trim()
    .toBuffer();
  const innerW = Math.round(PRODUCT_IMAGE_WIDTH * (1 - 2 * PADDING));
  const innerH = Math.round(PRODUCT_IMAGE_HEIGHT * (1 - 2 * PADDING));
  const padX = Math.round((PRODUCT_IMAGE_WIDTH - innerW) / 2);
  const padY = Math.round((PRODUCT_IMAGE_HEIGHT - innerH) / 2);
  const white = { r: 255, g: 255, b: 255, alpha: 1 };

  // sharp flattens before it resizes, so every padding step must be white.
  return sharp(trimmed)
    .flatten({ background: white })
    .resize({
      width: innerW,
      height: innerH,
      fit: "contain",
      background: white,
    })
    .extend({
      top: padY,
      bottom: PRODUCT_IMAGE_HEIGHT - innerH - padY,
      left: padX,
      right: PRODUCT_IMAGE_WIDTH - innerW - padX,
      background: white,
    })
    .sharpen()
    .webp({ quality })
    .toBuffer();
}
