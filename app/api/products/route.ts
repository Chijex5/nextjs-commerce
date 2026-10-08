import { getShopPage } from "lib/data/shop";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 48;

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

/** Paginated products for the shop grid's infinite scroll. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const offset = parsePositiveInt(searchParams.get("offset"), 0);
    const limit = Math.max(
      1,
      Math.min(
        MAX_LIMIT,
        parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT),
      ),
    );

    const page = await getShopPage({
      q: searchParams.get("q") ?? undefined,
      sort: searchParams.get("sort"),
      collection: searchParams.get("collection") ?? undefined,
      offset,
      limit,
    });

    return NextResponse.json({
      ...page,
      nextOffset: offset + page.products.length,
    });
  } catch (error) {
    console.error("Failed to fetch paginated products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
