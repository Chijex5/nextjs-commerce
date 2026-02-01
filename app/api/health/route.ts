import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { db } from "lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const startedAt = Date.now();
  const cloudinaryUsageEnabled =
    process.env.CLOUDINARY_USAGE_ENABLED === "true";

  try {
    await db.execute(sql`SELECT 1`);

    let cloudinaryUsage: unknown = undefined;
    if (cloudinaryUsageEnabled) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      try {
        cloudinaryUsage = await cloudinary.api.usage();
      } catch {
        cloudinaryUsage = { status: "unavailable" };
      }
    }

    return NextResponse.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      database: "ok",
      ...(cloudinaryUsageEnabled ? { cloudinaryUsage } : {}),
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
        database: "unavailable",
        ...(cloudinaryUsageEnabled ? { cloudinaryUsage: "unavailable" } : {}),
      },
      { status: 503 },
    );
  }
}
