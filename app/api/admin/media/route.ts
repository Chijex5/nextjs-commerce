import { v2 as cloudinary } from "cloudinary";
import { eq, inArray } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { isCloudinaryConfigured } from "lib/admin/background-removal";
import { PRODUCT_MEDIA_PREFIX, type MediaItem } from "lib/admin/media-library";
import { db } from "lib/db";
import { productImages, products } from "lib/db/schema";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PAGE_SIZE = 60;

/**
 * Product photos already on Cloudinary, newest first, so photos whose
 * product rows were lost can be picked again instead of re-uploaded.
 */
export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary isn't set up." },
      { status: 503 },
    );
  }

  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;

  try {
    let search = cloudinary.search
      .expression(`resource_type:image AND public_id:${PRODUCT_MEDIA_PREFIX}*`)
      .sort_by("created_at", "desc")
      .max_results(PAGE_SIZE);
    if (cursor) search = search.next_cursor(cursor);
    const result = await search.execute();

    const resources: any[] = result?.resources ?? [];
    const urls = resources.map((r) => r.secure_url as string);
    const used = urls.length
      ? await db
          .select({ url: productImages.url, title: products.title })
          .from(productImages)
          .innerJoin(products, eq(products.id, productImages.productId))
          .where(inArray(productImages.url, urls))
      : [];
    const usedBy = new Map(used.map((u) => [u.url, u.title]));

    const items: MediaItem[] = resources.map((r) => ({
      publicId: r.public_id,
      url: r.secure_url,
      width: r.width,
      height: r.height,
      bytes: r.bytes,
      createdAt: r.created_at,
      usedBy: usedBy.get(r.secure_url) ?? null,
    }));

    return NextResponse.json({
      items,
      nextCursor: result?.next_cursor ?? null,
      total: result?.total_count ?? null,
    });
  } catch (error) {
    console.error("Cloudinary media listing failed:", error);
    return NextResponse.json(
      { error: "Couldn't load photos from Cloudinary" },
      { status: 502 },
    );
  }
}
