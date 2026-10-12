import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import { isCustomOrderFeatureEnabled } from "lib/custom-order-utils";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_UPLOADS_PER_WINDOW = 20;
const WINDOW_MS = 10 * 60 * 1000;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads are anonymous, so deleting one needs proof you made it: the upload
 * response carries an HMAC of the image id, and DELETE must send it back.
 * Image ids are visible in public URLs, so the id alone isn't enough.
 */
function deleteTokenFor(publicId: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return crypto
    .createHmac("sha256", secret)
    .update(`custom-upload-delete:${publicId}`)
    .digest("base64url");
}

function isValidDeleteToken(publicId: string, token: string) {
  const expected = Buffer.from(deleteTokenFor(publicId));
  const given = Buffer.from(token);
  return (
    expected.length === given.length && crypto.timingSafeEqual(expected, given)
  );
}

function getClientKey(request: NextRequest) {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return "unknown";
}

function isRateLimited(clientKey: string) {
  const now = Date.now();
  const current = rateLimitStore.get(clientKey);

  if (!current || current.resetAt < now) {
    rateLimitStore.set(clientKey, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (current.count >= MAX_UPLOADS_PER_WINDOW) {
    return true;
  }

  rateLimitStore.set(clientKey, { ...current, count: current.count + 1 });
  return false;
}

export async function POST(request: NextRequest) {
  try {
    if (!isCustomOrderFeatureEnabled()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const clientKey = getClientKey(request);
    if (isRateLimited(clientKey)) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again shortly." },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Image is too large. Maximum file size is 8MB." },
        { status: 400 },
      );
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 84 })
      .toBuffer();

    const uploaded = await new Promise<{
      secure_url: string;
      public_id: string;
      width: number;
      height: number;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "dfootprint/custom-orders/requests",
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error("Upload failed"));
              return;
            }
            resolve(result as any);
          },
        )
        .end(outputBuffer);
    });

    return NextResponse.json({
      success: true,
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      deleteToken: deleteTokenFor(uploaded.public_id),
      width: uploaded.width,
      height: uploaded.height,
    });
  } catch (error) {
    console.error("Custom request upload failed:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isCustomOrderFeatureEnabled()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const publicId =
      typeof body.publicId === "string" ? body.publicId.trim() : "";
    const deleteToken =
      typeof body.deleteToken === "string" ? body.deleteToken : "";

    if (!publicId || !deleteToken) {
      return NextResponse.json(
        { error: "publicId and deleteToken are required" },
        { status: 400 },
      );
    }

    if (!isValidDeleteToken(publicId, deleteToken)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!publicId.startsWith("dfootprint/custom-orders/requests/")) {
      return NextResponse.json(
        { error: "Invalid image reference" },
        { status: 400 },
      );
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete custom request image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}
