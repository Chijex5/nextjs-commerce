import { defaultSort, sorting } from "lib/constants";
import { getProducts } from "lib/database";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 48;

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sortSlug = searchParams.get("sort");
    const query = searchParams.get("q")?.trim() || undefined;

    const selectedSort =
      sorting.find((item) => item.slug === sortSlug) || defaultSort;

    const offset = parsePositiveInt(searchParams.get("offset"), 0);
    const requestedLimit = parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT);
    const limit = Math.max(1, Math.min(MAX_LIMIT, requestedLimit));

    const products = await getProducts({
      query,
      sortKey: selectedSort.sortKey,
      reverse: selectedSort.reverse,
      offset,
      limit,
    });

    return NextResponse.json({
      products,
      hasMore: products.length === limit,
      nextOffset: offset + products.length,
    });
  } catch (error) {
    console.error("Failed to fetch paginated products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
